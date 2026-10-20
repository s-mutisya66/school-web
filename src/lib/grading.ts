// Letter grades come straight from the average percentage, with no points system.
// These are the five main KCSE letters: A (A and A-), B (B+ to B-), C (C+ to C-), D (D+ to D-) and E.
// To change the cut-offs, edit this table; everything else reads from it.
const BANDS = [[75, "A"], [60, "B"], [45, "C"], [30, "D"], [0, "E"]] as const;

export const GRADE_SCALE = "A 75–100, B 60–74, C 45–59, D 30–44, E 0–29";

export function gradeFor(percent: number): string {
  return BANDS.find(([min]) => percent >= min)![1];
}
