// api/faq.js
import OpenAI from "openai";
import { db, adminAuth } from "../api/firebaseAdmin";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  if (!process.env.OPENAI_API_KEY) {
    console.error("Missing OPENAI_API_KEY");
    return res.status(500).json({ error: "Server misconfigured (OPENAI_API_KEY)." });
  }

  // Parse body (works whether Vercel parsed it or not)
  let body = req.body;
  if (!body || typeof body !== "object") {
    try {
      const raw = await new Promise((resolve, reject) => {
        let data = "";
        req.on("data", (c) => (data += c));
        req.on("end", () => resolve(data));
        req.on("error", reject);
      });
      body = JSON.parse(raw || "{}");
    } catch {
      body = {};
    }
  }

  const question = String(body.question || "").slice(0, 500).trim();
  if (!question) return res.status(400).json({ error: "Missing question" });

  // Optional: verify Firebase ID token
  let userId = null;
  try {
    const authz = req.headers.authorization || "";
    if (authz.startsWith("Bearer ")) {
      const idToken = authz.slice(7);
      const decoded = await adminAuth.verifyIdToken(idToken);
      userId = decoded.uid;
    }
  } catch (e) {
    // token invalid/expired – continue anonymously
  }

  // --- 1) Get answer from OpenAI ---
  let answer = "Sorry, I don’t have an answer for that yet.";
  try {
    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    // Use chat.completions for widest compatibility with SDKs
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      temperature: 0.2,
      max_tokens: 300,
      messages: [
        {
          role: "system",
          content:
            "You are the Chronic Relief FAQ assistant. Be concise and only answer about the app (exercises, routines, progress, login, data). If unsure, say you don't know.",
        },
        { role: "user", content: question },
      ],
    });

    answer =
      completion.choices?.[0]?.message?.content?.trim() ||
      "Sorry, I don’t have an answer for that yet.";
  } catch (e) {
    const msg = e?.response?.data?.error?.message || e?.message || String(e);
    console.error("OpenAI error:", msg);
    // If OpenAI failed, we still return a 500 to the client
    if (String(msg).includes("429")) {
      return res.status(429).json({ error: "We’re getting a lot of questions. Try again soon." });
    }
    return res.status(500).json({ error: "FAQ service error (OpenAI)." });
  }

  // --- 2) Log to Firestore (don’t block the user if logging fails) ---
  try {
    await db.collection("faq_logs").add({
      userId,
      question,
      answer,
      source: "faq",
      createdAt: new Date(),
      ua: req.headers["user-agent"] || "",
    });
  } catch (e) {
    const msg = e?.message || String(e);
    console.error("Firestore log error:", msg);
  }

  return res.status(200).json({ answer });
}
