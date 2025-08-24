import { db } from "./firebaseAdmin";

const API_HOST = "exercisedb.p.rapidapi.com";
const BASE = `https://${API_HOST}`;
const HEADERS = () => ({
  "X-RapidAPI-Key": process.env.RAPIDAPI_KEY || "",
  "X-RapidAPI-Host": API_HOST,
});

const slugify = (s = "") =>
  s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

function buildSafety(bodyPart, target, equipment) {
  const bp = (bodyPart || "").toLowerCase();
  const t = (target || "").toLowerCase();
  const eq = (equipment || "").toLowerCase();

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
    helpsWith: uniq(helps),
    mayAggravate: uniq(aggravate),
    safetyNotes: uniq(notes),
  };
}

const cap = (s = "") => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

function toTargetAreas(item) {
  const arr = [];
  if (item.bodyPart) arr.push(cap(item.bodyPart));
  if (item.target) arr.push(cap(item.target));
  if (Array.isArray(item.secondaryMuscles))
    arr.push(...item.secondaryMuscles.map(cap));
  return [...new Set(arr)].slice(0, 6);
}

function buildDescription(item) {
  const ins = Array.isArray(item.instructions)
    ? item.instructions.join(" ")
    : item.instructions;

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
  if (!r.ok) return [];
  return r.json();
}
async function fetchByBodyPart(part, limit = 25) {
  const url = `${BASE}/exercises/bodyPart/${encodeURIComponent(part)}`;
  const r = await fetch(url, { headers: HEADERS() });
  if (!r.ok) return [];
  const data = await r.json();
  return data.slice(0, limit);
}

const STAPLES = [
  {
    name: "Pull-Up",
    equipment: "Body weight",
    bodyPart: "back",
    target: "lats",
    secondaryMuscles: ["biceps", "forearms", "scapulae"],
    description:
      "Hang from a bar and pull your chest toward it by driving your elbows down and back.",
    aliases: ["pull up", "pull-up", "pullup", "strict pull-up", "bodyweight pull-up"],
  },
  {
    name: "Chin-Up",
    equipment: "Body weight",
    bodyPart: "back",
    target: "lats",
    secondaryMuscles: ["biceps", "forearms"],
    description:
      "Underhand grip on bar; pull until chin clears bar while keeping ribs down and shoulders packed.",
    aliases: ["chin up", "chin-up", "chinup"],
  },
  {
    name: "Push-Up",
    equipment: "Body weight",
    bodyPart: "chest",
    target: "pectorals",
    secondaryMuscles: ["triceps", "delts", "core"],
    description:
      "Plank on hands; lower chest to just above the floor and press back to lockout with a braced core.",
    aliases: ["push up", "push-up", "pushup", "press-up"],
  },
  {
    name: "Bodyweight Squat",
    equipment: "Body weight",
    bodyPart: "upper legs",
    target: "glutes",
    secondaryMuscles: ["quads", "hamstrings", "core"],
    description:
      "Stand shoulder‑width; sit hips back and down keeping chest tall; drive through mid‑foot to stand.",
    aliases: ["air squat", "squat", "bodyweight squat", "bw squat"],
  },
  {
    name: "Walking Lunge",
    equipment: "Body weight",
    bodyPart: "upper legs",
    target: "glutes",
    secondaryMuscles: ["quads", "hamstrings"],
    description:
      "Step forward into a lunge, lower under control, then step through into the next stride.",
    aliases: ["walking lunge", "lunge walk"],
  },
  {
    name: "Glute Bridge",
    equipment: "Body weight",
    bodyPart: "upper legs",
    target: "glutes",
    secondaryMuscles: ["hamstrings", "core"],
    description:
      "Lie supine, knees bent; drive heels and squeeze glutes to lift hips until torso and thighs align.",
    aliases: ["hip bridge", "glute bridge"],
  },
  {
    name: "Dead Bug",
    equipment: "Body weight",
    bodyPart: "waist",
    target: "abs",
    secondaryMuscles: ["hip flexors"],
    description:
      "On back with ribs down; alternate extending opposite arm/leg while keeping low back lightly braced.",
    aliases: ["dead bug"],
  },
  {
    name: "Bird Dog",
    equipment: "Body weight",
    bodyPart: "waist",
    target: "abs",
    secondaryMuscles: ["glutes", "back"],
    description:
      "Quadruped; extend opposite arm/leg keeping pelvis level and ribs down; alternate sides.",
    aliases: ["bird dog"],
  },
  {
    name: "Calf Raise",
    equipment: "Body weight",
    bodyPart: "lower legs",
    target: "calves",
    secondaryMuscles: [],
    description:
      "From standing, rise onto the balls of your feet and control back down through full range.",
    aliases: ["calf raise", "heel raise", "standing calf raise"],
  },
  {
    name: "Plank",
    equipment: "Body weight",
    bodyPart: "waist",
    target: "abs",
    secondaryMuscles: ["glutes", "shoulders"],
    description:
      "Forearms under shoulders; body in one line; brace lightly and breathe while maintaining position.",
    aliases: ["front plank", "prone plank", "elbow plank"],
  },
];

