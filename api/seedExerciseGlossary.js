// /api/seedExerciseGlossary.js
import { db } from "../api/firebaseAdmin";


const EXERCISES = [
  // ===================== KNEE =====================
  {
    name: "Quad Set (Isometric)",
    targetAreas: ["Knee", "Quadriceps"],
    description:
      "Gently tighten the thigh (quad) with the knee straight, holding an isometric contraction.",
    helpsWith: [
      "Early knee rehab",
      "Knee cap (patellofemoral) pain",
      "Activation after injury or surgery",
    ],
    mayAggravate: ["Acute knee swelling if held too long"],
    safetyNotes:
      "Use pain‑free intensity. Hold 3–5 seconds, relax, and breathe. Stop if pain sharpens.",
  },
  {
    name: "Straight Leg Raise",
    targetAreas: ["Knee", "Quadriceps", "Hip flexors"],
    description:
      "With one knee bent and the other straight, lift the straight leg 12–18 inches while keeping the quad tight.",
    helpsWith: [
      "Knee stability",
      "Quad strength without knee bending",
      "Early rehab when squatting is painful",
    ],
    mayAggravate: ["Hip flexor irritation if overdone"],
    safetyNotes:
      "Keep knee locked straight. Lift and lower slowly. If the front of the hip pinches, reduce height.",
  },
  {
    name: "Wall Sit (Short Range)",
    targetAreas: ["Knee", "Quadriceps", "Glutes"],
    description:
      "Back against the wall, slide down a small amount and hold a partial squat isometrically.",
    helpsWith: [
      "Patellofemoral pain (short pain‑free angle)",
      "Quad endurance",
      "Knee confidence",
    ],
    mayAggravate: ["Knee pain if angle is too deep"],
    safetyNotes:
      "Keep range shallow and pain‑free. Start 10–20 seconds. Stop with sharp or increasing pain.",
  },
  {
    name: "Step‑Ups (Low Step)",
    targetAreas: ["Knee", "Glutes", "Quads"],
    description:
      "Step onto a low box/step under control and return down slowly, focusing on knee alignment.",
    helpsWith: [
      "Knee tracking control",
      "Functional strength",
      "Confidence with stairs",
    ],
    mayAggravate: ["Patellar tendon pain if the step is too high"],
    safetyNotes:
      "Use a low step first. Keep knee tracking over toes. Use a handrail for balance if needed.",
  },
  {
    name: "Hamstring Stretch (Gentle)",
    targetAreas: ["Knee", "Hamstrings"],
    description:
      "Light stretch of the back of the thigh using a strap or doorway position.",
    helpsWith: ["Posterior chain mobility", "Knee comfort with sitting"],
    mayAggravate: ["Sciatic nerve irritation if stretched aggressively"],
    safetyNotes:
      "Mild stretch only; no numbness/tingling. Hold 20–30s. Stop if symptoms run below the knee.",
  },
  {
    name: "Clamshell",
    targetAreas: ["Hip", "Glutes", "Knee (indirect)"],
    description:
      "Side‑lying hip external rotation with knees bent, lifting the top knee while feet stay together.",
    helpsWith: [
      "Knee control via hip strength",
      "Patellofemoral tracking support",
      "Hip stability",
    ],
    mayAggravate: ["Greater trochanter tenderness if overcompressed"],
    safetyNotes:
      "Keep pelvis still; small motion. If it pinches at the hip, decrease range or add cushion.",
  },

  // ===================== ANKLE =====================
  {
    name: "Ankle Alphabet (ROM)",
    targetAreas: ["Ankle", "Foot"],
    description:
      "Seated or lying, draw the letters of the alphabet in the air with your foot to improve range of motion.",
    helpsWith: ["Early ankle sprain recovery", "General ankle mobility"],
    mayAggravate: ["Acute swelling if performed too vigorously"],
    safetyNotes:
      "Move gently and within comfort. Stop if pain increases. Elevate after if swelling is present.",
  },
  {
    name: "Calf Raise (Bilateral)",
    targetAreas: ["Ankle", "Calves"],
    description:
      "Standing with support, rise onto both toes and lower under control to strengthen the calf and ankle.",
    helpsWith: ["Ankle stability", "Calf strength", "Return to walking endurance"],
    mayAggravate: ["Achilles tendon pain if volume is too high early on"],
    safetyNotes:
      "Use both legs first. Rise smoothly; slow controlled lowering. Stop with sharp Achilles pain.",
  },
  {
    name: "Ankle Dorsiflexion with Band",
    targetAreas: ["Ankle", "Tibialis anterior"],
    description:
      "Use a light resistance band to pull the foot upward (toes toward shin) against resistance.",
    helpsWith: ["Shin/ankle control", "Foot clearance during walking"],
    mayAggravate: ["Anterior ankle pinching if range is forced"],
    safetyNotes:
      "Stay in pain‑free range. Keep band light/steady. Aim for smooth reps.",
  },
  {
    name: "Ankle Eversion/Inversion with Band",
    targetAreas: ["Ankle", "Peroneals", "Tibialis posterior"],
    description:
      "Rotate the foot outward (eversion) and inward (inversion) against a band to strengthen stabilizers.",
    helpsWith: ["Ankle sprain prevention", "Lateral ankle stability"],
    mayAggravate: ["Fresh lateral sprain if loaded too early"],
    safetyNotes:
      "Begin with low resistance. Avoid end‑range pain. Keep the knee still; move at the ankle.",
  },
  {
    name: "Single‑Leg Balance (Supported)",
    targetAreas: ["Ankle", "Foot", "Balance"],
    description:
      "Stand on one leg with light fingertip support, holding steady and building time gradually.",
    helpsWith: ["Proprioception after sprain", "Functional stability"],
    mayAggravate: ["Ankle fatigue if held too long early on"],
    safetyNotes:
      "Use a counter/chair for light support. Keep the arch active. Stop if ankle wobbles into pain.",
  },
  {
    name: "Calf Stretch (Wall/Step)",
    targetAreas: ["Ankle", "Calves"],
    description:
      "Stretch the calf with knee straight (gastrocnemius) and slightly bent (soleus).",
    helpsWith: ["Ankle mobility", "Walking comfort", "Reducing calf tightness"],
    mayAggravate: ["Achilles irritation if overstretched"],
    safetyNotes:
      "Gentle stretch only; no bouncing. Hold 20–30s. Back off if Achilles feels sharp.",
  },

  // ===================== LOW BACK =====================
  {
    name: "Cat‑Camel (Spinal Mobility)",
    targetAreas: ["Low back", "Spine"],
    description:
      "On hands and knees, alternate rounding and gently arching the back to mobilize the spine.",
    helpsWith: ["Morning stiffness", "Gentle motion without loading"],
    mayAggravate: ["Extension‑sensitive low back pain if arched too far"],
    safetyNotes:
      "Slow, small ranges. Aim for comfort. If any motion hurts, keep it smaller or skip that part.",
  },
  {
    name: "Child’s Pose (Comfort Stretch)",
    targetAreas: ["Low back", "Hips"],
    description:
      "From kneeling, sit back toward heels with arms forward to lightly stretch the back and hips.",
    helpsWith: ["General low back tightness", "Relaxation"],
    mayAggravate: ["Knee discomfort in deep flexion"],
    safetyNotes:
      "Use pillows under hips or chest. Stop with sharp pain or tingling.",
  },
  {
    name: "Bird‑Dog",
    targetAreas: ["Low back", "Core", "Glutes"],
    description:
      "From hands and knees, extend opposite arm and leg while keeping the trunk steady.",
    helpsWith: ["Spinal stability", "Core endurance", "Back pain prevention"],
    mayAggravate: ["Low back discomfort if trunk drops or hyperextends"],
    safetyNotes:
      "Keep ribs down and hips level. Move slowly. If balance is hard, start with just legs or arms.",
  },
  {
    name: "Dead Bug",
    targetAreas: ["Core", "Low back (support)"],
    description:
      "On your back with hips/knees at 90°, alternate lowering one heel and opposite arm while bracing the core.",
    helpsWith: ["Core control", "Support for the lumbar spine"],
    mayAggravate: ["Hip flexor irritation if form is lost"],
    safetyNotes:
      "Keep low back gently pressed toward the floor. Move small and slow at first.",
  },
  {
    name: "Glute Bridge",
    targetAreas: ["Glutes", "Hamstrings", "Low back (support)"],
    description:
      "On your back, press through the feet to lift hips, squeezing glutes at the top.",
    helpsWith: ["Hip extension strength", "Reducing anterior pelvic tilt strain"],
    mayAggravate: ["Low back arching if glutes aren’t engaged"],
    safetyNotes:
      "Drive through heels, ribs down. Stop if pain occurs in the low back; reduce height or add a cushion.",
  },
  {
    name: "Hip Hinge Drill (Dowell/PVC)",
    targetAreas: ["Hips", "Hamstrings", "Low back (technique)"],
    description:
      "Practice bending at the hips while keeping a neutral spine, guided by a stick along head‑back‑hips.",
    helpsWith: ["Safe lifting mechanics", "Reducing lumbar strain"],
    mayAggravate: ["Acute flare if depth is forced"],
    safetyNotes:
      "Keep three points of contact with the stick. Move within a comfortable range; no forced depth.",
  },
  {
    name: "Piriformis Stretch (Figure‑4)",
    targetAreas: ["Hips", "Glutes", "Low back (indirect)"],
    description:
      "Lying or seated, cross one ankle over the opposite knee and pull the thigh toward you to stretch the glutes.",
    helpsWith: ["Posterior hip tightness", "Some sciatic‑like buttock tension"],
    mayAggravate: ["True nerve root irritation if over‑stretched"],
    safetyNotes:
      "Gentle stretch only. Numbness/tingling = back off. Hold 20–30s, easy breathing.",
  },
];

function slugify(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const writer = db.bulkWriter();

    for (const ex of EXERCISES) {
      // Keep only the requested fields
      const { name, targetAreas, description, helpsWith, mayAggravate, safetyNotes } = ex;
      const docData = { name, targetAreas, description, helpsWith, mayAggravate, safetyNotes };

      const id = slugify(name);
      writer.set(db.collection("exercise_glossary").doc(id), docData, { merge: true });
    }

    await writer.close();
    return res.status(200).json({ ok: true, inserted: EXERCISES.length });
  } catch (e) {
    console.error("Seeding error:", e?.message || e);
    return res.status(500).json({ error: "Seeding failed" });
  }
}
