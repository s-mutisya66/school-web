export type SheetRow = {
  id: number; name: string; gender: string; admissionNo: string; className: string;
  scores: (number | null)[]; incomplete: boolean; total: number; mean: number; grade: string; position: number;
};

export const nameWithSex = (r: { name: string; gender: string }) => (r.gender ? `${r.name} (${r.gender})` : r.name);
export const fmt = (n: number | null) => (n === null ? "–" : Number.isInteger(n) ? String(n) : n.toFixed(1));

export function rankRows<T extends { mean: number }>(rows: T[]): (T & { position: number })[] {
  let pos = 0, prev = Infinity;
  return [...rows].sort((a, b) => b.mean - a.mean).map((r, i) => {
    if (r.mean < prev) { pos = i + 1; prev = r.mean; }
    return { ...r, position: pos };
  });
}

export function bestBySubject(rows: SheetRow[], columns: { name: string }[], top = 3) {
  return columns.map((c, i) => {
    const scored = rows.filter((r) => r.scores[i] !== null).sort((a, b) => b.scores[i]! - a.scores[i]!);
    let pos = 0, prev = Infinity;
    const ranked = scored.map((r, k) => {
      if (r.scores[i]! < prev) { pos = k + 1; prev = r.scores[i]!; }
      return { position: pos, name: nameWithSex(r), className: r.className, score: r.scores[i]! };
    });
    return { subject: c.name, top: ranked.filter((x) => x.position <= top).slice(0, 6) };
  });
}
