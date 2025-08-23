// /api/exercise.js
import OpenAI from "openai";
import { db } from "./firebaseAdmin";

function toSlug(s = "") {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
function norm(s = "") {
  return s.toLowerCase().replace(/[^a-z0-9]/g, "");
}
function uniq(arr) {
  return [...new Set(arr)].filter(Boolean);
}
function buildVariants(s = "") {
  const lower = (s || "").toLowerCase().trim();
  const hyph = lower.replace(/\s+/g, "-");
  const nosp = lower.replace(/\s+/g, "");
  const dehy = lower.replace(/-/g, " ");
  return uniq([lower, hyph, nosp, dehy]);
}

const cache = new Map();
const CACHE_TTL = 10 * 60 * 1000;
function setCache(k, v) { cache.set(k, { v, t: Date.now() }); }
function getCache(k) {
  const it = cache.get(k);
  if (!it) return null;
  if (Date.now() - it.t > CACHE_TTL) { cache.delete(k); return null; }
  return it.v;
}

// Fallback summary if OpenAI is unavailable
function fallbackAnswer(ex) {
  const bullets = [];
  if (ex?.description) bullets.push(`• **What it is:** ${ex.description}`);
  else bullets.push(`• **What it is:** ${ex?.name || "This exercise"}.`);

  if (Array.isArray(ex?.targetAreas) && ex.targetAreas.length)
    bullets.push(`• **Target areas:** ${ex.targetAreas.join(", ")}`);

  if (Array.isArray(ex?.helpsWith) && ex.helpsWith.length)
    bullets.push(`• **Helps with:** ${ex.helpsWith.join(", ")}`);

  if (Array.isArray(ex?.mayAggravate) && ex.mayAggravate.length)
    bullets.push(`• **May aggravate:** ${ex.mayAggravate.join(", ")}`);

  if (Array.isArray(ex?.safetyNotes) && ex.safetyNotes.length)
    bullets.push(`• **Safety notes:** ${ex.safetyNotes.join(" • ")}`);
  else
    bullets.push(`• **Safety notes:** Move in a pain‑free range, control the tempo, stop with sharp pain, numbness, or tingling.`);

  return bullets.join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // parse body (works with raw body on Vercel)
  let body = req.body;
  if (!body || typeof body !== "object") {
    const raw = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", c => (data += c));
      req.on("end", () => resolve(data));
      req.on("error", reject);
    });
    try { body = JSON.parse(raw || "{}"); } catch { body = {}; }
  }

  const nameOrSlug = String(body.nameOrSlug || "").trim();
  if (!nameOrSlug) {
    return res.status(400).json({ error: "Missing exercise name" });
  }

  try {
    const slug = toSlug(nameOrSlug);
    const variants = buildVariants(nameOrSlug);    // ["pull up", "pull-up", "pullup", "pull up"...]

    let snap = await db.collection("exercise_glossary").doc(slug).get();

    if (!snap.exists) {
      const q = await db.collection("exercise_glossary")
        .where("name", "==", nameOrSlug)
        .limit(1).get();
      if (!q.empty) snap = q.docs[0];
    }

    // we try several alias variants to maximize success with the seeder's aliases
    if (!snap.exists) {
      for (const v of variants) {
        const q = await db.collection("exercise_glossary")
          .where("aliases", "array-contains", v)
          .limit(1).get();
        if (!q.empty) { snap = q.docs[0]; break; }
      }
    }

    if (!snap.exists) {
      const want = norm(nameOrSlug);
      const batch = await db.collection("exercise_glossary").limit(1000).get();

      // exact normalized match on name or aliases
      let hit = batch.docs.find(d => {
        const data = d.data() || {};
        if (norm(data.name) === want) return true;
        if (Array.isArray(data.aliases) && data.aliases.some(a => norm(a) === want)) return true;
        return false;
      });

      if (!hit) {
        hit = batch.docs.find(d => {
          const data = d.data() || {};
          const nName = norm(data.name || "");
          if (nName.includes(want) || want.includes(nName)) return true;
          if (Array.isArray(data.aliases)) {
            return data.aliases.some(a => {
              const na = norm(a);
              return na.includes(want) || want.includes(na);
            });
          }
          return false;
        });
      }

      if (hit) snap = hit;
    }

    if (!snap.exists) {
      return res.status(404).json({
        error: "Exercise not found",
        searched: nameOrSlug,
        slug,
        hint: "Try a specific variation you seeded (e.g., 'walking lunge', 'archer pull up')."
      });
    }

    const ex = snap.data();

    const cached = getCache(`ans:${snap.id}`);
    if (cached) {
      return res.status(200).json({ ok: true, answer: cached, data: ex, id: snap.id, cached: true });
    }

    let answer;
    if (!process.env.OPENAI_API_KEY) {
      answer = fallbackAnswer(ex);
    } else {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const resp = await openai.responses.create({
          model: "gpt-4o-mini",
          temperature: 0.1,
          max_output_tokens: 320,
          input: [
            {
              role: "system",
              content:
                "You are a concise, safety‑aware exercise assistant for the Chronic Relief app. " +
                "Use ONLY the provided JSON; do not invent information; respond as short bullet points."
            },
            {
              role: "user",
              content:
                "Write bullet points with: What it is, Target areas, Helps with, May aggravate, Safety notes. " +
                "Keep it under ~120 words. JSON:\n" + JSON.stringify(ex, null, 2)
            },
          ],
        });
        answer = (resp.output_text || "").trim() || fallbackAnswer(ex);
      } catch (e) {
        answer = fallbackAnswer(ex);
      }
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
