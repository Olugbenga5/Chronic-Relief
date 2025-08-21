// api/faq.js
import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error("❌ Missing OPENAI_API_KEY");
    return res.status(500).json({
      error:
        "Missing OpenAI API key. Set OPENAI_API_KEY in your project environment and redeploy.",
    });
  }

  try {
    // Handle both parsed and raw bodies (Vercel Node sometimes doesn't auto-parse)
    let body = req.body;
    if (!body || typeof body !== "object") {
      const raw = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (c) => (data += c));
        req.on("end", () => resolve(data));
        req.on("error", reject);
      });
      try {
        body = JSON.parse(raw || "{}");
      } catch {
        body = {};
      }
    }

    const question = String(body.question || "").slice(0, 500).trim();
    if (!question) return res.status(400).json({ error: "Missing question" });

    const openai = new OpenAI({ apiKey });

    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      max_output_tokens: 300,
      temperature: 0.2,
      input: [
        {
          role: "system",
          content:
            "You are the Chronic Relief FAQ assistant. Be concise, friendly, and accurate. " +
            "Only answer questions about the Chronic Relief app (exercises, routines, progress, login, data). " +
            "If the question is unrelated or medical advice, say you don't know and suggest a next step.",
        },
        {
          role: "user",
          content: question,
        },
      ],
    });

    const answer =
      response.output_text?.trim() ||
      "Sorry, I don’t have an answer for that yet.";

    return res.status(200).json({ answer });
  } catch (err) {
    const msg =
      err?.response?.data?.error?.message || err?.message || String(err);
    console.error("FAQ error:", msg);

    if (String(msg).includes("429")) {
      return res
        .status(429)
        .json({ error: "We’re getting a lot of questions. Please try again soon." });
    }
    return res.status(500).json({ error: "FAQ service error" });
  }
}


