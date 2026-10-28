export const card = "rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5";
export const heading = "font-[family-name:var(--font-display)] text-lg font-bold";
export const TONES = { sand: "bg-[#FBE9D9]", sky: "bg-[#DDEBF8]", mint: "bg-[#DCF2E4]", rose: "bg-[#F9E0E0]", amber: "bg-[#FDE7D3]" } as const;

export function Tile({ label, value, sub, tone }: { label: string; value: React.ReactNode; sub?: React.ReactNode; tone: keyof typeof TONES }) {
  return (
    <div className={`rounded-2xl p-5 ${TONES[tone]}`}>
      <p className="text-sm text-slate-700">{label}</p>
      <p className="mt-1 text-3xl font-bold tracking-tight">{value}</p>
      {sub && <p className="mt-1 text-sm text-slate-600">{sub}</p>}
    </div>
  );
}
