import { useState, useEffect } from "react";

// ─────────────────────────────────────────────
// EQUIPMENT CONSTRAINTS
// ─────────────────────────────────────────────
const MAX_DB = 52.5;
const AVAILABLE_KBS = [10, 20, 25, 55, 70];

function roundBar(lb) { return Math.round(lb / 5) * 5; }
function roundDB(lb) { return Math.min(MAX_DB, Math.round(lb / 2.5) * 2.5); }
function closestKB(lb) { return AVAILABLE_KBS.reduce((a, b) => Math.abs(b - lb) < Math.abs(a - lb) ? b : a); }

function calcBar(oneRM, intensity) { return roundBar(oneRM * intensity); }

// mph -> "MM:SS/mi" pace string
function pace(mph) {
  if (!mph || mph <= 0) return "";
  const total = 60 / mph;
  const mins = Math.floor(total);
  const secs = Math.round((total - mins) * 60);
  return mins + ":" + secs.toString().padStart(2,"0") + "/mi";
}
function spd(mph) { return mph + " mph · " + pace(mph); }
function spdRange(lo, hi) { return lo + "–" + hi + " mph · " + pace(hi) + "–" + pace(lo); }

// Returns { display, sub } for a DB exercise. Includes calisthenics/BB subs when capped.
function dbCalc(benchRM, fraction, exerciseName) {
  const idealPerHand = (benchRM * fraction * 0.9) / 2;
  const capped = roundDB(idealPerHand);
  const over = idealPerHand > MAX_DB;
  let sub = null;
  if (over) {
    const name = exerciseName.toLowerCase();
    if (name.includes("incline")) {
      const bbW = calcBar(benchRM * fraction, 1);
      const kb = closestKB(idealPerHand);
      sub = "DBs capped (" + MAX_DB + "lb max) — pick one: (A) Incline BB press " + bbW + " lb  |  (B) Banded push-up: loop band behind upper back, hands on floor (~20-40 lb extra)  |  (C) Pike push-up feet elevated on bench (upper chest/shoulder angle)  |  (D) " + kb + " lb KB floor press per arm";
    } else if (name.includes("flat") || name.includes("floor") || name.includes("press")) {
      const bbW = calcBar(benchRM * fraction, 1);
      const kb = closestKB(idealPerHand);
      sub = "DBs capped (" + MAX_DB + "lb max) — pick one: (A) BB flat/floor press " + bbW + " lb  |  (B) Banded push-up: band looped behind upper back  |  (C) Weighted push-up: plate or vest on back  |  (D) " + kb + " lb KB floor press per arm";
    } else if (name.includes("row")) {
      sub = "DBs capped — sub barbell row " + calcBar(benchRM * fraction * 0.9, 1) + " lb";
    } else {
      sub = "DBs capped — use 4-1-2 tempo (4s down, 1s hold, 2s up) to increase difficulty";
    }
  }
  return { display: capped + " lb DBs", sub };
}

