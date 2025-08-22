// /api/exercise.js
import OpenAI from "openai";
import { db } from "./firebaseAdmin";

// ---------- helpers ----------
const API_HOST = "exercisedb.p.rapidapi.com";
const BASE = `https://${API_HOST}`;

function toSlug(s = "") {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}
const norm = (s = "") => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const cap  = (s = "") => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const HEADERS = () => ({
  "X-RapidAPI-Key": process.env.RAPIDAPI_KEY || "",
  "X-RapidAPI-Host": API_HOST,
});

function toTargetAreas(item) {
  const arr = [];
  if (item.bodyPart) arr.push(cap(item.bodyPart));
  if (item.target) arr.push(cap(item.target));
  if (Array.isArray(item.secondaryMuscles))
    arr.push(...item.secondaryMuscles.map(cap));
  return [...new Set(arr)].slice(0, 6);
}

function buildSafety(bodyPart, target, equipment) {
  const bp = (bodyPart || "").toLowerCase();
  const t  = (target   || "").toLowerCase();
  const eq = (equipment|| "").toLowerCase();

  const helps = [];
  const aggravate = [];
  const notes = [];

  if (bp.includes("back") || t.includes("lats") || t.includes("spine"))
    helps.push("Upper‑back strength", "Posture and scapular control");
  if (bp.includes("chest") || t.includes("pectorals"))
    helps.push("Upper‑body pressing strength");
  if (bp.includes("lower legs") || bp.includes("upper legs") || t.includes("glute"))
    helps.push("Lower‑body strength and control");
  if (bp.includes("shoulders") || t.includes("delts"))
    helps.push("Shoulder stability and endurance");
  if (t.includes("abs") || bp.includes("waist"))
    helps.push("Core stability and trunk control");

  if (bp.includes("back")) aggravate.push("Low‑back discomfort if technique is lost");
  if (bp.includes("shoulders")) aggravate.push("Shoulder irritation with poor control");
  if (bp.includes("upper legs") || bp.includes("lower legs"))
    aggravate.push("Knee pain if depth/volume is excessive");
  if (t.includes("forearms") || t.includes("biceps"))
    aggravate.push("Elbow tendinopathy with excessive volume");

  notes.push("Move through a pain‑free range and control the tempo.");
  if (eq && eq !== "body weight") notes.push(`Use ${eq} you can control with good form.`);
  notes.push("Stop with sharp pain, numbness, or tingling.");

  const uniq = (arr) => [...new Set(arr)].filter(Boolean);
  return {
    helpsWith:    uniq(helps),
    mayAggravate: uniq(aggravate),
    safetyNotes:  uniq(notes),
  };
}

function buildDescription(item) {
  const ins = Array.isArray(item.instructions) ? item.instructions.join(" ") : item.instructions;
  if (ins && typeof ins === "string") {
    const brief = ins.split(/(?<=\.)\s+/).slice(0, 2).join(" ");
    if (brief) return brief;
  }
  const equipment = item.equipment ? ` using ${item.equipment}` : "";
  const target = item.target ? ` targeting ${item.target}` : "";
  return `A ${item.name}${equipment}${target}.`;
}

async function fetchByName(q) {
  const url = `${BASE}/exercises/name/${encodeURIComponent(q)}`;
  const r = await fetch(url, { headers: HEADERS() });
  if (!r.ok) throw new Error(`RapidAPI error ${r.status}: ${await r.text()}`);
  return r.json();
}

async function upsertFromRapidByName(query) {
  if (!process.env.RAPIDAPI_KEY) return null;
  const results = await fetchByName(query);
  if (!Array.isArray(results) || results.length === 0) return null;

  // pick best match by normalized equality; else first
  const wanted = norm(query);
  const best = results.find((it) => norm(it.name) === wanted) || results[0];

  const id = toSlug(best.name);
  const targetAreas = toTargetAreas(best);
  const safety = buildSafety(best.bodyPart, best.target, best.equipment);
  const doc = {
    name: cap(best.name),
    targetAreas,
    description: buildDescription(best),
    helpsWith: safety.helpsWith,
    mayAggravate: safety.mayAggravate,
    safetyNotes: safety.safetyNotes,
    aliases: [
      best.name.toLowerCase(),
      best.name.toLowerCase().replace(/\s+/g, ""),
      best.name.toLowerCase().replace(/\s+/g, "-"),
      query.toLowerCase(),
      query.toLowerCase().replace(/\s+/g, ""),
      query.toLowerCase().replace(/\s+/g, "-"),
    ],
    equipment: best.equipment || null,
    bodyPart: best.bodyPart || null,
    target: best.target || null,
    secondaryMuscles: Array.isArray(best.secondaryMuscles) ? best.secondaryMuscles : [],
    gifUrl: best.gifUrl || null,
  };

  await db.collection("exercise_glossary").doc(id).set(doc, { merge: true });
  return { id, doc };
}

// ---------- route ----------
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
    // parse body for Vercel raw body
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
    if (!nameOrSlug) return res.status(400).json({ error: "Missing exercise name" });

    const slug = toSlug(nameOrSlug);
    const wanted = norm(nameOrSlug);

    // 1) id match
    let snap = await db.collection("exercise_glossary").doc(slug).get();

    // 2) exact name
    if (!snap.exists) {
      const q = await db.collection("exercise_glossary").where("name", "==", nameOrSlug).limit(1).get();
      if (!q.empty) snap = q.docs[0];
    }

    // 3) alias contains
    if (!snap.exists) {
      const q = await db.collection("exercise_glossary").where("aliases", "array-contains", nameOrSlug.toLowerCase()).limit(1).get();
      if (!q.empty) snap = q.docs[0];
    }

    // 4) fuzzy
    if (!snap.exists) {
      const batch = await db.collection("exercise_glossary").limit(1000).get();
      const hit = batch.docs.find((d) => {
        const data = d.data() || {};
        if (norm(data.name) === wanted) return true;
        if (Array.isArray(data.aliases)) return data.aliases.some((a) => norm(a) === wanted);
        return false;
      });
      if (hit) snap = hit;
    }

    // 5) last resort: fetch from RapidAPI and upsert, then reload
    if (!snap.exists) {
      const created = await upsertFromRapidByName(nameOrSlug);
      if (created) {
        snap = await db.collection("exercise_glossary").doc(created.id).get();
      }
    }

    if (!snap.exists) {
      return res.status(404).json({ error: "Exercise not found", searched: nameOrSlug, slug });
    }

    const ex = snap.data();

    // Summarize with OpenAI (only using our fields)
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
            "Create a short bulleted answer with sections: What it is, Target areas, Helps with, " +
            "May aggravate, Safety notes. Keep it under ~120 words. JSON:\n" +
            JSON.stringify(ex, null, 2),
        },
      ],
    });

    const answer = (response.output_text || "").trim() || "No description available.";
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
