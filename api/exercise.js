import OpenAI from "openai";
import { db } from "../api/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

  const { nameOrSlug } = req.body || {};
  if (!nameOrSlug) return res.status(400).json({ error: "Missing exercise name" });

  try {
    const slug = nameOrSlug.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    let snap = await db.collection("exercise_glossary").doc(slug).get();

    if (!snap.exists) {
      const q = await db.collection("exercise_glossary").where("name", "==", nameOrSlug).limit(1).get();
      if (!q.empty) snap = q.docs[0];
    }
    if (!snap.exists) return res.status(404).json({ error: "Exercise not found" });

    const ex = snap.data();

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.1,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content:
            "You are a concise, safety‑aware exercise assistant. Use ONLY the provided JSON and do not invent facts."
        },
        {
          role: "user",
          content:
            "Create a short, bulleted answer with: What it is, Target areas, Helps with, May aggravate, Safety notes.\n\nJSON:\n" +
            JSON.stringify(ex, null, 2)
        }
      ]
    });

    const answer = completion.choices?.[0]?.message?.content?.trim() || "No description available.";
    return res.status(200).json({ answer, data: ex });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: "Exercise service error" });
  }
}
