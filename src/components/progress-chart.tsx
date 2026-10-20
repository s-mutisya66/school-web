"use client";

export type Series = { name: string; values: (number | null)[]; strong?: boolean };

const COLORS = ["#14213D", "#0E8A4F", "#C2410C", "#0369A1", "#6D28D9", "#BE123C", "#4D7C0F"];
const DASHES = ["", "6 3", "2 3", "8 3 2 3", "1 4", "10 4", "4 2"]; // so lines differ by more than colour

/** A small line chart of mean score by exam. Plain SVG, no chart library. */
export function ProgressChart({ labels, series }: { labels: string[]; series: Series[] }) {
  const W = 640, H = 270, L = 40, R = 24, T = 16, Bt = 40;
  const all = series.flatMap((s) => s.values).filter((v): v is number => v !== null);
  if (all.length === 0) return <p className="text-sm text-slate-600">No marks have been entered for these exams yet.</p>;

  // Zoom the vertical axis to the data so small changes stay visible, but never past 0–100.
  const lo = Math.max(0, Math.floor((Math.min(...all) - 5) / 10) * 10);
  const hi = Math.min(100, Math.ceil((Math.max(...all) + 5) / 10) * 10);
  const x = (i: number) => L + (labels.length === 1 ? (W - L - R) / 2 : (i * (W - L - R)) / (labels.length - 1));
  const y = (v: number) => T + ((hi - v) / (hi - lo)) * (H - T - Bt);
  const ticks = Array.from({ length: 5 }, (_, i) => lo + ((hi - lo) * i) / 4);

  const summary = series
    .filter((s) => s.strong)
    .map((s) => `${s.name}: ${labels.map((l, i) => `${l} ${s.values[i] ?? "no marks"}`).join(", ")}`)
    .join(". ");

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Mean score by exam. ${summary}`} className="w-full">
        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#E2E8F0" />
            <text x={L - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#64748B">{Math.round(t)}%</text>
          </g>
        ))}
        {labels.map((l, i) => (
          <text key={l} x={x(i)} y={H - 14} textAnchor="middle" fontSize="12" fill="#334155">{l}</text>
        ))}
        {series.map((s, k) => {
          const pts = s.values.map((v, i) => (v === null ? null : [x(i), y(v)] as const));
          const drawn = pts.filter((p): p is readonly [number, number] => p !== null);
          const color = COLORS[k % COLORS.length], dash = DASHES[k % DASHES.length];
          return (
            <g key={s.name}>
              <polyline points={drawn.map((p) => p.join(",")).join(" ")} fill="none" stroke={color} strokeWidth={s.strong ? 3 : 1.75} strokeDasharray={dash} />
              {pts.map((p, i) => p && (
                <g key={i}>
                  <circle cx={p[0]} cy={p[1]} r={s.strong ? 4.5 : 3} fill={color} />
                  {s.strong && <text x={p[0]} y={p[1] - 10} textAnchor="middle" fontSize="12" fontWeight="600" fill={color}>{s.values[i]}</text>}
                </g>
              ))}
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {series.map((s, k) => (
          <span key={s.name} className="flex items-center gap-2">
            <svg width="26" height="8" aria-hidden="true"><line x1="0" x2="26" y1="4" y2="4" stroke={COLORS[k % COLORS.length]} strokeWidth="3" strokeDasharray={DASHES[k % DASHES.length]} /></svg>
            {s.name}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
