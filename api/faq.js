// api/faq.js
import OpenAI from "openai";
import { db, adminAuth } from "./_firebaseAdmin";

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
    // Parse body (handles raw or already-parsed)
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

    // Optional: verify Firebase user ID token sent from client (Authorization: Bearer <idToken>)
    let userId = null;
    const authz = req.headers.authorization || "";
    if (authz.startsWith("Bearer ")) {
      const idToken = authz.slice(7);
      try {
        const decoded = await adminAuth.verifyIdToken(idToken);
        userId = decoded.uid;
      } catch (_e) {
        // token invalid/expired – continue anonymously
      }
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      max_output_tokens: 300,
      temperature: 0.2,
      input: [
        {
          role: "system",
          content:
            "You are the Chronic Relief FAQ assistant. Be concise and only answer about the app (exercises, routines, progress, login, data). If unsure, say you don't know.",
        },
        { role: "user", content: question },
      ],
    });

    const answer =
      response.output_text?.trim() ||
      "Sorry, I don’t have an answer for that yet.";

    // 🔐 Server-side log to Firestore
    const doc = {
      userId, // null if anonymous
      question,
      answer,
      source: "faq", // tag feature/source
      createdAt: new Date(), // server time
      ua: req.headers["user-agent"] || "",
    };
    await db.collection("faq_logs").add(doc);

    return res.status(200).json({ answer });
  } catch (err) {
    const msg =
      err?.response?.data?.error?.message || err?.message || String(err);
    console.error("FAQ error:", msg);

    if (String(msg).includes("429")) {
      return res
        .status(429)
        .json({ error: "We’re getting a lot of questions. Try again soon." });
    }
    return res.status(500).json({ error: "FAQ service error" });
  }
}
