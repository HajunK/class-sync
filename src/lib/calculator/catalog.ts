/**
 * KISJ course catalog — the fields the grade calculator needs.
 * Copied from kisj-grade-calculator/public/js/course-catalog.js
 * (see kisj-grade-calculator/docs/CALCULATOR_SPEC.md §2.4).
 *
 * - final:  has a Final Exam box (20/60/20 instead of 25/75). Currently none do.
 * - ap:     +1.0 in the weighted GPA
 * - weight: GPA credits (Lunch etc. are 0; combo sub-courses are 0.5)
 * - combo:  one schedule slot that is really two classes (Korean → Korean Language + Korean SS)
 */
export interface CatalogCourse {
  name: string;
  ap: boolean;
  final: boolean;
  weight: number;
  combo?: CatalogCourse[];
}

const c = (name: string, ap = false, weight = 1): CatalogCourse => ({ name, ap, final: false, weight });

export const COURSE_CATALOG: CatalogCourse[] = [
  c("Algebra II"),
  c("AP Art", true),
  c("Biology"),
  c("AP Biology", true),
  c("Calculus"),
  c("AP Calculus", true),
  c("Chamber Choir"),
  c("Chemistry"),
  c("AP Chemistry", true),
  c("Chinese"),
  c("AP Chinese", true),
  c("Heritage Chinese"),
  c("Choir"),
  c("AP Comparative Gov", true),
  c("Concert Band"),
  c("Creative Writing"),
  c("AP CSA", true),
  c("AP CSP", true),
  c("Debate"),
  c("Design and Tech"),
  c("Advanced Design and Tech"),
  c("Digital Photography"),
  c("Earth Science"),
  c("Economics"),
  c("AP Economics", true),
  c("Engineering"),
  c("Advanced Engineering"),
  c("English"),
  c("AP Language", true),
  c("AP Literature", true),
  c("AP Environmental Science", true),
  c("Ethics"),
  c("Film as Literature"),
  c("Geometry"),
  c("Global Studies"),
  c("Graphic Design"),
  c("Hajun Studies", false, 0),
  c("Health & Fitness"),
  c("AP Human Geography", true),
  c("Individual/Dual Pursuits"),
  c("Journalism"),
  { ...c("Korean"), combo: [c("Korean Language", false, 0.5), c("Korean SS", false, 0.5)] },
  c("Linear Algebra"),
  c("Lunch", false, 0),
  c("AP Lunch", true, 0),
  c("Modern Band"),
  c("Movement & Expression"),
  c("Multivariable Calculus"),
  c("AP Music Theory", true),
  c("Personal Fitness"),
  c("Physics"),
  c("AP Physics", true),
  c("Pre-Calculus"),
  c("Programming"),
  c("Psychology"),
  c("AP Psychology", true),
  c("Public Speaking"),
  c("Recreational & Lifetime Sports"),
  c("AP Research", true),
  c("Robotics"),
  c("Advanced Robotics"),
  c("AP Seminar", true),
  c("Sociology"),
  c("Solo Vocal Technique"),
  c("Spanish"),
  c("AP Spanish", true),
  c("AP Statistics", true),
  c("String Orchestra"),
  c("Advanced String Orchestra"),
  c("Theater"),
  c("Advanced Theater"),
  c("AP US Gov", true),
  c("US History"),
  c("AP US History", true),
  c("Videography"),
  c("Visual Art"),
  c("Wellness"),
  c("Wind Ensemble"),
  c("AP World History", true),
  c("Writing"),
  c("Yearbook"),
];

/** Finds a course by name, including a combo course's sub-courses. */
export function findCourse(name: string, catalog: CatalogCourse[] = COURSE_CATALOG): CatalogCourse | null {
  for (const course of catalog) {
    if (course.name === name) return course;
    const sub = course.combo?.find((s) => s.name === name);
    if (sub) return sub;
  }
  return null;
}

/** Expands combo courses into the classes that actually get grades (Korean → Korean Language, Korean SS). */
export function expandCourseNames(names: string[], catalog: CatalogCourse[] = COURSE_CATALOG): string[] {
  return names.flatMap((name) => {
    const course = catalog.find((x) => x.name === name);
    return course?.combo ? course.combo.map((s) => s.name) : [name];
  });
}
