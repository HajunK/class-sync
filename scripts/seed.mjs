/**
 * Seeds the local Firebase emulator with demo classmates, classes, calendar
 * entries, and class notes so ClassSync can be explored right away.
 *
 *   npm run seed            # seed once (skips if demo data already exists)
 *   npm run seed -- --force # overwrite the demo data
 *
 * Only ever talks to the emulator — never a real Firebase project.
 */
import { initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

process.env.FIRESTORE_EMULATOR_HOST ||= "127.0.0.1:8085";
process.env.FIREBASE_AUTH_EMULATOR_HOST ||= "127.0.0.1:9099";

const app = initializeApp({ projectId: "demo-classsync" });
const auth = getAuth(app);
const db = getFirestore(app);
const force = process.argv.includes("--force");

// Test credentials for the local demo accounts (emulator only).
const PASSWORD = "classsync123";
const USERS = {
  minji: { uid: "u-minji", name: "Minji Park", email: "minji@classsync.test" },
  daniel: { uid: "u-daniel", name: "Daniel Lee", email: "daniel@classsync.test" },
  sora: { uid: "u-sora", name: "Sora Kim", email: "sora@classsync.test" },
  ethan: { uid: "u-ethan", name: "Ethan Choi", email: "ethan@classsync.test" },
  yuna: { uid: "u-yuna", name: "Yuna Jung", email: "yuna@classsync.test" },
};
const { minji, daniel, sora, ethan, yuna } = USERS;

/* ── date helpers (everything is relative to "now") ─────────────── */
const now = new Date();
const day = (offset, h = 9, m = 0) => {
  const d = new Date(now);
  d.setDate(d.getDate() + offset);
  d.setHours(h, m, 0, 0);
  return d;
};
const key = (offset) => {
  const d = day(offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const ts = (d) => Timestamp.fromDate(d);
const hoursAgo = (h) => new Date(now.getTime() - h * 3600_000);
/** most recent weekday at or before `offset` days from today */
const weekday = (offset) => {
  let o = offset;
  while ([0, 6].includes(day(o).getDay())) o--;
  return o;
};

const absentDay = weekday(-1) === weekday(-2) ? weekday(-3) : weekday(-2);
const prevLesson = weekday(absentDay - 2);
const yesterdayLesson = weekday(-1);

/* ── classes ─────────────────────────────────────────────────────── */
const CLASSES = [
  {
    id: "demo-apbio",
    school: "KIS Jeju",
    course: "AP Biology",
    section: "Section A · Period 2",
    code: "BIO24A",
    color: "#0f8a6b",
    members: [minji, daniel, sora, ethan, yuna],
    createdBy: daniel.uid,
  },
  {
    id: "demo-precalc",
    school: "KIS Jeju",
    course: "Precalculus",
    section: "Section B · Period 4",
    code: "MATH4B",
    color: "#2357c6",
    members: [minji, daniel, ethan, yuna],
    createdBy: minji.uid,
  },
  {
    id: "demo-eng10",
    school: "KIS Jeju",
    course: "English 10",
    section: "Section C · Period 6",
    code: "ENG10C",
    color: "#c2410c",
    members: [minji, sora, yuna],
    createdBy: yuna.uid,
  },
];

// Minji is the main demo user: she was absent on `absentDay` in AP Bio and
// hasn't opened some classes for a while, so the catch-up features light up.
const MINJI_STATE = {
  "demo-apbio": { lastSeenAt: day(absentDay - 1, 20) },
  "demo-precalc": { lastSeenAt: hoursAgo(1) },
  "demo-eng10": { lastSeenAt: day(-2, 21) },
};

/* ── calendar entries ────────────────────────────────────────────── */
const EVENTS = [
  // AP Biology
  {
    classId: "demo-apbio",
    id: "ev-resp-quiz",
    type: "quiz",
    title: "Cell Respiration Quiz",
    date: key(6),
    time: "10:05",
    chapters: "Ch. 7.1 – 7.3",
    details: "15 multiple-choice + 2 short answer. Ms. Han said to know the net products of glycolysis and where each stage happens.",
    author: daniel,
    createdAt: day(absentDay, 10, 20),
    confirmations: [sora.uid, ethan.uid],
    history: [
      { action: "created", by: daniel, at: day(absentDay, 10, 20) },
      { action: "edited", by: sora, at: day(absentDay, 12, 5), changes: { date: { from: key(5), to: key(6) }, time: { from: "", to: "10:05" } } },
      { action: "confirmed", by: sora, at: day(absentDay, 12, 6) },
      { action: "confirmed", by: ethan, at: day(absentDay, 15, 40) },
    ],
    updatedBy: sora,
    updatedAt: day(absentDay, 12, 5),
  },
  {
    classId: "demo-apbio",
    id: "ev-enzyme-lab",
    type: "assignment",
    title: "Enzyme Lab Report",
    date: key(3),
    time: "23:59",
    chapters: "Lab 4 — catalase & temperature",
    details: "Submit on Google Classroom. Graph + error analysis required.",
    author: sora,
    createdAt: day(prevLesson, 11),
    confirmations: [minji.uid],
    history: [
      { action: "created", by: sora, at: day(prevLesson, 11) },
      { action: "confirmed", by: minji, at: day(prevLesson, 13) },
    ],
  },
  {
    classId: "demo-apbio",
    id: "ev-unit3-exam",
    type: "exam",
    title: "Unit 3 Exam — Cellular Energy",
    date: key(17),
    chapters: "Ch. 6 – 8",
    details: "Full period. FRQ on photosynthesis vs. respiration likely.",
    author: ethan,
    createdAt: hoursAgo(20),
    confirmations: [],
    history: [{ action: "created", by: ethan, at: hoursAgo(20) }],
  },
  {
    classId: "demo-apbio",
    id: "ev-unit2-quiz",
    type: "quiz",
    title: "Unit 2 Quiz — Membranes",
    date: key(-8),
    chapters: "Ch. 5",
    author: yuna,
    createdAt: day(-15, 10),
    confirmations: [daniel.uid, sora.uid, minji.uid],
    history: [
      { action: "created", by: yuna, at: day(-15, 10) },
      { action: "confirmed", by: daniel, at: day(-15, 11) },
      { action: "confirmed", by: sora, at: day(-14, 9) },
      { action: "confirmed", by: minji, at: day(-14, 18) },
    ],
  },
  // Precalculus
  {
    classId: "demo-precalc",
    id: "ev-trig-quiz",
    type: "quiz",
    title: "Trig Identities Quiz",
    date: key(4),
    chapters: "4.1 – 4.3",
    details: "Calculator not allowed.",
    author: ethan,
    createdAt: day(-1, 13),
    confirmations: [yuna.uid],
    history: [
      { action: "created", by: ethan, at: day(-1, 13) },
      { action: "confirmed", by: yuna, at: day(-1, 19) },
    ],
  },
  {
    classId: "demo-precalc",
    id: "ev-pset5",
    type: "deadline",
    title: "Problem Set 5",
    date: key(2),
    time: "23:59",
    chapters: "p. 214 #1–29 odd",
    author: minji,
    createdAt: day(-4, 14),
    confirmations: [daniel.uid, yuna.uid],
    history: [
      { action: "created", by: minji, at: day(-4, 14) },
      { action: "confirmed", by: daniel, at: day(-4, 15) },
      { action: "confirmed", by: yuna, at: day(-3, 8) },
    ],
  },
  {
    classId: "demo-precalc",
    id: "ev-precalc-midterm",
    type: "exam",
    title: "Precalculus Midterm",
    date: key(12),
    time: "09:00",
    chapters: "Units 1 – 4",
    details: "In the auditorium. Bring a graphing calculator.",
    author: daniel,
    createdAt: day(-9, 10),
    confirmations: [ethan.uid, yuna.uid, minji.uid],
    history: [
      { action: "created", by: daniel, at: day(-9, 10) },
      { action: "confirmed", by: ethan, at: day(-9, 11) },
      { action: "confirmed", by: yuna, at: day(-8, 12) },
      { action: "confirmed", by: minji, at: day(-8, 20) },
    ],
  },
  // English 10
  {
    classId: "demo-eng10",
    id: "ev-essay-draft",
    type: "assignment",
    title: "Persuasive Essay — First Draft",
    date: key(8),
    details: "800–1000 words, MLA format. Peer review in class the next day.",
    author: yuna,
    createdAt: hoursAgo(3),
    confirmations: [sora.uid],
    history: [
      { action: "created", by: yuna, at: hoursAgo(3) },
      { action: "confirmed", by: sora, at: hoursAgo(2) },
    ],
  },
  {
    classId: "demo-eng10",
    id: "ev-giver-check",
    type: "quiz",
    title: "Reading Check: The Giver ch. 1–8",
    date: key(5),
    author: sora,
    createdAt: day(-6, 15),
    confirmations: [yuna.uid, minji.uid],
    history: [
      { action: "created", by: sora, at: day(-6, 15) },
      { action: "confirmed", by: yuna, at: day(-6, 16) },
      { action: "confirmed", by: minji, at: day(-5, 9) },
    ],
  },
];

/* ── class sessions & notes ──────────────────────────────────────── */
const GLYCOLYSIS_NOTES = [
  {
    id: "u-daniel",
    author: daniel,
    at: day(absentDay, 11, 2),
    content: `Glycolysis (board)
- location: cytoplasm
- glucose (6C) -> 2 pyruvate (3C)
- no O2 needed

Energy investment: -2 ATP
Energy payoff: +4 ATP, +2 NADH
Net = 2 ATP, 2 NADH, 2 pyruvate

Total = 36 ATP per glucose

Pyruvate: 3-carbon molecule made by glycolysis`,
  },
  {
    id: "u-sora",
    author: sora,
    at: day(absentDay, 12, 30),
    content: `Ms. Han explained glycolysis is the FIRST of 3 stages: glycolysis -> Krebs cycle -> electron transport chain.

It happens in the cytoplasm and it's anaerobic (= doesn't need oxygen). Glucose gets split in half into two pyruvates.

"Spend money to make money" — the cell invests 2 ATP at the start so it can earn 4 ATP later.

NADH = electron carrier, takes high-energy electrons to the ETC later.

If there IS oxygen, pyruvate goes into the mitochondria (Krebs cycle). If NOT, fermentation.

She said ~38 ATP is the theoretical max from one glucose, but real cells get closer to 30-32.
Quiz Friday!`,
  },
  {
    id: "u-ethan",
    author: ethan,
    at: day(absentDay, 16, 10),
    content: `ON THE TEST ★
★ net products of glycolysis: 2 ATP, 2 NADH, 2 pyruvate — memorize
★ label where each stage happens (cytoplasm vs mitochondria)
★ glucose 6C split into 2 x 3C pyruvate
- anaerobic = no oxygen
- quiz on this next Thursday`,
  },
];

const GLYCOLYSIS_MERGED = {
  title: "Glycolysis & ATP Yield",
  overview:
    "Glycolysis is the first stage of cellular respiration: in the cytoplasm, one glucose is split into two pyruvate molecules without needing oxygen. The lesson covered the energy-investment and energy-payoff phases, the net products, and what happens to pyruvate next. Ms. Han flagged the net products and the location of each stage as likely quiz material.",
  sections: [
    {
      heading: "Where it happens and what it does",
      items: [
        { text: "Glycolysis takes place in the cytoplasm and does not require oxygen (it is anaerobic).", kind: "point", sources: ["u-daniel", "u-sora", "u-ethan"] },
        { text: "One glucose (6 carbons) is split into two pyruvate molecules (3 carbons each).", kind: "point", sources: ["u-daniel", "u-sora", "u-ethan"] },
        { text: "It is the first of three stages: glycolysis → Krebs cycle → electron transport chain.", kind: "point", sources: ["u-sora"] },
      ],
    },
    {
      heading: "The two phases",
      items: [
        { text: "Energy-investment phase: the cell uses 2 ATP to get glucose ready to split.", kind: "point", sources: ["u-daniel", "u-sora"] },
        { text: "Energy-payoff phase: 4 ATP and 2 NADH are produced.", kind: "point", sources: ["u-daniel", "u-sora"] },
        { text: "Board tally: −2 ATP (investment) + 4 ATP (payoff) = net 2 ATP.", kind: "example", sources: ["u-daniel"] },
        { text: "Ms. Han's analogy: the cell “spends money to make money” — invest 2 ATP to earn 4.", kind: "example", sources: ["u-sora"] },
      ],
    },
    {
      heading: "Products and what happens next",
      items: [
        { text: "Net products per glucose: 2 ATP, 2 NADH, 2 pyruvate — memorize these.", kind: "test", sources: ["u-daniel", "u-ethan"] },
        { text: "Be able to label where each stage happens (cytoplasm vs. mitochondria).", kind: "test", sources: ["u-ethan"] },
        { text: "With oxygen, pyruvate enters the mitochondria for the Krebs cycle; without oxygen, it goes to fermentation.", kind: "point", sources: ["u-sora"] },
        { text: "Total ATP from one glucose across all of respiration — the notes give different numbers (see “Where the notes disagree”).", kind: "point", sources: ["u-daniel", "u-sora"] },
      ],
    },
  ],
  conflicts: [
    {
      topic: "Total ATP from one glucose (whole process)",
      versions: [
        { source: "u-daniel", text: "Total = 36 ATP per glucose" },
        { source: "u-sora", text: "~38 ATP is the theoretical max, but real cells get closer to 30-32" },
      ],
      note: "Textbooks differ (36–38 theoretical, about 30–32 in real cells). Ask Ms. Han which number the quiz expects.",
    },
    {
      topic: "When is the quiz?",
      versions: [
        { source: "u-sora", text: "Quiz Friday!" },
        { source: "u-ethan", text: "quiz on this next Thursday" },
      ],
      note: "The class calendar entry says Friday and has been confirmed by 2 classmates — check it there.",
    },
  ],
  keyTerms: [
    { term: "Glycolysis", definition: "Splitting glucose into two pyruvate molecules; the first stage of cellular respiration.", sources: ["u-daniel", "u-sora"] },
    { term: "Pyruvate", definition: "The 3-carbon molecule produced by glycolysis.", sources: ["u-daniel"] },
    { term: "NADH", definition: "An electron carrier that brings high-energy electrons to the electron transport chain.", sources: ["u-sora"] },
    { term: "Anaerobic", definition: "Not requiring oxygen.", sources: ["u-sora", "u-ethan"] },
  ],
  sourceNoteIds: GLYCOLYSIS_NOTES.map((n) => n.id),
  engine: "sample",
  mergedByName: sora.name,
};

const SESSIONS = [
  {
    classId: "demo-apbio",
    id: "s-glycolysis",
    date: key(absentDay),
    topic: "Glycolysis & ATP yield",
    author: daniel,
    notes: GLYCOLYSIS_NOTES,
    merged: { ...GLYCOLYSIS_MERGED, mergedAt: ts(day(absentDay, 17)) },
  },
  {
    classId: "demo-apbio",
    id: "s-intro-resp",
    date: key(prevLesson),
    topic: "Intro to cellular respiration",
    author: minji,
    notes: [
      {
        id: "u-minji",
        author: minji,
        at: day(prevLesson, 11),
        content: `Cellular respiration:
- turns glucose into usable energy (ATP)
- equation: C6H12O6 + 6O2 -> 6CO2 + 6H2O + energy
- ATP = adenosine triphosphate, 3 phosphate groups
- mitochondria = "powerhouse of the cell"

Vocab:
Aerobic: needs oxygen
ATP: the energy currency of the cell`,
      },
      {
        id: "u-yuna",
        author: yuna,
        at: day(prevLesson, 12, 30),
        content: `Ms. Han:
- respiration is basically photosynthesis in reverse
- equation: C6H12O6 + 6O2 -> 6CO2 + 6H2O + energy
- energy is stored when ATP has 2 phosphate groups and released when one breaks off
- most ATP is made in the mitochondria
- this will be on the unit 3 exam!`,
      },
    ],
  },
  {
    classId: "demo-precalc",
    id: "s-pyth-identities",
    date: key(yesterdayLesson),
    topic: "Pythagorean identities",
    author: daniel,
    notes: [
      {
        id: "u-daniel",
        author: daniel,
        at: day(yesterdayLesson, 11),
        content: `Pythagorean identities
- sin²θ + cos²θ = 1
- 1 + tan²θ = sec²θ
- 1 + cot²θ = csc²θ

Example 1: if sinθ = 3/5 and θ in Q2, cosθ = -4/5
Example 2: simplify (1 - cos²x)/sin x = sin x`,
      },
      {
        id: "u-ethan",
        author: ethan,
        at: day(yesterdayLesson, 15),
        content: `★ memorize all 3 Pythagorean identities — on the quiz
- divide sin²+cos²=1 by cos² to get the tan/sec one
- divide by sin² to get the cot/csc one
★ watch the sign of cos depending on quadrant`,
      },
    ],
  },
];

/** Turn the plain-text demo notes into simple editor HTML. */
function toHtml(text) {
  const esc = (t) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  const out = [];
  let list = null;
  const close = () => {
    if (list) out.push(`<ul>${list.join("")}</ul>`);
    list = null;
  };
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line) {
      close();
      continue;
    }
    const bullet = line.match(/^[-★]\s*(.*)$/);
    if (bullet) {
      (list ||= []).push(`<li><p>${esc(line.startsWith("★") ? line : bullet[1])}</p></li>`);
      continue;
    }
    close();
    if (/:$/.test(line) || (out.length === 0 && line.length < 40)) out.push(`<h2>${esc(line.replace(/:$/, ""))}</h2>`);
    else out.push(`<p>${esc(line)}</p>`);
  }
  close();
  return out.join("");
}

/* ── run ─────────────────────────────────────────────────────────── */
async function main() {
  const existing = await db.doc("classes/demo-apbio").get();
  if (existing.exists && !force) {
    console.log("✓ Demo data already present (use `npm run seed -- --force` to reset).");
    return;
  }

  for (const u of Object.values(USERS)) {
    try {
      await auth.getUser(u.uid);
      await auth.updateUser(u.uid, { email: u.email, password: PASSWORD, displayName: u.name });
    } catch {
      await auth.createUser({ uid: u.uid, email: u.email, password: PASSWORD, displayName: u.name });
    }
    await db.doc(`users/${u.uid}`).set({ displayName: u.name, email: u.email, school: "KIS Jeju", createdAt: ts(day(-30)) });
  }

  for (const c of CLASSES) {
    await db.doc(`classes/${c.id}`).set({
      school: c.school,
      course: c.course,
      section: c.section,
      code: c.code,
      color: c.color,
      memberIds: c.members.map((m) => m.uid),
      createdBy: c.createdBy,
      createdAt: ts(day(-30)),
    });
    await db.doc(`classCodes/${c.code}`).set({ classId: c.id });
    for (const m of c.members) {
      const state = m.uid === minji.uid ? MINJI_STATE[c.id] : { lastSeenAt: hoursAgo(6) };
      await db.doc(`classes/${c.id}/members/${m.uid}`).set({
        displayName: m.name,
        lastSeenAt: ts(state.lastSeenAt),
      });
    }
  }

  for (const e of EVENTS) {
    const ref = db.doc(`classes/${e.classId}/events/${e.id}`);
    const old = await ref.collection("history").listDocuments();
    await Promise.all(old.map((d) => d.delete()));
    await ref.set({
      classId: e.classId,
      type: e.type,
      title: e.title,
      date: e.date,
      time: e.time || "",
      details: [e.chapters, e.details].filter(Boolean).join(" — "),
      createdBy: e.author.uid,
      createdByName: e.author.name,
      createdAt: ts(e.createdAt),
      updatedAt: ts(e.updatedAt || e.createdAt),
      ...(e.updatedBy ? { updatedBy: e.updatedBy.uid, updatedByName: e.updatedBy.name } : {}),
      confirmations: e.confirmations || [],
    });
    for (const h of e.history) {
      await ref.collection("history").add({
        action: h.action,
        by: h.by.uid,
        byName: h.by.name,
        at: ts(h.at),
        ...(h.changes ? { changes: h.changes } : {}),
      });
    }
  }

  for (const s of SESSIONS) {
    const ref = db.doc(`classes/${s.classId}/sessions/${s.id}`);
    await Promise.all((await ref.collection("notes").listDocuments()).map((d) => d.delete()));
    await ref.set({
      classId: s.classId,
      date: s.date,
      topic: s.topic,
      createdBy: s.author.uid,
      createdByName: s.author.name,
      createdAt: ts(day(-5)),
      contributors: s.notes.map((n) => n.author.uid),
      merged: s.merged || null,
    });
    for (const n of s.notes) {
      await ref.collection("notes").doc(n.id).set({
        authorId: n.author.uid,
        authorName: n.author.name,
        html: toHtml(n.content),
        text: n.content,
        updatedAt: ts(n.at),
      });
    }
  }

  console.log("✓ Seeded ClassSync demo data.");
  console.log(`  Sign in as ${minji.email} (or daniel@, sora@, ethan@, yuna@classsync.test) — password: ${PASSWORD}`);
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("✗ Seeding failed:", err.message);
    console.error("  Is the Firebase emulator running? Start everything with `npm run dev`.");
    process.exit(1);
  });

