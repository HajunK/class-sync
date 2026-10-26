import { COURSE_CATALOG } from "./catalog";

/** The catalog courses that match the names of ClassSync classes (ignoring case and extra spaces), without repeats. */
export function catalogMatches(classNames: string[]): string[] {
  const found = new Set<string>();
  for (const name of classNames) {
    const course = COURSE_CATALOG.find((c) => c.name.toLowerCase() === name.trim().toLowerCase());
    if (course) found.add(course.name);
  }
  return [...found];
}

/**
 * Which of the student's classes still need adding to the calculator: they match a catalog course, aren't in the
 * calculator, and haven't been added before. That last part keeps a course the student removed from coming back.
 */
export function classesToImport(classNames: string[], courses: string[], imported: string[]): string[] {
  const skip = new Set([...courses, ...imported]);
  return catalogMatches(classNames).filter((name) => !skip.has(name));
}
