import {
  ArrowRight,
  BellRing,
  CalendarDays,
  CheckCircle2,
  FileStack,
  GitCompareArrows,
  History,
  KeyRound,
  Sparkles,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { Crest } from "@/components/Logo";
import { SiteHeader } from "@/components/SiteHeader";

const FEATURES = [
  {
    icon: KeyRound,
    title: "Class workspaces",
    body: "Grouped by school, course, and section. Classmates join with a class code, so entries and notes stay inside the right class.",
  },
  {
    icon: CalendarDays,
    title: "Shared class calendar",
    body: "Quizzes, exams, assignments, and deadlines for all your classes in one monthly and weekly view. Anyone can add — everyone sees it instantly.",
  },
  {
    icon: History,
    title: "Verification & edit history",
    body: "Classmates confirm or correct each entry. Every change is recorded, and entries with few confirmations are clearly marked unverified.",
  },
  {
    icon: BellRing,
    title: "Missed-announcement catch-up",
    body: "Back from an absence? See everything announced while you were away or since you last opened the class — no need to ask around.",
  },
  {
    icon: FileStack,
    title: "Notes for every session",
    body: "Upload or paste your notes for a specific class session — board examples, spoken explanations, or test hints.",
  },
  {
    icon: Sparkles,
    title: "AI-merged class notes",
    body: "An AI model combines everyone's notes into one organized version, removes repetition, and links every point back to its source.",
  },
];

const GOALS = [
  ["Keep every student informed", "Assessment dates announced in class reach every student, including those who were absent."],
  ["Make shared info reliable", "Confirmations and corrections make the class record more trusted than any one student's notes."],
  ["Build one complete record", "Notes from several students merge into a single version that keeps what each one captured."],
  ["Show disagreements openly", "Conflicting notes are marked and linked to their sources instead of silently overwritten."],
  ["Help absent students catch up", "Recover announcements and lesson content from what classmates already recorded — no extra work for teachers."],
];

export default function Home() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        {/* ── Hero ───────────────────────────────────────── */}
        <section className="relative overflow-hidden bg-navy-900 text-white">
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.07]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.9) 1px, transparent 1px)",
              backgroundSize: "56px 56px",
            }}
          />
          <div className="pointer-events-none absolute -top-40 -right-40 h-[520px] w-[520px] rounded-full bg-gold-500/20 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-52 -left-32 h-[420px] w-[420px] rounded-full bg-navy-600/50 blur-3xl" />

          <div className="relative mx-auto grid max-w-6xl items-center gap-14 px-5 py-20 lg:grid-cols-[1.05fr_1fr] lg:py-28">
            <div className="animate-fade-up">
              <p className="eyebrow !text-gold-500">One class · One calendar · One set of notes</p>
              <h1 className="mt-5 font-serif text-5xl leading-[1.05] font-semibold tracking-tight sm:text-6xl">
                Never miss the
                <br />
                quiz <em className="text-gold-500">everyone else</em>
                <br />
                heard about.
              </h1>
              <p className="mt-6 max-w-lg text-lg leading-relaxed text-white/75">
                ClassSync gives your class one shared academic calendar and an AI that merges everyone&apos;s notes into a
                single, complete record — so one missed class never means missed information.
              </p>
              <div className="mt-9 flex flex-wrap items-center gap-3">
                <Link href="/signup" className="btn btn-gold px-7 py-3 text-base">
                  Create your class <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="btn border border-white/25 px-7 py-3 text-base text-white hover:bg-white/10">
                  I have a class code
                </Link>
              </div>
              <div className="mt-10 flex items-center gap-6 text-sm text-white/60">
                <span className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-gold-500" /> Classmate-verified dates</span>
                <span className="hidden items-center gap-2 sm:flex"><CheckCircle2 className="h-4 w-4 text-gold-500" /> Source-linked notes</span>
              </div>
            </div>

            <HeroPreview />
          </div>
        </section>

        {/* ── Problem ────────────────────────────────────── */}
        <section className="border-b border-line bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-5 py-20 md:grid-cols-[0.9fr_1.1fr]">
            <div>
              <p className="eyebrow">The problem</p>
              <h2 className="mt-3 font-serif text-4xl leading-tight font-semibold text-navy-900">
                Thirty private copies of the same announcement — and it still goes missing.
              </h2>
            </div>
            <div className="space-y-5 text-[17px] leading-relaxed text-muted">
              <p>
                Teachers announce quizzes, exams, and deadlines during class. Each student writes them down separately — in a
                notebook, a phone calendar, or not at all. Students who are absent, late, or simply distracted often find out a
                day or two before the test.
              </p>
              <p>
                Notes have the same problem. One student copies the board, another writes the spoken explanations, another
                marks what will be on the test.{" "}
                <strong className="font-semibold text-navy-900">No single set of notes is complete.</strong>
              </p>
              <p className="border-l-4 border-gold-500 pl-4 font-serif text-xl text-navy-900 italic">
                ClassSync turns the work students already do into one shared, reliable record.
              </p>
            </div>
          </div>
        </section>

        {/* ── Features ───────────────────────────────────── */}
        <section id="features" className="scroll-mt-24 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <div className="max-w-2xl">
              <p className="eyebrow">Features</p>
              <h2 className="mt-3 font-serif text-4xl font-semibold text-navy-900">Everything your class needs to stay in sync</h2>
            </div>
            <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {FEATURES.map(({ icon: Icon, title, body }) => (
                <div key={title} className="card group p-7 transition hover:-translate-y-0.5 hover:shadow-[var(--shadow-lift)]">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-navy-900 text-gold-500 transition group-hover:bg-gold-500 group-hover:text-navy-900">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="mt-5 font-serif text-xl font-semibold text-navy-900">{title}</h3>
                  <p className="mt-2 text-[15px] leading-relaxed text-muted">{body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ───────────────────────────────── */}
        <section id="how" className="scroll-mt-24 bg-navy-50 py-20">
          <div className="mx-auto max-w-6xl px-5">
            <div className="text-center">
              <p className="eyebrow">How it works</p>
              <h2 className="mt-3 font-serif text-4xl font-semibold text-navy-900">Three steps. Whole class covered.</h2>
            </div>
            <div className="mt-14 grid gap-8 md:grid-cols-3">
              {[
                ["Join your class", "Create a workspace for your course and section, then share the 6-letter class code with classmates."],
                ["Add & confirm", "Whoever hears an announcement adds it. Classmates confirm or correct it until it's verified."],
                ["Share & merge notes", "Upload notes after each session. The AI merges them into one complete, source-linked note."],
              ].map(([t, b], i) => (
                <div key={t} className="relative text-center">
                  <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border-2 border-gold-500 bg-white font-serif text-2xl font-bold text-navy-900">
                    {i + 1}
                  </div>
                  <h3 className="mt-5 font-serif text-xl font-semibold text-navy-900">{t}</h3>
                  <p className="mx-auto mt-2 max-w-xs text-[15px] leading-relaxed text-muted">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── AI notes ───────────────────────────────────── */}
        <section id="notes" className="scroll-mt-24 py-20">
          <div className="mx-auto grid max-w-6xl items-center gap-14 px-5 lg:grid-cols-2">
            <NotesPreview />
            <div>
              <p className="eyebrow">AI note merging</p>
              <h2 className="mt-3 font-serif text-4xl leading-tight font-semibold text-navy-900">
                Three partial notes in. One complete note out.
              </h2>
              <ul className="mt-7 space-y-4 text-[16px] text-muted">
                {[
                  [FileStack, "Keeps the information from every version — nothing is dropped because only one student wrote it."],
                  [Sparkles, "Removes repetition and organizes the lesson into clear sections, key terms, and likely test points."],
                  [GitCompareArrows, "Marks where notes disagree, showing each version side by side instead of picking one."],
                  [UsersRound, "Links every point back to the classmates' notes it came from, so you can check the source."],
                ].map(([Icon, text]) => {
                  const I = Icon as typeof FileStack;
                  return (
                    <li key={text as string} className="flex gap-3">
                      <I className="mt-0.5 h-5 w-5 shrink-0 text-gold-600" />
                      <span>{text as string}</span>
                    </li>
                  );
                })}
              </ul>
            </div>
          </div>
        </section>

        {/* ── Goals ──────────────────────────────────────── */}
        <section id="goals" className="scroll-mt-24 bg-navy-900 py-20 text-white">
          <div className="mx-auto max-w-6xl px-5">
            <p className="eyebrow !text-gold-500">Project objectives</p>
            <h2 className="mt-3 max-w-2xl font-serif text-4xl font-semibold">
              Not replacing note-taking — making sure no one loses what matters.
            </h2>
            <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-white/10 bg-white/10 sm:grid-cols-2 lg:grid-cols-5">
              {GOALS.map(([t, b], i) => (
                <div key={t} className="bg-navy-900 p-6">
                  <span className="font-serif text-3xl font-bold text-gold-500">0{i + 1}</span>
                  <h3 className="mt-3 font-semibold">{t}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-white/60">{b}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────── */}
        <section className="py-20">
          <div className="mx-auto max-w-4xl px-5">
            <div className="card relative overflow-hidden px-8 py-14 text-center">
              <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-navy-900 via-gold-500 to-navy-900" />
              <Crest className="mx-auto h-14 w-12" />
              <h2 className="mt-5 font-serif text-4xl font-semibold text-navy-900">Bring your class together.</h2>
              <p className="mx-auto mt-3 max-w-md text-muted">
                Set up a workspace in under a minute and share the code at the start of your next class.
              </p>
              <div className="mt-8 flex justify-center gap-3">
                <Link href="/signup" className="btn btn-primary px-7 py-3">
                  Get started free <ArrowRight className="h-4 w-4" />
                </Link>
                <Link href="/login" className="btn btn-outline px-7 py-3">
                  Sign in
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t-4 border-gold-500 bg-navy-950 text-white/60">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-5 py-8 text-sm sm:flex-row">
          <span className="flex items-center gap-2">
            <Crest className="h-7 w-6" /> <span className="font-serif text-base text-white">ClassSync</span>
          </span>
          <span>A shared class calendar and AI note-merging platform for students.</span>
        </div>
      </footer>
    </>
  );
}

function HeroPreview() {
  const days = Array.from({ length: 35 }, (_, i) => i - 2);
  const marks: Record<number, string> = { 6: "#fcc438", 9: "#ef6b73", 14: "#7aa5f5", 20: "#fcc438", 23: "#b08cf0", 27: "#ef6b73" };
  return (
    <div className="animate-fade-up relative mx-auto w-full max-w-md [animation-delay:120ms] lg:max-w-none">
      <div className="rounded-3xl border border-white/15 bg-white/[0.06] p-5 shadow-2xl backdrop-blur">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs tracking-widest text-gold-500 uppercase">AP Biology · Sec A</p>
            <p className="font-serif text-2xl font-semibold">October</p>
          </div>
          <span className="rounded-full bg-gold-500 px-3 py-1 text-xs font-bold text-navy-900">3 new since you left</span>
        </div>
        <div className="mt-4 grid grid-cols-7 gap-1.5 text-center text-[11px] text-white/40">
          {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
            <span key={i}>{d}</span>
          ))}
          {days.map((d) => (
            <span
              key={d}
              className={`relative flex aspect-square items-center justify-center rounded-lg text-xs ${
                d < 1 || d > 31 ? "text-white/15" : d === 13 ? "bg-white font-bold text-navy-900" : "bg-white/[0.04] text-white/80"
              }`}
            >
              {d < 1 ? 30 + d : d > 31 ? d - 31 : d}
              {marks[d] && <span className="absolute bottom-1 h-1 w-3 rounded-full" style={{ background: marks[d] }} />}
            </span>
          ))}
        </div>
      </div>
      <div className="absolute -bottom-8 -left-6 w-64 rounded-2xl bg-white p-4 text-ink shadow-2xl sm:-left-10">
        <div className="flex items-center gap-2">
          <span className="chip type-quiz" style={{ color: "var(--type)", background: "var(--type-bg)" }}>Quiz</span>
          <span className="chip bg-emerald-50 text-emerald-700"><CheckCircle2 className="h-3 w-3" /> Verified</span>
        </div>
        <p className="mt-2 font-serif text-lg leading-snug font-semibold text-navy-900">Cell Respiration Quiz</p>
        <p className="text-xs text-muted">Fri, Oct 9 · Ch. 7.1 – 7.3</p>
        <div className="mt-3 flex -space-x-2">
          {["#071350", "#2357c6", "#0f8a6b", "#c2410c"].map((c) => (
            <span key={c} className="h-6 w-6 rounded-full ring-2 ring-white" style={{ background: c }} />
          ))}
          <span className="pl-3 text-xs text-muted">4 confirmed</span>
        </div>
      </div>
    </div>
  );
}

function NotesPreview() {
  return (
    <div className="relative">
      <div className="grid grid-cols-3 gap-3">
        {[
          ["Minji", "Board", "#2357c6"],
          ["Daniel", "Explanation", "#0f8a6b"],
          ["Sora", "Test points", "#c2410c"],
        ].map(([n, f, c]) => (
          <div key={n} className="card p-3">
            <div className="flex items-center gap-1.5">
              <span className="h-5 w-5 rounded-full" style={{ background: c }} />
              <span className="text-xs font-semibold text-navy-900">{n}</span>
            </div>
            <p className="mt-1 text-[10px] tracking-wide text-muted uppercase">{f}</p>
            <div className="mt-2 space-y-1.5">
              <div className="h-1.5 w-full rounded bg-line" />
              <div className="h-1.5 w-4/5 rounded bg-line" />
              <div className="h-1.5 w-11/12 rounded bg-line" />
            </div>
          </div>
        ))}
      </div>
      <div className="mx-auto my-3 flex h-10 w-10 items-center justify-center rounded-full bg-gold-500 text-navy-900 shadow-lg">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="card overflow-hidden">
        <div className="bg-navy-900 px-5 py-3 text-white">
          <p className="text-[10px] tracking-widest text-gold-500 uppercase">Merged note · Oct 6</p>
          <p className="font-serif text-lg font-semibold">Cellular Respiration — Glycolysis</p>
        </div>
        <div className="space-y-2.5 p-5 text-sm">
          <p className="flex items-start gap-2">
            <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-navy-900" />
            <span>Glycolysis happens in the cytoplasm and doesn&apos;t need oxygen.</span>
            <span className="ml-auto flex shrink-0 -space-x-1">
              <span className="h-4 w-4 rounded-full bg-[#2357c6] ring-2 ring-white" />
              <span className="h-4 w-4 rounded-full bg-[#0f8a6b] ring-2 ring-white" />
            </span>
          </p>
          <p className="flex items-start gap-2">
            <span className="chip type-quiz shrink-0" style={{ color: "var(--type)", background: "var(--type-bg)" }}>Test</span>
            <span>Know the net ATP yield of glycolysis.</span>
          </p>
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-900">
            <p className="flex items-center gap-1.5 font-semibold">
              <GitCompareArrows className="h-3.5 w-3.5" /> Notes disagree: total ATP
            </p>
            <p className="mt-1">Minji: “36 ATP” · Daniel: “38 ATP (theoretical)”</p>
          </div>
        </div>
      </div>
    </div>
  );
}
