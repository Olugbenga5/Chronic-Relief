// api/faq.js
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed it" });
  }

  try {
    const question = String(req.body?.question || "").slice(0, 500);
    if (!question) return res.status(400).json({ error: "Missing question" });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are the Chronic Relief FAQ assistant. Be concise and only answer about the app. " +
            "If unsure, say you don't know and suggest a next step."
        },
        { role: "user", content: question }
      ]
    });

    const answer = response.output_text || "Sorry, I don't have an answer.";
    res.status(200).json({ answer });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "FAQ service error" });
  }
}