// ─────────────────────────────────────────────
// PROGRAM BUILDER — all weights derived from maxes
// ─────────────────────────────────────────────
function buildProgram(maxes) {
  const { bench, squat, press, row, deadlift, clean } = maxes;

  function ex(name, sets, reps, weightStr, sub, cue) {
    return { name, sets, reps, weight: weightStr, sub: sub || null, cue };
  }
  function dbEx(name, sets, reps, benchFrac, cue) {
    const { display, sub } = dbCalc(bench, benchFrac, name);
    return { name, sets, reps, weight: display, sub, cue };
  }
  function bwEx(name, sets, reps, weightStr, cue) {
    return { name, sets, reps, weight: weightStr || "BW", sub: null, cue };
  }

  return {
    1: {
      schedule: ["Upper Strength", "Lower Strength", "HIIT + Core", "Upper Hypertrophy", "Cardio Steady-State", "REST"],
      days: {
        "Upper Strength": {
          note: "Rest 90–120s. Tempo 3-1-1. ~78% intensity.",
          exercises: [
            ex("Barbell Bench Press", 4, "5", `${calcBar(bench,0.78)} lb`, null, "Retract scapula, leg drive, touch chest"),
            ex("Barbell Row (Pendlay)", 4, "5", `${calcBar(row,0.78)} lb`, null, "Bar to lower chest, explosive pull"),
            ex("Overhead Press (BB)", 3, "6", `${calcBar(press,0.78)} lb`, null, "Brace core, don't hyperextend lumbar"),
            ex("Weighted Pull-Up", 3, "5", `BW+${roundBar(bench*0.09)} lb`, null, "Full dead hang, chest to bar"),
            ex("Close-Grip Bench", 3, "8", `${calcBar(bench,0.70)} lb`, null, "Elbows tucked, tricep focused"),
            ex("Barbell Curl", 3, "8", `${calcBar(bench*0.34,1)} lb`, null, "No swing, full ROM"),
          ]
        },
        "Lower Strength": {
          note: "Rest 2–3 min on squats. Belt optional. ~78% intensity.",
          exercises: [
            ex("Back Squat", 4, "5", `${calcBar(squat,0.78)} lb`, null, "Brace 360°, knees track toes, drive the floor away"),
            ex("Romanian Deadlift", 3, "8", `${calcBar(deadlift,0.62)} lb`, null, "Hinge — bar drags legs, feel hamstring stretch"),
            ex("Front Squat", 3, "6", `${calcBar(squat,0.60)} lb`, null, "Elbows high, upright torso, brace hard"),
            ex("Walking Lunge (BB)", 3, "10/leg", `${calcBar(squat,0.38)} lb`, null, "Drive through heel, control knee, stay tall"),
            ex("Standing Calf Raise", 4, "12", `${calcBar(squat,0.62)} lb`, null, "Full stretch at bottom, 2s pause, explosive up"),
            bwEx("Ab Wheel Rollout", 3, "10", "BW", "Hollow body, don't let lumbar drop"),
          ]
        },
        "HIIT + Core": {
          note: "Total ~35 min. Intensity is key — max effort on work intervals.",
          exercises: [
            bwEx("Jump Rope Warmup", 1, "3 min", "Moderate pace", "Get HR up gradually"),
            bwEx("Treadmill Sprint", 8, "30s ON / 90s OFF", "9-10 mph (6:00-6:40/mi) / 6% inc", "Max effort on work intervals"),
            bwEx("Plank", 3, "45s", "BW", "Squeeze glutes + abs, neutral spine"),
            bwEx("Hanging Leg Raise", 3, "12", "BW", "No swing, control descent"),
            bwEx("Pallof Press", 3, "10/side", "Band / light cable", "Anti-rotation — resist turning"),
            bwEx("Dead Bug", 3, "8/side", "BW", "Lower back glued to floor"),
          ]
        },
        "Upper Hypertrophy": {
          note: "Rest 60–90s. Pump focus. 1–2 RIR. DB cap = 52.5lb — check orange notes.",
          exercises: [
            dbEx("Incline Dumbbell Press", 4, "10", 0.72, "Slight arch, elbows 45°, 3s descent"),
            bwEx("Cable / Band Row", 4, "12", "Heavy band", "Squeeze rhomboids at end"),
            ex("Dumbbell Lateral Raise", 4, "15", `${roundDB(bench*0.12)} lb DBs`, null, "Slight forward lean, pinky up"),
            (() => { const w = roundDB(bench*0.22); const over = w >= MAX_DB; return ex("Dumbbell Hammer Curl", 3, "12", `${w} lb DBs`, over ? `Ideal ~${Math.round(bench*0.22)}lb — use 4-1-2 tempo` : null, "Neutral grip, full stretch at bottom"); })(),
            (() => { const w = roundDB(bench*0.26); const over = w >= MAX_DB; return ex("Tricep Overhead Extension", 3, "12", `${w} lb DB`, over ? `Ideal ~${Math.round(bench*0.26)}lb — swap to close-grip bench ${calcBar(bench,0.55)} lb or heavy band pushdowns` : null, "Elbows in, full stretch at top"); })(),
            bwEx("Face Pull (band)", 3, "15", "Medium band", "External rotation at end ROM"),
          ]
        },
        "Cardio Steady-State": {
          note: "Zone 2: HR 130–145 bpm. Conversational pace the whole time.",
          exercises: [
            bwEx("Treadmill Walk/Jog", 1, "40 min", "3.5-4.5 mph (13:20-17:08/mi) / 4% inc", "Stay in Zone 2 — no harder"),
            bwEx("Cool Down Walk", 1, "5 min", "2.5 mph (24:00/mi) flat", "Let HR drop gradually"),
          ]
        },
      }
    },

    2: {
      schedule: ["Upper Power", "Lower Power + Oly", "Conditioning Circuit", "Upper Volume", "Tempo Run", "REST"],
      days: {
        "Upper Power": {
          note: "Heavier than Phase 1. Rest 2 min. Compensatory acceleration.",
          exercises: [
            ex("Barbell Bench Press", 5, "4", `${calcBar(bench,0.86)} lb`, null, "Compensatory acceleration — push explosively"),
            ex("Barbell Row (Pendlay)", 5, "4", `${calcBar(row,0.86)} lb`, null, "Explosive pull — control the drop"),
            ex("Push Press", 4, "4", `${calcBar(press,0.82)} lb`, null, "Dip-drive-press, lockout overhead"),
            ex("Weighted Pull-Up", 4, "5", `BW+${roundBar(bench*0.15)} lb`, null, "Full ROM every rep, chest to bar"),
            (() => { const { display, sub } = dbCalc(bench, 0.76, "Floor Press"); return ex("Dumbbell Floor Press", 3, "8", display, sub ? sub + ` — or ${closestKB((bench*0.76*0.9)/2)}lb KB per arm` : null, "Pause at bottom 1s, explosive drive"); })(),
            bwEx("Chin-Up", 3, "AMRAP", "BW", "Supinated grip, chest to bar, full dead hang"),
          ]
        },
        "Lower Power + Oly": {
          note: "Power clean: form over load. Squat is heavy — treat it like a meet.",
          exercises: [
            ex("Back Squat", 5, "4", `${calcBar(squat,0.86)} lb`, null, "Compensatory acceleration — explode out of the hole"),
            ex("Power Clean (from floor)", 5, "3", `${calcBar(clean,0.82)} lb`, null, "Triple extension — violent shrug, pull under"),
            bwEx("Box Jump", 4, "5", "30\" box / BW", "Soft landing, absorb, reset each rep"),
            (() => { const ideal = squat*0.22; const w = roundDB(ideal); const over = ideal > MAX_DB; const kb = closestKB(ideal); return ex("Bulgarian Split Squat (DB)", 3, "8/leg", `${w} lb DBs`, over ? `Ideal ~${Math.round(ideal)}lb — goblet hold ${kb}lb KB or barbell ${calcBar(squat,0.33)} lb` : null, "Vertical shin, drive through heel, stay tall"); })(),
            bwEx("Nordic Hamstring Curl", 3, "6", "BW", "Slow 4s descent, use hands minimally"),
            bwEx("Pallof Press", 3, "10/side", "Heavy band", "Brace hard, zero rotation"),
          ]
        },
        "Conditioning Circuit": {
          note: "3 rounds. Rest 2 min between rounds. ~35–40 min.",
          exercises: [
            ex("Barbell Thruster", 3, "10", `${calcBar(press,0.52)} lb`, null, "Squat to overhead in one motion, hard lockout"),
            bwEx("Treadmill Sprint", 3, "1 min hard", "9 mph (6:40/mi) / 5% inc", "Uncomfortable but sustainable — 8/10 effort"),
            bwEx("Pull-Up", 3, "12", "BW", "No kipping, strict, full dead hang"),
            ex("KB Swing", 3, "15", `${closestKB(squat*0.19)} lb KB`, null, "Hip hinge — NOT a squat. Snap hips through"),
            bwEx("Push-Up", 3, "25", "BW", "Full chest to floor, explosive push"),
            bwEx("Plank", 3, "45s", "BW", "Hollow body, squeeze everything"),
          ]
        },
        "Upper Volume": {
          note: "Higher volume. 60s rest. DB cap in effect — check orange notes.",
          exercises: [
            dbEx("Flat Dumbbell Press", 4, "12", 0.78, "Control 3s descent, explode up"),
            (() => { const ideal = row*0.34; const w = roundDB(ideal); const over = ideal > MAX_DB; return ex("One-Arm DB Row", 4, "12/side", `${w} lb DB`, over ? `Ideal ~${Math.round(ideal)}lb — sub barbell row ${calcBar(row,0.68)} lb` : null, "Rotate torso, full stretch at bottom"); })(),
            (() => { const w = roundDB(press*0.21); const over = w >= MAX_DB; return ex("Arnold Press (DB)", 3, "12", `${w} lb DBs`, over ? `Use barbell OHP ${calcBar(press,0.60)} lb instead` : null, "Rotation through full ROM, no bounce"); })(),
            ex("Incline Curl (DB)", 3, "12", `${roundDB(bench*0.16)} lb DBs`, null, "Full stretch at bottom, peak squeeze"),
            ex("Skull Crusher (BB)", 3, "12", `${calcBar(bench,0.42)} lb`, null, "Elbows fixed, lower to forehead, control"),
            bwEx("Band Pull-Apart", 4, "20", "Medium band", "Squeeze rear delts, slow on return"),
          ]
        },
        "Tempo Run": {
          note: "Build aerobic engine while burning fat.",
          exercises: [
            bwEx("Warmup Jog", 1, "5 min", "5.5 mph (10:54/mi) flat", "Easy effort"),
            bwEx("Tempo Run", 1, "20 min", "6.5-7 mph (8:34-9:13/mi) flat", "Comfortably hard — 7/10 effort"),
            bwEx("Cooldown Walk/Jog", 1, "5 min", "3.5 mph (17:08/mi)", "Bring HR down"),
          ]
        },
      }
    },

    3: {
      schedule: ["Max Strength Upper", "Max Strength Lower", "Athletic HIIT", "Hypertrophy Finisher", "Long Zone 2", "REST"],
      days: {
        "Max Strength Upper": {
          note: "Heaviest phase. Rest 3 min. PR territory. 1–2 reps in the tank.",
          exercises: [
            ex("Barbell Bench Press", 5, "3", `${calcBar(bench,0.93)} lb`, null, "Leg drive, max lat tension, compensatory accel"),
            ex("Weighted Pull-Up", 5, "4", `BW+${roundBar(bench*0.20)} lb`, null, "Chest to bar, full dead hang every rep"),
            ex("Overhead Press", 4, "4", `${calcBar(press,0.88)} lb`, null, "Braced, bar over center of foot, hard lockout"),
            ex("Barbell Row", 4, "5", `${calcBar(row,0.90)} lb`, null, "No body English — strict pull, squeeze at top"),
            ex("Weighted Dip", 3, "8", `BW+${roundBar(bench*0.19)} lb`, null, "Slight forward lean, full depth"),
            ex("EZ-Bar Curl", 3, "8", `${calcBar(bench*0.44,1)} lb`, null, "Strict, no cheating, squeeze peak"),
          ]
        },
        "Max Strength Lower": {
          note: "Peak loads. Quality over grinding. 1–2 RIR.",
          exercises: [
            ex("Back Squat", 5, "3", `${calcBar(squat,0.93)} lb`, null, "Big breath, 360° brace, sit into it and drive"),
            ex("Conventional Deadlift", 4, "3", `${calcBar(deadlift,0.90)} lb`, null, "Lat tension, push the floor away, lockout glutes"),
            ex("Power Clean", 4, "3", `${calcBar(clean,0.88)} lb`, null, "Fast hips, violent shrug, pull under and catch"),
            bwEx("Glute Ham Raise / Nordic", 3, "8", "BW", "4s descent — slow and controlled"),
            ex("Farmer's Carry (DB)", 4, "40 yds", `${MAX_DB} lb DBs (capped)`, `Ideal ~${roundDB(squat*0.33)}lb/hand — load barbell on trap bar or use farmers walk handles`, "Tall, tight core, march fast"),
            bwEx("Hanging Leg Raise", 3, "12", "BW", "Tuck pelvis at top, zero swing"),
          ]
        },
        "Athletic HIIT": {
          note: "Metabolic conditioning. ~40 min. Mimics sport demands.",
          exercises: [
            bwEx("Treadmill Hill Sprint", 10, "20s ON / 40s OFF", "10 mph (6:00/mi) / 8% inc", "Absolute max effort — 10/10"),
            bwEx("Broad Jump", 4, "5", "BW", "Max distance, stick landing"),
            ex("KB Slam / Med Ball Slam", 4, "10", `${closestKB(20)} lb KB`, null, "Full extension overhead, violent throw down"),
            bwEx("Lateral Bound", 3, "8/side", "BW", "Stick each landing, load the hip"),
            ex("Barbell Walkout / Sled Push", 4, "20 yds", `${calcBar(squat,0.50)} lb`, null, "Low body angle, drive through floor"),
          ]
        },
        "Hypertrophy Finisher": {
          note: "High rep, high pump. Superset where noted. 45s rest.",
          exercises: [
            (() => { const { display, sub } = dbCalc(bench, 0.68, "Incline Press"); return ex("Incline DB Press (SS → Pull-Up)", 4, "12 / 10", `${display} / BW+${roundBar(bench*0.04)}lb`, sub, "Back to back, zero rest between exercises"); })(),
            bwEx("Band Fly (SS → Band Row)", 4, "15 / 15", "Medium band each", "Full stretch, brutal squeeze at peak contraction"),
            ex("Lateral Raise (SS → Front Raise)", 3, "15 / 15", `${roundDB(bench*0.13)} lb DBs`, null, "Burn the medial delt, controlled"),
            ex("Concentration Curl", 3, "15", `${roundDB(bench*0.19)} lb DB`, null, "Full ROM, peak contraction, slow down"),
            bwEx("Band Tricep Pushdown", 3, "20", "Heavy band", "Lock elbows, squeeze triceps hard"),
            bwEx("Ab Circuit", 3, "10/10/30s", "BW", "Leg raise → Russian twist → Plank. No rest."),
          ]
        },
        "Long Zone 2": {
          note: "Aerobic fat burning. Critical for the transformation. Don't skip it.",
          exercises: [
            bwEx("Treadmill Walk/Jog", 1, "50 min", "4-5 mph (12:00-15:00/mi) / 3-5% inc", "HR 130–145 bpm, can hold a full conversation"),
            bwEx("Cooldown + Stretch", 1, "10 min", "BW", "Hip flexors, hamstrings, t-spine rotation"),
          ]
        },
      }
    }
  };
}