function toDocFromAPI(it) {
  const targetAreas = toTargetAreas(it);
  const { helpsWith, mayAggravate, safetyNotes } = buildSafety(
    it.bodyPart,
    it.target,
    it.equipment
  );
  const name = cap(it.name || "");
  const baseAliases = [
    (it.name || "").toLowerCase(),
    (it.name || "").toLowerCase().replace(/\s+/g, ""),
    (it.name || "").toLowerCase().replace(/\s+/g, "-"),
  ];
  return {
    name,
    targetAreas,
    description: buildDescription(it),
    helpsWith,
    mayAggravate,
    safetyNotes,
    aliases: [...new Set(baseAliases)],
    equipment: it.equipment || null,
    bodyPart: it.bodyPart || null,
    target: it.target || null,
    secondaryMuscles: Array.isArray(it.secondaryMuscles) ? it.secondaryMuscles : [],
    gifUrl: it.gifUrl || null,
  };
}

function toDocFromStaple(s) {
  const it = {
    name: s.name,
    equipment: s.equipment,
    bodyPart: s.bodyPart,
    target: s.target,
    secondaryMuscles: s.secondaryMuscles || [],
    instructions: s.description,
  };
  const base = toDocFromAPI(it);
  base.aliases = [...new Set([...(base.aliases || []), ...(s.aliases || [])])];
  return base;
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
    const staplesToTry = [
      "pull up", "chin up", "push up", "plank",
      "bodyweight squat", "walking lunge", "glute bridge",
      "dead bug", "bird dog", "calf raise"
    ];
    const bodyParts = [
      "back", "chest", "upper legs", "lower legs", "shoulders", "waist", "upper arms"
    ];

    const fetched = [];
    for (const q of staplesToTry) {
      try {
        const items = await fetchByName(q);
        items.forEach((it) => fetched.push(it));
      } catch (e) {
        console.warn("fetchByName failed:", q, e?.message || e);
      }
    }
    for (const bp of bodyParts) {
      try {
        const items = await fetchByBodyPart(bp, 12);
        items.forEach((it) => fetched.push(it));
      } catch (e) {
        console.warn("fetchByBodyPart failed:", bp, e?.message || e);
      }
    }

    const bySlug = new Map();
    for (const it of fetched) {
      if (!it?.name) continue;
      const id = slugify(it.name);
      if (bySlug.has(id)) continue;
      bySlug.set(id, toDocFromAPI(it));
    }

    for (const s of STAPLES) {
      const id = slugify(s.name);
      if (!bySlug.has(id)) {
        bySlug.set(id, toDocFromStaple(s));
      } else {
        const existing = bySlug.get(id);
        existing.aliases = [...new Set([...(existing.aliases || []), ...(s.aliases || [])])];
        bySlug.set(id, existing);
      }
    }

    const writer = db.bulkWriter();
    for (const [id, doc] of bySlug.entries()) {
      writer.set(db.collection("exercise_glossary").doc(id), doc, { merge: true });
    }
    await writer.close();

    return res.status(200).json({ ok: true, insertedOrUpdated: bySlug.size });
  } catch (err) {
    console.error("seedFromExerciseDB error:", err?.message || err);
    return res.status(500).json({ error: "Seeding failed", detail: err?.message || String(err) });
  }
}
