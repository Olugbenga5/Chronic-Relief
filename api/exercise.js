// /api/exercise.js
import OpenAI from "openai";
import { db } from "./firebaseAdmin"; // server admin SDK

// normalize to a slug so "Pull Up", "pull-up", "pullup" all map
function toSlug(s = "") {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
const norm = (s = "") => s.toLowerCase().replace(/[^a-z0-9]/g, "");

// tiny in-memory cache for warm lambda instances
const cache = new Map();
const TTL = 10 * 60 * 1000;
const getCache = (k) => {
  const v = cache.get(k);
  if (!v) return null;
  if (Date.now() - v.at > TTL) { cache.delete(k); return null; }
  return v.value;
};
const setCache = (k, v) => cache.set(k, { value: v, at: Date.now() });

function fallbackAnswer(ex) {
  const bullets = [];
  bullets.push(`• **What it is:** ${ex?.description || ex?.name || "This exercise"}.`);
  if (Array.isArray(ex?.targetAreas) && ex.targetAreas.length) {
    bullets.push(`• **Target areas:** ${ex.targetAreas.join(", ")}`);
  }
  if (Array.isArray(ex?.helpsWith) && ex.helpsWith.length) {
    bullets.push(`• **Helps with:** ${ex.helpsWith.join(", ")}`);
  }
  if (Array.isArray(ex?.mayAggravate) && ex.mayAggravate.length) {
    bullets.push(`• **May aggravate:** ${ex.mayAggravate.join(", ")}`);
  }
  bullets.push(
    `• **Safety notes:** ${
      Array.isArray(ex?.safetyNotes) && ex.safetyNotes.length
        ? ex.safetyNotes.join(" • ")
        : "Move in a pain‑free range, control the tempo, stop with sharp pain, numbness, or tingling."
    }`
  );
  return bullets.join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // tolerate raw body on Vercel
    let body = req.body;
    if (!body || typeof body !== "object") {
      const raw = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (c) => (data += c));
        req.on("end", () => resolve(data));
        req.on("error", reject);
      });
      try { body = JSON.parse(raw || "{}"); } catch { body = {}; }
    }

    const nameOrSlug = String(body.nameOrSlug || "").trim();
    if (!nameOrSlug) return res.status(400).json({ error: "Missing exercise name" });

    const slug = toSlug(nameOrSlug);
    const wantNorm  = norm(nameOrSlug);
    const wantHyph  = toSlug(nameOrSlug);                 // e.g. "pull-up"
    const wantTight = nameOrSlug.toLowerCase().replace(/\s+/g, ""); // "pullup"

    // 1) by id
    let snap = await db.collection("exercise_glossary").doc(slug).get();

    // 2) by exact name
    if (!snap.exists) {
      const q = await db.collection("exercise_glossary")
        .where("name", "==", nameOrSlug)
        .limit(1).get();
      if (!q.empty) snap = q.docs[0];
    }

    // 3) by aliases (array-contains) — fast and robust
    if (!snap.exists) {
      const candidates = [wantNorm, wantHyph, wantTight, nameOrSlug.toLowerCase()];
      for (const key of candidates) {
        const q = await db.collection("exercise_glossary")
          .where("aliases", "array-contains", key)
          .limit(1).get();
        if (!q.empty) { snap = q.docs[0]; break; }
      }
    }

    // 4) last resort: small scan (helps if aliases were missing)
    if (!snap.exists) {
      const batch = await db.collection("exercise_glossary").limit(300).get();
      const hit = batch.docs.find(d => {
        const ex = d.data() || {};
        if (norm(ex.name) === wantNorm) return true;
        if (Array.isArray(ex.aliases)) {
          return ex.aliases.some(a => [a, norm(a)].includes(wantNorm));
        }
        return false;
      });
      if (hit) snap = hit;
    }

    if (!snap.exists) {
      return res.status(404).json({
        error: "Exercise not found",
        searched: nameOrSlug,
        slug,
        hint: "Try a variation like 'pull-up' or 'chin up'. If this should exist, re-run /api/seedFromExerciseDB."
      });
    }

    const ex = snap.data();

    // cache
    const cached = getCache(`ans:${snap.id}`);
    if (cached) return res.status(200).json({ ok: true, cached: true, answer: cached, data: ex, id: snap.id });

    // Summarize (fallback if rate-limited/missing key)
    let answer;
    try {
      if (!process.env.OPENAI_API_KEY) throw new Error("no_openai_key");
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.responses.create({
        model: "gpt-4o-mini",
        temperature: 0.1,
        max_output_tokens: 320,
        input: [
          { role: "system",
            content: "You are a concise, safety‑aware exercise assistant for the Chronic Relief app. Use ONLY the provided JSON; do not invent data; respond as short bullet points."
          },
          { role: "user",
            content: "Create bullet points with sections: What it is, Target areas, Helps with, May aggravate, Safety notes. Keep it under ~120 words. JSON:\n" + JSON.stringify(ex, null, 2)
          },
        ],
      });
      answer = (response.output_text || "").trim();
      if (!answer) answer = fallbackAnswer(ex);
    } catch (_e) {
      answer = fallbackAnswer(ex);
    }

    setCache(`ans:${snap.id}`, answer);
    return res.status(200).json({ ok: true, answer, data: ex, id: snap.id });
  } catch (err) {
    const detail = err?.response?.data?.error?.message || err?.message || String(err);
    console.error("exercise route error:", detail);
    const status =
      String(detail).includes("429") ? 429 :
      String(detail).includes("invalid_api_key") ? 401 : 500;
    return res.status(status).json({ error: "Exercise service error", detail });
  }
}
