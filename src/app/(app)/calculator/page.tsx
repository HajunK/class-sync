"use client";

import clsx from "clsx";
import { Plus, X } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { DomainCard, emptyScores } from "@/components/calculator/DomainCard";
import { GpaPanel } from "@/components/calculator/GpaPanel";
import { useData } from "@/components/data";
import { PageLoader } from "@/components/ui";
import { useWorkspace } from "@/components/workspace";
import { COURSE_CATALOG, expandCourseNames, findCourse } from "@/lib/calculator/catalog";
import { catalogMatches, classesToImport } from "@/lib/calculator/classCourses";
import { useEncouragement } from "@/lib/calculator/encouragement";
import { buildGpaRows, computeDomain, pasteFromDomain, type CourseScores, type GradeSlug } from "@/lib/calculator/grades";

export default function CalculatorPage() {
  const { classes } = useWorkspace();
  const { state, loading, saving, update } = useData().calculator;
  const [tab, setTab] = useState<"domain" | "gpa">("domain");

  const cards = useMemo(() => expandCourseNames(state.courses), [state.courses]);
  // A short encouraging line from ChatGPT under each course's grade breakdown, new on every refresh.
  const encouragement = useEncouragement(cards);

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

  // Classes you're already in on ClassSync are added here, once each. One you remove stays removed.
  const classNames = useMemo(() => classes.map((c) => c.course), [classes]);
  useEffect(() => {
    if (loading) return;
    const add = classesToImport(classNames, state.courses, state.imported);
    if (!add.length) return;
    update((st) => {
      // Re-checked against the latest state, in case this effect runs twice.
      const fresh = add.filter((n) => !st.courses.includes(n) && !st.imported.includes(n));
      return fresh.length ? { ...st, courses: [...st.courses, ...fresh], imported: [...st.imported, ...fresh] } : st;
    });
    toast(`Added your ClassSync ${add.length === 1 ? "class" : "classes"}: ${add.join(", ")}.`, { id: "calculator-import" });
  }, [loading, classNames, state.courses, state.imported, update]);

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
          <h1 className="font-heading text-3xl font-extrabold text-navy-900">Grade Calculator</h1>
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
                message={encouragement(name)}
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

      <div className="flex flex-wrap items-stretch gap-3">
        <AddCourse courses={state.courses} suggestions={classNames} onAdd={addCourse} />
        <MyCourses courses={state.courses} onRemove={removeCourse} />
      </div>
    </div>
  );
}

/** The courses you've added, each with an ✕ to remove it. Compact, so it can sit beside the add form. */
function MyCourses({ courses, onRemove }: { courses: string[]; onRemove: (name: string) => void }) {
  return (
    <div className="card flex min-w-[16rem] flex-1 flex-wrap items-center gap-1.5 px-3 py-1">
      <span className="text-[11px] font-semibold tracking-wide text-muted uppercase">My courses</span>
      {courses.length === 0 && <span className="text-xs text-muted">None yet. Add one on the left.</span>}
      {courses.map((name) => (
        <span key={name} className="flex items-center gap-0.5 rounded-full border border-line bg-paper py-0.5 pr-1 pl-2.5 text-[11px] leading-4 font-semibold text-navy-900">
          {name}
          <button onClick={() => onRemove(name)} className="rounded-full p-0.5 text-muted hover:bg-white hover:text-red-600" aria-label={`Remove ${name}`}>
            <X className="h-2.5 w-2.5" />
          </button>
        </span>
      ))}
    </div>
  );
}

/** Add a course: picked from the school catalog so AP status and credits are right. Sits below the course cards. */
function AddCourse({ courses, suggestions, onAdd }: { courses: string[]; suggestions: string[]; onAdd: (name: string) => void }) {
  const [pick, setPick] = useState("");
  const available = COURSE_CATALOG.filter((c) => !courses.includes(c.name));
  // ClassSync classes that match a catalog course but aren't in the calculator (for example, ones you removed).
  const fromClasses = catalogMatches(suggestions).filter((n) => !courses.includes(n));

  return (
    <form
      className="card flex shrink-0 flex-wrap items-center gap-1.5 px-3 py-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (pick) onAdd(pick);
        setPick("");
      }}
    >
      <select className="input !h-7 !w-auto !px-2 !py-0 !text-xs" value={pick} onChange={(e) => setPick(e.target.value)} aria-label="Course to add">
        <option value="">Choose a course…</option>
        {available.map((c) => (
          <option key={c.name} value={c.name}>
            {c.name}
          </option>
        ))}
      </select>
      <button className="btn btn-primary btn-sm !px-3 !py-1">
        <Plus className="h-3 w-3" /> Add course
      </button>
      {fromClasses.length > 0 && (
        <span className="flex flex-wrap items-center gap-1 text-[11px] text-muted">
          From your classes:
          {fromClasses.map((n) => (
            <button key={n} type="button" onClick={() => onAdd(n)} className="rounded-full border border-dashed border-navy-900/30 px-2 py-0.5 font-semibold text-navy-900 hover:bg-navy-50">
              + {n}
            </button>
          ))}
        </span>
      )}
    </form>
  );
}

/** Shown before any course is added: try the calculator without saving (§10). */
function ExampleCards() {
  const [withFinal, setWithFinal] = useState(emptyScores());
  const [withoutFinal, setWithoutFinal] = useState(emptyScores());
  // The examples get a message too. It shows up when it's ready; the cards don't wait for it.
  const encouragement = useEncouragement(["Course with Finals", "Course without Finals"]);
  return (
    <div className="space-y-3">
      <p className="text-sm text-muted">Try it out — these example cards aren&apos;t saved. Add your courses above to keep your grades.</p>
      <div className="grid grid-cols-1 gap-5 xl:grid-cols-2">
        <DomainCard id="ex-final" name="Course with Finals" hasFinal scores={withFinal} onChange={setWithFinal} example message={encouragement("Course with Finals")} />
        <DomainCard id="ex-nofinal" name="Course without Finals" hasFinal={false} scores={withoutFinal} onChange={setWithoutFinal} example message={encouragement("Course without Finals")} />
      </div>
    </div>
  );
}
