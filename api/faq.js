// api/faq.js
const OpenAI = require("openai");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    // Read raw body & parse JSON (Vercel Node functions don't auto-parse)
    const raw = await new Promise((resolve, reject) => {
      let data = "";
      req.on("data", (c) => (data += c));
      req.on("end", () => resolve(data));
      req.on("error", reject);
    });

    let parsed = {};
    try { parsed = JSON.parse(raw || "{}"); } catch (_e) {}

    const question = String(parsed.question || "").slice(0, 500);
    if (!question) return res.status(400).json({ error: "Missing question" });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.responses.create({
      model: "gpt-4.1-mini",
      input: [
        {
          role: "system",
          content:
            "You are the Chronic Relief FAQ assistant. Be concise and only answer about the app. " +
            "If unsure, say you don't know and suggest the next step."
        },
        { role: "user", content: question }
      ]
    });

    const answer = response.output_text || "Sorry, I don't have an answer.";
    return res.status(200).json({ answer });
  } catch (err) {
    console.error("FAQ function error:", err);
    return res.status(500).json({ error: "FAQ service error" });
  }
};
