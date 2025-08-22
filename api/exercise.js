// /api/exercise.js
import OpenAI from "openai";
import { db } from "./firebaseAdmin"; // <-- make sure file name matches (_firebaseAdmin.js)

// Normalize to a slug so "Pull Up", "pull-up", "pullup" all map
function toSlug(s = "") {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Super simple in-memory cache for recent answers (survives within a lambda warm instance)
const cache = new Map();
const CACHE_TTL_MS = 1000 * 60 * 10; // 10 minutes

function setCache(key, value) {
  cache.set(key, { value, at: Date.now() });
}
function getCache(key) {
  const item = cache.get(key);
  if (!item) return null;
  if (Date.now() - item.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return item.value;
}

// Fallback: build a short, safety-first answer from Firestore doc (no OpenAI)
function buildFallbackAnswer(ex) {
  const bullets = [];

  if (ex?.description) {
    bullets.push(`• **What it is:** ${ex.description}`);
  } else {
    bullets.push(`• **What it is:** ${ex?.name || "This exercise"}.`);
  }

  if (Array.isArray(ex?.targetAreas) && ex.targetAreas.length) {
    bullets.push(`• **Target areas:** ${ex.targetAreas.join(", ")}`);
  }

  if (Array.isArray(ex?.helpsWith) && ex.helpsWith.length) {
    bullets.push(`• **Helps with:** ${ex.helpsWith.join(", ")}`);
  }

  if (Array.isArray(ex?.mayAggravate) && ex.mayAggravate.length) {
    bullets.push(`• **May aggravate:** ${ex.mayAggravate.join(", ")}`);
  }

  if (Array.isArray(ex?.safetyNotes) && ex.safetyNotes.length) {
    bullets.push(`• **Safety notes:** ${ex.safetyNotes.join(" • ")}`);
  } else {
    bullets.push(`• **Safety notes:** Move in a pain‑free range, control the tempo, stop with sharp pain, numbness, or tingling.`);
  }

  return bullets.join("\n");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Parse body (supports Vercel raw body)
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
    if (!nameOrSlug) {
      return res.status(400).json({ error: "Missing exercise name" });
    }

    const slug = toSlug(nameOrSlug);

    // 1) Try by doc id (slug)
    let snap = await db.collection("exercise_glossary").doc(slug).get();

    // 2) Try exact "name" match
    if (!snap.exists) {
      const q = await db
        .collection("exercise_glossary")
        .where("name", "==", nameOrSlug)
        .limit(1)
        .get();
      if (!q.empty) snap = q.docs[0];
    }

    // 3) Fuzzy on common aliases + normalized name (scan a small batch)
    if (!snap.exists) {
      const batch = await db.collection("exercise_glossary").limit(500).get();
      const norm = (s) => s?.toLowerCase().replace(/[^a-z0-9]/g, "");
      const want = norm(nameOrSlug);

      const hit = batch.docs.find((d) => {
        const data = d.data() || {};
        if (norm(data.name) === want) return true;
        if (Array.isArray(data.aliases)) {
          return data.aliases.some((al) => norm(al) === want);
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

    // Check cache
    const cached = getCache(`ans:${snap.id}`);
    if (cached) {
      return res.status(200).json({ ok: true, answer: cached, data: ex, id: snap.id, cached: true });
    }

    // Attempt OpenAI summary — but gracefully fall back if rate limited or any error
    let answer = null;

    if (!process.env.OPENAI_API_KEY) {
      // If key is missing, skip OpenAI and build fallback from our doc
      answer = buildFallbackAnswer(ex);
    } else {
      try {
        const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
        const response = await openai.responses.create({
          model: "gpt-4o-mini",
          temperature: 0.1,
          max_output_tokens: 320,
          input: [
            {
              role: "system",
              content:
                "You are a concise, safety‑aware exercise assistant for the Chronic Relief app. " +
                "Use ONLY the provided JSON; do not invent data; respond as short bullet points."
            },
            {
              role: "user",
              content:
                "Create bullet points with sections: What it is, Target areas, Helps with, May aggravate, Safety notes. " +
                "Keep it under ~120 words. JSON:\n" + JSON.stringify(ex, null, 2)
            },
          ],
        });

        answer = (response.output_text || "").trim();
        if (!answer) answer = buildFallbackAnswer(ex);
      } catch (e) {
        // Rate limit or any OpenAI error → fallback answer
        const msg = e?.response?.data?.error?.message || e?.message || String(e);
        // If you want the client to know it was rate-limited, you can also set a header:
        // if (String(msg).includes("429")) res.setHeader("X-OpenAI-RateLimited", "1");
        answer = buildFallbackAnswer(ex);
      }
    }

    setCache(`ans:${snap.id}`, answer);
    return res.status(200).json({ ok: true, answer, data: ex, id: snap.id });
  } catch (err) {
    const detail = err?.response?.data?.error?.message || err?.message || String(err);
    console.error("exercise route error:", detail);
    const status = String(detail).includes("429") ? 429 :
                   String(detail).includes("invalid_api_key") ? 401 : 500;
    return res.status(status).json({ error: "Exercise service error", detail });
  }
}
