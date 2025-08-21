// api/faq.js
const OpenAI = require("openai");

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // ✅ Clear signal if the key isn't present on Vercel
  if (!process.env.OPENAI_API_KEY) {
    console.error("❌ Missing OPENAI_API_KEY in environment variables");
    return res.status(500).json({
      error:
        "Missing OpenAI API key. Set OPENAI_API_KEY in your Vercel project’s Environment Variables and redeploy.",
    });
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
    try { parsed = JSON.parse(raw || "{}"); } catch (_) {}

    const question = String(parsed.question || "").slice(0, 500);
    if (!question) return res.status(400).json({ error: "Missing question" });

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    const response = await openai.responses.create({
      // You can switch to "gpt-4o-mini" for cheaper/faster replies
      model: "gpt-4.1-mini",
      max_output_tokens: 240,
      input: [
        {
          role: "system",
          content:
            "You are the Chronic Relief FAQ assistant. Be concise and only answer about the app. " +
            "If unsure, say you don't know and suggest the next step.",
        },
        { role: "user", content: question },
      ],
    });

    const answer = response.output_text || "Sorry, I don't have an answer.";
    return res.status(200).json({ answer });
  } catch (err) {
    const detail =
      err?.response?.data?.error?.message ||
      err?.message ||
      String(err);

    console.error("FAQ function error:", detail);

    if (String(detail).includes("429")) {
      // Friendly message for rate limits
      return res
        .status(429)
        .json({ error: "We’re receiving a lot of questions. Please try again shortly." });
    }

    return res.status(500).json({ error: "FAQ service error" });
  }
};
