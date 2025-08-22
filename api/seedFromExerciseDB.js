// api/seedFromExerciseDB.js
import { db } from "../api/firebaseAdmin";

const API_HOST = "exercisedb.p.rapidapi.com";
const BASE = `https://${API_HOST}`;
const HEADERS = () => ({
  "X-RapidAPI-Key": process.env.RAPIDAPI_KEY || "",
  "X-RapidAPI-Host": API_HOST,
});

function slugify(s = "") {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

// Small, safe heuristics to fill "helpsWith / mayAggravate / safetyNotes"
function buildSafety(bodyPart, target, equipment) {
  const bp = (bodyPart || "").toLowerCase();
  const t = (target || "").toLowerCase();
  const eq = (equipment || "").toLowerCase();

  const helps = [];
  const aggravate = [];
  const notes = [];

  // HelpsWith
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

  // MayAggravate
  if (bp.includes("back")) aggravate.push("Low‑back discomfort if technique is lost");
  if (bp.includes("shoulders")) aggravate.push("Shoulder irritation with poor control");
  if (bp.includes("upper legs") || bp.includes("lower legs"))
    aggravate.push("Knee pain if depth/volume is excessive");
  if (t.includes("forearms") || t.includes("biceps"))
    aggravate.push("Elbow tendinopathy with excessive volume");

  // SafetyNotes
  notes.push("Move through a pain‑free range and control the tempo.");
  if (eq && eq !== "body weight") notes.push(`Use ${eq} you can control with good form.`);
  notes.push("Stop with sharp pain, numbness, or tingling.");

  // Uniques
  const uniq = (arr) => [...new Set(arr)].filter(Boolean);
  return {
    helpsWith: uniq(helps),
    mayAggravate: uniq(aggravate),
    safetyNotes: uniq(notes),
  };
}

function toTargetAreas(item) {
  // ExerciseDB fields commonly: bodyPart, target, secondaryMuscles[]
  const arr = [];
  if (item.bodyPart) arr.push(cap(item.bodyPart));
  if (item.target) arr.push(cap(item.target));
  if (Array.isArray(item.secondaryMuscles))
    arr.push(...item.secondaryMuscles.map(cap));
  // unique + short
  return [...new Set(arr)].slice(0, 6);
}

function cap(s = "") {
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : s;
}

function buildDescription(item) {
  // If ExerciseDB has "instructions" (newer dataset), use first 1–2 sentences
  const ins = Array.isArray(item.instructions) ? item.instructions.join(" ") : item.instructions;
  if (ins && typeof ins === "string") {
    const brief = ins.split(/(?<=\.)\s+/).slice(0, 2).join(" ");
    if (brief) return brief;
  }
  // Fallback
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

async function fetchByBodyPart(part, limit = 25) {
  const url = `${BASE}/exercises/bodyPart/${encodeURIComponent(part)}`;
  const r = await fetch(url, { headers: HEADERS() });
  if (!r.ok) throw new Error(`RapidAPI error ${r.status}: ${await r.text()}`);
  const data = await r.json();
  return data.slice(0, limit);
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }
  if (!process.env.RAPIDAPI_KEY) {
    return res.status(500).json({ error: "Missing RAPIDAPI_KEY env var" });
  }

  try {
    // What to import:
    // 1) Named staples to ensure "pull up", "push up", etc. exist
    // 2) A small, curated batch per bodyPart (optional)
    const staples = [
      "pull up", "chin up", "push up", "plank", "bodyweight squat",
      "lunge", "glute bridge", "dead bug", "bird dog", "calf raise",
    ];

    const bodyParts = ["back", "chest", "upper legs", "lower legs", "shoulders", "waist", "upper arms"];

    const fetched = [];
    // Named
    for (const q of staples) {
      try {
        const items = await fetchByName(q);
        items.forEach((it) => fetched.push(it));
      } catch (e) {
        console.warn("fetchByName failed:", q, e.message);
      }
    }
    // A few per bodyPart to enrich (optional)
    for (const bp of bodyParts) {
      try {
        const items = await fetchByBodyPart(bp, 10);
        items.forEach((it) => fetched.push(it));
      } catch (e) {
        console.warn("fetchByBodyPart failed:", bp, e.message);
      }
    }

    // Transform & upsert
    const bySlug = new Map();
    for (const it of fetched) {
      if (!it?.name) continue;
      const id = slugify(it.name);
      if (bySlug.has(id)) continue;

      const targetAreas = toTargetAreas(it);
      const { helpsWith, mayAggravate, safetyNotes } = buildSafety(it.bodyPart, it.target, it.equipment);
      const doc = {
        name: cap(it.name),
        targetAreas,
        description: buildDescription(it),
        helpsWith,
        mayAggravate,
        safetyNotes,
        // useful lookups:
        aliases: [
          it.name.toLowerCase(),
          it.name.toLowerCase().replace(/\s+/g, ""),
          it.name.toLowerCase().replace(/\s+/g, "-"),
        ],
        // (optional) raw fields you might want later:
        equipment: it.equipment || null,
        bodyPart: it.bodyPart || null,
        target: it.target || null,
        secondaryMuscles: Array.isArray(it.secondaryMuscles) ? it.secondaryMuscles : [],
        gifUrl: it.gifUrl || null,
      };

      bySlug.set(id, doc);
    }

    const writer = db.bulkWriter();
    for (const [id, doc] of bySlug.entries()) {
      writer.set(db.collection("exercise_glossary").doc(id), doc, { merge: true });
    }
    await writer.close();

    return res.status(200).json({ ok: true, insertedOrUpdated: bySlug.size });
  } catch (err) {
    console.error("seedFromExerciseDB error:", err?.message || err);
    return res.status(500).json({ error: "Seeding failed" });
  }
}
