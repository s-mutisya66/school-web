function rank(name: string, id: number) {
  const n = name.toLowerCase();
  if (/open/.test(n)) return 1;
  if (/mid/.test(n)) return 2;
  if (/mock/.test(n)) return 3;
  if (/end|final|close/.test(n)) return 4;
  return 10 + id;
}

export function sortExams<T extends { id: number; name: string }>(exams: T[]): T[] {
  return [...exams].sort((a, b) => rank(a.name, a.id) - rank(b.name, b.id) || a.id - b.id);
}