// ─────────────────────────────────────────────
// STATIC DATA
// ─────────────────────────────────────────────
const PHASES = [
  { id: 1, name: "Phase 1", weeks: "1–4", focus: "Foundation & Fat Loss", color: "#e8ff5a" },
  { id: 2, name: "Phase 2", weeks: "5–8", focus: "Strength + Conditioning", color: "#5affe8" },
  { id: 3, name: "Phase 3", weeks: "9–12", focus: "Peak Leanness & Power", color: "#ff8c5a" },
];
const NUTRITION = [
  { label: "Daily Calories", value: "~2,400–2,600 kcal", note: "~500 cal deficit from maintenance" },
  { label: "Protein", value: "200–215g / day", note: "~1g per lb bodyweight — non-negotiable" },
  { label: "Carbs", value: "200–250g / day", note: "Prioritize around workouts (pre + post)" },
  { label: "Fats", value: "70–85g / day", note: "Avocado, eggs, olive oil, nuts" },
  { label: "Meal Timing", value: "3–4 meals", note: "Eat most carbs pre and post workout" },
  { label: "Hydration", value: "1 gallon / day", note: "Add electrolytes on hard cardio days" },
];
const DEFAULT_MAXES = { bench: 275, squat: 365, press: 185, row: 225, deadlift: 415, clean: 205 };
const MAX_FIELDS = [
  { key: "bench", label: "Bench Press 1RM" },
  { key: "squat", label: "Back Squat 1RM" },
  { key: "deadlift", label: "Deadlift 1RM" },
  { key: "press", label: "Overhead Press 1RM" },
  { key: "row", label: "Barbell Row (est.)" },
  { key: "clean", label: "Power Clean (est.)" },
];

