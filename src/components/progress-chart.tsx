"use client";

export type Series = { name: string; values: (number | null)[]; strong?: boolean };

const COLORS = ["#14213D", "#0E8A4F", "#C2410C", "#0369A1", "#6D28D9", "#BE123C", "#4D7C0F"];

// Each series also gets its own texture, so the bars can be told apart without relying on colour.
function Texture({ id, color, kind }: { id: string; color: string; kind: number }) {
  return (
    <pattern id={id} patternUnits="userSpaceOnUse" width="7" height="7">
      <rect width="7" height="7" fill={color} />
      {kind === 1 && <path d="M-1 8 L8 -1" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.6" />}
      {kind === 2 && <circle cx="3.5" cy="3.5" r="1.3" fill="#fff" fillOpacity="0.6" />}
      {kind === 3 && <path d="M0 3.5 H7" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.6" />}
    </pattern>
  );
}

/** A grouped bar chart: one group of bars per exam, one bar per series (the form first, then its streams). Plain SVG. */
export function ProgressChart({ labels, series, colors }: { labels: string[]; series: Series[]; colors?: string[] }) {
  const palette = colors && colors.length > 0 ? colors : COLORS;
  const W = 640, H = 300, L = 42, R = 14, T = 24, Bt = 44;
  const all = series.flatMap((s) => s.values).filter((v): v is number => v !== null);
  if (all.length === 0) return <p className="text-sm text-slate-600">No marks have been entered for these exams yet.</p>;

  // Bars always start at zero, so their heights can be compared honestly.
  const step = Math.max(...all) + 3 <= 50 ? 10 : 20;
  const top = Math.min(100, Math.ceil((Math.max(...all) + 3) / step) * step);
  const plotH = H - T - Bt, plotW = W - L - R;
  const y = (v: number) => T + (1 - v / top) * plotH;
  const ticks = Array.from({ length: top / step + 1 }, (_, i) => i * step);

  const groupW = plotW / labels.length;
  const barW = Math.min(38, (groupW * 0.8) / series.length);
  const decimals = barW >= 26;

  const summary = series
    .filter((s) => s.strong)
    .map((s) => `${s.name}: ${labels.map((l, i) => `${l} ${s.values[i] ?? "no marks"}`).join(", ")}`)
    .join(". ");

  const fill = (k: number) => (k % 4 === 0 ? palette[k % palette.length] : `url(#pc-${k})`);

  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`Mean score in each exam, as bars. ${summary}`} className="w-full">
        <defs>
          {series.map((_, k) => <Texture key={k} id={`pc-${k}`} color={palette[k % palette.length]} kind={k % 4} />)}
        </defs>

        {ticks.map((t) => (
          <g key={t}>
            <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke={t === 0 ? "#94A3B8" : "#E2E8F0"} />
            <text x={L - 6} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#64748B">{t}%</text>
          </g>
        ))}

        {labels.map((label, i) => {
          const start = L + i * groupW + (groupW - barW * series.length) / 2;
          return (
            <g key={label}>
              {series.map((s, k) => {
                const v = s.values[i];
                if (v === null) return null;
                const bx = start + k * barW;
                return (
                  <g key={s.name}>
                    <rect x={bx + 1} y={y(v)} width={barW - 2} height={y(0) - y(v)} fill={fill(k)} rx="2" />
                    <text x={bx + barW / 2} y={y(v) - 4} textAnchor="middle" fontSize={decimals ? 11 : 9.5} fontWeight={s.strong ? 700 : 500} fill="#334155">
                      {decimals ? v : Math.round(v)}
                    </text>
                  </g>
                );
              })}
              <text x={L + i * groupW + groupW / 2} y={H - 16} textAnchor="middle" fontSize="12.5" fontWeight="600" fill="#334155">{label}</text>
            </g>
          );
        })}
      </svg>

      <figcaption className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm">
        {series.map((s, k) => (
          <span key={s.name} className="flex items-center gap-2">
            <svg width="16" height="16" aria-hidden="true"><rect width="16" height="16" rx="2" fill={fill(k)} /></svg>
            {s.name}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
