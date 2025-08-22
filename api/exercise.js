// /api/exercise.js
import OpenAI from "openai";
import { db } from "../api/firebaseAdmin"; // <-- fixed path

// normalize to a slug so "Pull Up", "pull-up", "pullup" all map
function toSlug(s = "") {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ Missing OPENAI_API_KEY");
    return res.status(500).json({ error: "Server misconfigured." });
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

    // 3) Last‑chance fuzzy: scan a batch and compare normalized names
    if (!snap.exists) {
      const batch = await db.collection("exercise_glossary").limit(1000).get();
      const norm = (s) => s?.toLowerCase().replace(/[^a-z0-9]/g, "");
      const want = norm(nameOrSlug);
      const hit = batch.docs.find((d) => norm(d.data().name) === want);
      if (hit) snap = hit;
    }

    if (!snap.exists) {
      return res
        .status(404)
        .json({ error: "Exercise not found", searched: nameOrSlug, slug });
    }

    const ex = snap.data();

    // Summarize using ONLY our glossary fields
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
            "Use ONLY the provided JSON; do not invent data; be brief and bullet the answer.",
        },
        {
          role: "user",
          content:
            "Create a short bulleted answer with sections: What it is, Target areas, Helps with, May aggravate, Safety notes. " +
            "Keep it under ~120 words. JSON:\n" + JSON.stringify(ex, null, 2),
        },
      ],
    });

    const answer = (response.output_text || "").trim() || "No description available.";
    return res.status(200).json({ ok: true, answer, data: ex, id: snap.id });
  } catch (err) {
    const detail =
      err?.response?.data?.error?.message || err?.message || String(err);
    console.error("exercise route error:", detail);
    const status =
      String(detail).includes("429") ? 429 :
      String(detail).includes("invalid_api_key") ? 401 : 500;
    return res.status(status).json({ error: "Exercise service error", detail });
  }
}