// ─────────────────────────────────────────────
// STORAGE
// ─────────────────────────────────────────────
function load(key, fallback) {
  try { const v = localStorage.getItem(key); return v !== null ? JSON.parse(v) : fallback; } catch { return fallback; }
}
function save(key, val) { try { localStorage.setItem(key, JSON.stringify(val)); } catch {} }

// ─────────────────────────────────────────────
// APP
// ─────────────────────────────────────────────
export default function FitnessTracker() {
  const [activeTab, setActiveTab]           = useState("program");
  const [selectedPhase, setSelectedPhase]   = useState(() => load("lm_phase", 1));
  const [selectedDayIdx, setSelectedDayIdx] = useState(() => load("lm_dayIdx", 0));
  const [completedSets, setCompletedSets]   = useState(() => load("lm_sets", {}));
  const [workoutLog, setWorkoutLog]         = useState(() => load("lm_log", {}));
  const [notes, setNotes]                   = useState(() => load("lm_notes", {}));
  const [maxes, setMaxes]                   = useState(() => load("lm_maxes", DEFAULT_MAXES));
  const [editing, setEditing]               = useState(false);
  const [draft, setDraft]                   = useState(maxes);

  useEffect(() => save("lm_phase", selectedPhase), [selectedPhase]);
  useEffect(() => save("lm_dayIdx", selectedDayIdx), [selectedDayIdx]);
  useEffect(() => save("lm_sets", completedSets), [completedSets]);
  useEffect(() => save("lm_log", workoutLog), [workoutLog]);
  useEffect(() => save("lm_notes", notes), [notes]);
  useEffect(() => save("lm_maxes", maxes), [maxes]);

  const PROGRAM = buildProgram(maxes);
  const phase = PROGRAM[selectedPhase];
  const dayName = phase.schedule[selectedDayIdx];
  const workout = phase.days[dayName];
  const todayKey = `${selectedPhase}-${selectedDayIdx}`;

  const toggleSet = (ei, si) => {
    const k = `${todayKey}-${ei}-${si}`;
    setCompletedSets(p => ({ ...p, [k]: !p[k] }));
  };
  const isDone = (ei, si) => !!completedSets[`${todayKey}-${ei}-${si}`];

  const totalSets = workout ? workout.exercises.reduce((a, e) => a + e.sets, 0) : 0;
  const doneSets  = workout ? workout.exercises.reduce((t, ex, ei) =>
    t + Array.from({ length: ex.sets }, (_, i) => isDone(ei, i) ? 1 : 0).reduce((a,b)=>a+b, 0), 0) : 0;
  const pct = totalSets ? Math.round(doneSets / totalSets * 100) : 0;

  const logWorkout = () => {
    const d = new Date().toLocaleDateString();
    setWorkoutLog(p => ({ ...p, [d]: `P${selectedPhase} – ${dayName}` }));
    alert(`✅ Logged: ${dayName}`);
  };

  const saveMaxes = () => { setMaxes(draft); setEditing(false); };

  return (
    <div style={{ fontFamily:"'Bebas Neue','Anton','Impact',sans-serif", background:"#0a0a0a", minHeight:"100vh", color:"#f0ede6", maxWidth:480, margin:"0 auto", paddingBottom:80 }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600&display=swap');
        *{box-sizing:border-box}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
        .sb{width:36px;height:36px;border-radius:6px;border:1.5px solid #2a2a2a;background:transparent;color:#555;
          font-size:12px;cursor:pointer;transition:all .15s;display:flex;align-items:center;justify-content:center;
          font-family:'DM Sans',sans-serif;font-weight:700}
        .sb.done{background:#e8ff5a;border-color:#e8ff5a;color:#0a0a0a}
        .tb{flex:1;padding:10px 0;background:transparent;border:none;color:#444;
          font-family:'Bebas Neue',sans-serif;font-size:15px;cursor:pointer;letter-spacing:1px;
          border-top:2px solid transparent;transition:all .2s}
        .tb.active{color:#e8ff5a;border-top-color:#e8ff5a}
        .pp{padding:6px 14px;border-radius:4px;border:1.5px solid #2a2a2a;background:transparent;
          color:#666;font-family:'Bebas Neue',sans-serif;font-size:15px;cursor:pointer;letter-spacing:1px;transition:all .15s}
        .pp.active{border-color:#e8ff5a;color:#e8ff5a}
        .dp{padding:8px 12px;border-radius:4px;border:1.5px solid #1e1e1e;background:#111;color:#555;
          font-family:'DM Sans',sans-serif;font-size:10px;font-weight:700;cursor:pointer;white-space:nowrap;
          transition:all .15s;text-transform:uppercase;letter-spacing:.5px}
        .dp.active{border-color:#e8ff5a;color:#e8ff5a;background:#161a00}
        .dp.rest{color:#2a2a2a;border-color:#161616;cursor:default}
        .ec{background:#111;border:1px solid #1e1e1e;border-radius:10px;padding:14px;margin-bottom:10px}
        .sub{background:#1a1000;border:1px solid #3d2800;border-radius:6px;padding:7px 10px;margin-bottom:8px;
          font-family:'DM Sans',sans-serif;font-size:11px;color:#c8941a;line-height:1.4}
        .cb{width:100%;padding:16px;background:#e8ff5a;border:none;border-radius:10px;
          font-family:'Bebas Neue',sans-serif;font-size:22px;letter-spacing:2px;cursor:pointer;color:#0a0a0a;margin-top:16px}
        .cb:hover{background:#d4eb47}
        .pb{background:#1a1a1a;border-radius:4px;height:6px;overflow:hidden}
        .pf{height:100%;border-radius:4px;transition:width .4s ease;background:#e8ff5a}
        .mi{background:#0d0d0d;border:1.5px solid #2a2a2a;border-radius:8px;color:#f0ede6;
          padding:10px 14px;font-family:'DM Sans',sans-serif;font-size:16px;font-weight:600;
          width:100%;text-align:center;transition:border-color .15s}
        .mi:focus{outline:none;border-color:#e8ff5a88}
        .svb{width:100%;padding:14px;background:#e8ff5a;border:none;border-radius:10px;
          font-family:'Bebas Neue',sans-serif;font-size:20px;letter-spacing:2px;cursor:pointer;color:#0a0a0a;margin-top:8px}
        .cnb{width:100%;padding:12px;background:transparent;border:1.5px solid #2a2a2a;border-radius:10px;
          font-family:'Bebas Neue',sans-serif;font-size:18px;letter-spacing:1px;cursor:pointer;color:#555;margin-top:8px}
        textarea{background:#111;border:1px solid #2a2a2a;border-radius:8px;color:#f0ede6;
          padding:10px 12px;font-family:'DM Sans',sans-serif;font-size:13px;width:100%;resize:vertical}
        textarea:focus{outline:none;border-color:#e8ff5a44}
      `}</style>

      {/* HEADER */}
      <div style={{ padding:"22px 18px 14px", borderBottom:"1px solid #1a1a1a" }}>
        <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontSize:10, letterSpacing:4, color:"#444", fontFamily:"'DM Sans',sans-serif", fontWeight:700, textTransform:"uppercase", marginBottom:2 }}>Dad Strength Protocol</div>
            <div style={{ fontSize:38, lineHeight:1, letterSpacing:2 }}>LEAN<span style={{ color:"#e8ff5a" }}>&</span>MEAN</div>
          </div>
          <div style={{ textAlign:"right" }}>
            <div style={{ fontSize:10, color:"#444", fontFamily:"'DM Sans',sans-serif", fontWeight:600, marginBottom:2, letterSpacing:1 }}>PHASE</div>
            <div style={{ fontSize:30, color:"#e8ff5a", lineHeight:1 }}>P{selectedPhase}</div>
            <div style={{ fontSize:10, color:"#444", fontFamily:"'DM Sans',sans-serif" }}>Wks {PHASES[selectedPhase-1].weeks}</div>
          </div>
        </div>
      </div>

      {/* TOP NAV */}
      <div style={{ display:"flex", borderBottom:"1px solid #1a1a1a", background:"#070707", position:"sticky", top:0, zIndex:10 }}>
        {["program","maxes","log","nutrition"].map(t => (
          <button key={t} className={`tb${activeTab===t?" active":""}`} onClick={()=>setActiveTab(t)}>
            <div>{t==="program"?"🏋️":t==="maxes"?"⚡":t==="log"?"📋":"🥩"}</div>
            <div style={{ fontSize:9, letterSpacing:1, fontFamily:"'DM Sans',sans-serif", fontWeight:700 }}>{t.toUpperCase()}</div>
          </button>
        ))}
      </div>

      <div style={{ padding:"18px 16px" }}>

        {/* ══════════ PROGRAM ══════════ */}
        {activeTab==="program" && (<>
          <div style={{ display:"flex", gap:8, marginBottom:14 }}>
            {PHASES.map(p=>(
              <button key={p.id} className={`pp${selectedPhase===p.id?" active":""}`}
                onClick={()=>{ setSelectedPhase(p.id); setSelectedDayIdx(0); }}>{p.name}</button>
            ))}
          </div>

          <div style={{ background:"#111", border:"1px solid #1e1e1e", borderRadius:10, padding:"10px 14px", marginBottom:14, display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:8, height:8, borderRadius:"50%", background:PHASES[selectedPhase-1].color, flexShrink:0 }} />
            <div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"#555", fontWeight:700, textTransform:"uppercase", letterSpacing:1.5 }}>Wks {PHASES[selectedPhase-1].weeks}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#ccc", fontWeight:500 }}>{PHASES[selectedPhase-1].focus}</div>
            </div>
          </div>

          <div style={{ overflowX:"auto", display:"flex", gap:8, paddingBottom:4, marginBottom:16 }}>
            {phase.schedule.map((d,i)=>(
              <button key={i} className={`dp${d==="REST"?" rest":selectedDayIdx===i?" active":""}`}
                onClick={()=>d!=="REST"&&setSelectedDayIdx(i)}>D{i+1}</button>
            ))}
          </div>

          {workout ? (<>
            <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between", marginBottom:8 }}>
              <div>
                <div style={{ fontSize:22, letterSpacing:1, lineHeight:1.1 }}>{dayName}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#555", marginTop:4, lineHeight:1.4 }}>{workout.note}</div>
              </div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#e8ff5a", fontWeight:700, marginLeft:8, flexShrink:0 }}>{pct}%</div>
            </div>

            <div className="pb" style={{ marginBottom:16 }}><div className="pf" style={{ width:`${pct}%` }}/></div>

            {workout.exercises.map((ex,ei)=>(
              <div key={ei} className="ec">
                <div style={{ marginBottom:6 }}>
                  <div style={{ fontSize:17, letterSpacing:.5, lineHeight:1.2 }}>{ex.name}</div>
                  <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#555", marginTop:2 }}>
                    {ex.sets} × {ex.reps} &nbsp;·&nbsp; <span style={{ color:"#e8ff5a" }}>{ex.weight}</span>
                  </div>
                </div>
                {ex.sub && <div className="sub">⚠️ {ex.sub}</div>}
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:11, color:"#3a7a6a", background:"#0a1a17", borderRadius:6, padding:"5px 9px", marginBottom:10 }}>
                  💡 {ex.cue}
                </div>
                <div style={{ display:"flex", gap:6, flexWrap:"wrap" }}>
                  {Array.from({ length:ex.sets }, (_,i)=>(
                    <button key={i} className={`sb${isDone(ei,i)?" done":""}`} onClick={()=>toggleSet(ei,i)}>
                      {isDone(ei,i)?"✓":i+1}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            <button className="cb" onClick={logWorkout}>COMPLETE WORKOUT</button>
          </>) : (
            <div style={{ textAlign:"center", padding:48, color:"#2a2a2a", fontFamily:"'DM Sans',sans-serif" }}>
              <div style={{ fontSize:36, marginBottom:8 }}>💤</div>REST DAY — Recover & grow
            </div>
          )}
        </>)}

        {/* ══════════ MAXES ══════════ */}
        {activeTab==="maxes" && (<>
          <div style={{ fontSize:26, marginBottom:4 }}>1RM MAXES</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#555", marginBottom:18, lineHeight:1.5 }}>
            Enter your current 1-rep maxes. Every exercise weight auto-calculates. Update after each 12-week cycle.
          </div>

          <div style={{ background:"#0d1422", border:"1px solid #1a2a44", borderRadius:10, padding:"12px 14px", marginBottom:18 }}>
            <div style={{ fontSize:15, marginBottom:6, color:"#5ab4ff" }}>YOUR EQUIPMENT LIMITS</div>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#4a7aaa", lineHeight:1.7 }}>
              Max DBs: <span style={{ color:"#8acfff" }}>52.5 lb</span> &nbsp;·&nbsp;
              KBs: <span style={{ color:"#8acfff" }}>10, 20, 25, 55, 70 lb</span><br/>
              <span style={{ color:"#c8941a" }}>Orange notes</span> appear when an exercise exceeds your DB limit — with the best substitution for your exact KB set.
            </div>
          </div>

          {editing ? (<>
            {MAX_FIELDS.map(({ key, label })=>(
              <div key={key} style={{ marginBottom:14 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"#555", textTransform:"uppercase", letterSpacing:1.5, marginBottom:6 }}>{label}</div>
                <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                  <input type="number" className="mi" value={draft[key]}
                    onChange={e=>setDraft(p=>({ ...p, [key]: Number(e.target.value) }))} />
                  <span style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#444" }}>lb</span>
                </div>
              </div>
            ))}
            <button className="svb" onClick={saveMaxes}>SAVE & RECALCULATE ALL WEIGHTS</button>
            <button className="cnb" onClick={()=>{ setDraft(maxes); setEditing(false); }}>CANCEL</button>
          </>) : (<>
            {MAX_FIELDS.map(({ key, label })=>(
              <div key={key} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#111", border:"1px solid #1e1e1e", borderRadius:10, padding:"12px 16px", marginBottom:8 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#666" }}>{label}</div>
                <div style={{ fontSize:22, color:"#e8ff5a" }}>{maxes[key]} <span style={{ fontSize:12, color:"#444" }}>lb</span></div>
              </div>
            ))}
            <button className="svb" style={{ marginTop:16 }} onClick={()=>{ setDraft(maxes); setEditing(true); }}>EDIT MAXES</button>

            <div style={{ background:"#111", border:"1px solid #1e1e1e", borderRadius:10, padding:16, marginTop:20 }}>
              <div style={{ fontSize:18, marginBottom:6 }}>START NEW CYCLE</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#555", lineHeight:1.5, marginBottom:12 }}>
                After 12 weeks: re-test maxes, update above, then restart. Your session log is preserved.
              </div>
              <button style={{ width:"100%", padding:"12px", background:"transparent", border:"1.5px solid #2a2a2a", borderRadius:8, fontFamily:"'Bebas Neue',sans-serif", fontSize:17, letterSpacing:1, color:"#555", cursor:"pointer" }}
                onClick={()=>{ if(window.confirm("Reset to Phase 1 Day 1? (maxes + log kept)")) { setSelectedPhase(1); setSelectedDayIdx(0); setCompletedSets({}); }}}>
                RESTART CYCLE (KEEP LOG)
              </button>
            </div>
          </>)}
        </>)}

        {/* ══════════ LOG ══════════ */}
        {activeTab==="log" && (<>
          <div style={{ fontSize:26, marginBottom:4 }}>WORKOUT LOG</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#555", marginBottom:18 }}>Track sessions, PRs, and notes</div>

          <div style={{ background:"#111", border:"1px solid #1e1e1e", borderRadius:10, padding:14, marginBottom:18 }}>
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"#555", textTransform:"uppercase", letterSpacing:1.5, marginBottom:8 }}>Today's Notes / PRs</div>
            <textarea rows={3} placeholder="e.g. Bench 245×5 felt strong, sprint pace 9.5 mph, hit 52.5lb DBs no problem..."
              style={{ minHeight:70 }} value={notes[todayKey]||""} onChange={e=>setNotes(p=>({ ...p, [todayKey]:e.target.value }))} />
          </div>

          <div style={{ fontSize:19, marginBottom:12 }}>PROGRESSION TARGETS</div>
          {[
            { phase:"Phase 1 (Wks 1–4)", text:`Add 5 lb upper / 10 lb lower each week if all reps hit clean. Bench: ${calcBar(maxes.bench,0.78)}→${calcBar(maxes.bench,0.86)} lb. Squat: ${calcBar(maxes.squat,0.78)}→${calcBar(maxes.squat,0.86)} lb.` },
            { phase:"Phase 2 (Wks 5–8)", text:`Push to 86–90% intensity. Sprint +0.3 mph or +1% incline weekly. Power clean: ${calcBar(maxes.clean,0.82)}→${calcBar(maxes.clean,0.90)} lb.` },
            { phase:"Phase 3 (Wks 9–12)", text:`Near-max territory. Bench: ${calcBar(maxes.bench,0.93)} lb · Squat: ${calcBar(maxes.squat,0.93)} lb · Deadlift: ${calcBar(maxes.deadlift,0.90)} lb. Week 12 = full deload at 60%.` },
          ].map((p,i)=>(
            <div key={i} style={{ background:"#111", border:"1px solid #1e1e1e", borderRadius:10, padding:14, marginBottom:8 }}>
              <div style={{ fontSize:15, color:"#e8ff5a", marginBottom:4 }}>{p.phase}</div>
              <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#777", lineHeight:1.5 }}>{p.text}</div>
            </div>
          ))}

          <div style={{ fontSize:19, marginTop:20, marginBottom:12 }}>COMPLETED SESSIONS</div>
          {Object.keys(workoutLog).length===0 ? (
            <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#2a2a2a", textAlign:"center", padding:24 }}>No sessions logged yet.</div>
          ) : (
            Object.entries(workoutLog).reverse().map(([date,session])=>(
              <div key={date} style={{ display:"flex", justifyContent:"space-between", alignItems:"center", background:"#111", border:"1px solid #1e1e1e", borderRadius:10, padding:"11px 14px", marginBottom:7 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#666" }}>{date}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#e8ff5a", fontWeight:700 }}>{session}</div>
              </div>
            ))
          )}
        </>)}

        {/* ══════════ NUTRITION ══════════ */}
        {activeTab==="nutrition" && (<>
          <div style={{ fontSize:26, marginBottom:4 }}>NUTRITION</div>
          <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:13, color:"#555", marginBottom:18 }}>Loose-track targets for fat loss + muscle retention</div>

          {NUTRITION.map((n,i)=>(
            <div key={i} style={{ background:"#111", border:"1px solid #1e1e1e", borderRadius:10, padding:"14px 16px", marginBottom:10, display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
              <div style={{ flex:1 }}>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:10, color:"#555", textTransform:"uppercase", letterSpacing:1.2, marginBottom:3 }}>{n.label}</div>
                <div style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#555", lineHeight:1.4 }}>{n.note}</div>
              </div>
              <div style={{ fontSize:17, color:"#e8ff5a", textAlign:"right", minWidth:110, paddingLeft:10, lineHeight:1.2 }}>{n.value}</div>
            </div>
          ))}

          <div style={{ background:"#0d1a00", border:"1px solid #2a3d00", borderRadius:10, padding:14, marginTop:8 }}>
            <div style={{ fontSize:18, marginBottom:8 }}>EASY PROTEIN WINS</div>
            {["4–6 eggs in the morning","2 scoops whey shake (50g)","8 oz chicken breast = ~55g","6 oz Greek yogurt = ~17g","1 cup cottage cheese = ~25g","8 oz salmon or lean beef = ~50g"].map((tip,i)=>(
              <div key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#6a8a4a", marginBottom:5, display:"flex", gap:8 }}>
                <span style={{ color:"#e8ff5a" }}>→</span> {tip}
              </div>
            ))}
          </div>

          <div style={{ background:"#1a0d00", border:"1px solid #3d2200", borderRadius:10, padding:14, marginTop:10 }}>
            <div style={{ fontSize:18, marginBottom:8 }}>WHAT TO AVOID</div>
            {["Liquid calories (soda, juice, alcohol)","Processed snacks between meals","Skipping protein at any meal","Eating <150g protein on hard training days"].map((tip,i)=>(
              <div key={i} style={{ fontFamily:"'DM Sans',sans-serif", fontSize:12, color:"#8a5a4a", marginBottom:5, display:"flex", gap:8 }}>
                <span style={{ color:"#ff7a3a" }}>✕</span> {tip}
              </div>
            ))}
          </div>
        </>)}

      </div>

      {/* BOTTOM NAV */}
      <div style={{ position:"fixed", bottom:0, left:"50%", transform:"translateX(-50%)", width:"100%", maxWidth:480, display:"flex", borderTop:"1px solid #1a1a1a", background:"#070707" }}>
        {["program","maxes","log","nutrition"].map(t=>(
          <button key={t} className={`tb${activeTab===t?" active":""}`} style={{ padding:"10px 0" }} onClick={()=>setActiveTab(t)}>
            <div>{t==="program"?"🏋️":t==="maxes"?"⚡":t==="log"?"📋":"🥩"}</div>
            <div style={{ fontSize:9, letterSpacing:1, fontFamily:"'DM Sans',sans-serif", fontWeight:700 }}>{t.toUpperCase()}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
