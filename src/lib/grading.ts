const BANDS = [
  [80, "A"], [75, "A-"], [70, "B+"], [65, "B"], [60, "B-"], [55, "C+"],
  [50, "C"], [45, "C-"], [40, "D+"], [35, "D"], [30, "D-"], [0, "E"],
] as const;

export const GRADE_SCALE =
  "A 80–100, A- 75–79, B+ 70–74, B 65–69, B- 60–64, C+ 55–59, C 50–54, C- 45–49, D+ 40–44, D 35–39, D- 30–34, E 0–29";

export function gradeFor(percent: number): string {
  return BANDS.find(([min]) => percent >= min)![1];
}
