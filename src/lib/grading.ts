// KCSE-style scale: [minimum percent, grade, points]
const BANDS = [
  [80, "A", 12], [75, "A-", 11], [70, "B+", 10], [65, "B", 9], [60, "B-", 8], [55, "C+", 7],
  [50, "C", 6], [45, "C-", 5], [40, "D+", 4], [35, "D", 3], [30, "D-", 2], [0, "E", 1],
] as const;

export function gradeFor(percent: number) {
  const [, grade, points] = BANDS.find(([min]) => percent >= min)!;
  return { grade, points };
}

/** Mean grade from the average of subject points, rounded to the nearest band. */
export function gradeFromPoints(points: number) {
  const r = Math.round(points);
  return (BANDS.find((b) => b[2] === r) ?? BANDS[BANDS.length - 1])[1];
}
