"use client";

import clsx from "clsx";
import { Plus, X } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { DomainCard, emptyScores } from "@/components/calculator/DomainCard";
import { GpaPanel } from "@/components/calculator/GpaPanel";
import { PageLoader } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { COURSE_CATALOG, expandCourseNames, findCourse } from "@/lib/calculator/catalog";
import { buildGpaRows, computeDomain, pasteFromDomain, type CourseScores, type GradeSlug } from "@/lib/calculator/grades";
import { useCalculatorState } from "@/lib/calculator/store";

export default function CalculatorPage() {
  const { actor, classes } = useWorkspace();
  const { state, loading, saving, update } = useCalculatorState(actor.uid);
  const [tab, setTab] = useState<"domain" | "gpa">("domain");

  const cards = useMemo(() => expandCourseNames(state.courses), [state.courses]);

  // Each course's current Domain grade (from the calculation itself, not the screen — §11 #4).
  const domainGrades = useMemo(() => {
    const out: Record<string, GradeSlug | null> = {};
    for (const name of cards) {
      const s = state.domainScores[name];
      out[name] = s ? (computeDomain(s, findCourse(name)?.final ?? false).grade?.slug ?? null) : null;
    }
    return out;
  }, [cards, state.domainScores]);

  const gpaRows = useMemo(() => buildGpaRows(state.courses, state.gpaClasses, domainGrades), [state.courses, state.gpaClasses, domainGrades]);

  if (loading) return <PageLoader />;

  const setScores = (name: string, s: CourseScores) => update((st) => ({ ...st, domainScores: { ...st.domainScores, [name]: s } }));
  const addCourse = (name: string) => {
    if (state.courses.includes(name)) return toast(`${name} is already in your list.`);
    update((st) => ({ ...st, courses: [...st.courses, name] }));
  };
  const removeCourse = (name: string) => update((st) => ({ ...st, courses: st.courses.filter((c) => c !== name) }));

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-serif text-3xl font-semibold text-navy-900">Grade Calculator</h1>
          <p className="text-sm text-muted">
            Only you can see your grades.
            <span className="ml-2 text-xs">{saving === "pending" ? "Saving…" : saving === "error" ? "Couldn't save — check your connection" : "All changes saved"}</span>
          </p>
        </div>
        <div className="flex rounded-lg bg-white p-1 text-sm font-semibold shadow-[var(--shadow-card)]">
          {(["domain", "gpa"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={clsx("rounded-md px-4 py-1.5", tab === t ? "bg-navy-900 text-white" : "text-muted")}>
              {t === "domain" ? "Domain" : "GPA"}
            </button>
          ))}
        </div>
      </div>

      <CourseBar
        courses={state.courses}
        suggestions={classes.map((c) => c.course)}
        onAdd={addCourse}
        onRemove={removeCourse}
      />

      {tab === "domain" ? (
        cards.length === 0 ? (
          <ExampleCards />
        ) : (
          <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
            {cards.map((name) => (
              <DomainCard
                key={name}
                id={`card-${name.replace(/\W+/g, "-")}`}
                name={name}
                hasFinal={findCourse(name)?.final ?? false}
                scores={state.domainScores[name] ?? emptyScores()}
                onChange={(s) => setScores(name, s)}
              />
            ))}
          </div>
        )
      ) : (
        <GpaPanel
          rows={gpaRows}
          domainGradeCount={Object.values(domainGrades).filter(Boolean).length}
          onSetGrade={(name, slug) =>
            update((st) => ({
              ...st,
              gpaClasses: [...st.gpaClasses.filter((r) => r.name !== name), { name, slug }],
            }))
          }
          onPasteFromDomain={() => {
            update((st) => ({ ...st, gpaClasses: pasteFromDomain(gpaRows, domainGrades) }));
            toast.success("Grades copied from the Domain tab.");
          }}
        />
      )}
    </div>
  );
}

/** My courses: picked from the school catalog so AP status and credits are right. */
function CourseBar({
  courses,
  suggestions,
  onAdd,
  onRemove,
}: {
  courses: string[];
  suggestions: string[];
  onAdd: (name: string) => void;
  onRemove: (name: string) => void;
}) {
  const [pick, setPick] = useState("");
  const available = COURSE_CATALOG.filter((c) => !courses.includes(c.name));
  // ClassSync classes whose name matches a catalog course.
  const fromClasses = Array.from(
    new Set(
      suggestions
        .map((s) => COURSE_CATALOG.find((c) => c.name.toLowerCase() === s.trim().toLowerCase())?.name)
        .filter((n): n is string => !!n && !courses.includes(n)),
    ),
  );

  return (
    <div className="card space-y-3 px-5 py-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold tracking-wide text-muted uppercase">My courses</span>
        {courses.length === 0 && <span className="text-sm text-muted">None yet — add your courses to start.</span>}
        {courses.map((name) => (
          <span key={name} className="flex items-center gap-1 rounded-full border border-line bg-paper py-1 pr-1.5 pl-3 text-xs font-semibold text-navy-900">
            {name}
            {findCourse(name)?.ap && <span className="text-gold-600">AP</span>}
            <button onClick={() => onRemove(name)} className="rounded-full p-0.5 text-muted hover:bg-white hover:text-red-600" aria-label={`Remove ${name}`}>
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>
      <form
        className="flex flex-wrap items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          if (pick) onAdd(pick);
          setPick("");
        }}
      >
        <select className="input !h-9 !w-auto !py-1.5" value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Course to add">
          <option value="">Choose a course…</option>
          {available.map((c) => (
            <option key={c.name} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        <button className="btn btn-primary btn-sm" disabled={!pick}>
          <Plus className="h-3.5 w-3.5" /> Add
        </button>
        {fromClasses.length > 0 && (
          <span className="flex flex-wrap items-center gap-1.5 text-xs text-muted">
            From your classes:
            {fromClasses.map((n) => (
              <button key={n} type="button" onClick={() => onAdd(n)} className="rounded-full border border-dashed border-navy-900/30 px-2.5 py-1 font-semibold text-navy-900 hover:bg-navy-50">
                + {n}
              </button>
            ))}
          </span>
        )}
      </form>
    </div>
  );
}

/** Shown before any course is added: try the calculator without saving (§10). */
function ExampleCards() {
  const [withFinal, setWithFinal] = useState(emptyScores());
  const [withoutFinal, setWithoutFinal] = useState(emptyScores());
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Try it out — these example cards aren&apos;t saved. Add your courses above to keep your grades.</p>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <DomainCard id="ex-final" name="Course with Finals" hasFinal scores={withFinal} onChange={setWithFinal} example />
        <DomainCard id="ex-nofinal" name="Course without Finals" hasFinal={false} scores={withoutFinal} onChange={setWithoutFinal} example />
      </div>
    </div>
  );
}
