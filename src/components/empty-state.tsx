type Kind = "chart" | "people" | "calendar" | "document";

function Illustration({ kind }: { kind: Kind }) {
  const stroke = { stroke: "#105AC9", strokeWidth: 2.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const, fill: "none" };
  return (
    <svg viewBox="0 0 120 96" width="120" height="96" aria-hidden="true">
      <ellipse cx="60" cy="88" rx="34" ry="4.5" fill="#E2E8F0" />
      {kind === "chart" && (
        <g>
          <rect x="22" y="14" width="76" height="64" rx="8" {...stroke} fill="#EAF1FC" />
          <rect x="34" y="50" width="9" height="20" rx="2" fill="#105AC9" />
          <rect x="52" y="38" width="9" height="32" rx="2" fill="#0DB2D3" />
          <rect x="70" y="28" width="9" height="42" rx="2" fill="#F49D0B" />
          <path d="M30 74h60" {...stroke} />
        </g>
      )}
      {kind === "people" && (
        <g>
          <circle cx="46" cy="36" r="11" {...stroke} fill="#EAF1FC" />
          <path d="M26 74c0-11 9-19 20-19s20 8 20 19" {...stroke} fill="#EAF1FC" />
          <circle cx="78" cy="42" r="9" {...stroke} fill="#FDE7D3" />
          <path d="M64 76c1-9 7-15 14-15s13 6 14 15" {...stroke} fill="#FDE7D3" />
        </g>
      )}
      {kind === "calendar" && (
        <g>
          <rect x="24" y="20" width="72" height="58" rx="8" {...stroke} fill="#EAF1FC" />
          <path d="M24 38h72M42 12v14M78 12v14" {...stroke} />
          <path d="M40 52h6M57 52h6M74 52h6M40 64h6M57 64h6" stroke="#105AC9" strokeWidth="4" strokeLinecap="round" />
        </g>
      )}
      {kind === "document" && (
        <g>
          <path d="M34 12h34l20 20v46a6 6 0 0 1-6 6H34a6 6 0 0 1-6-6V18a6 6 0 0 1 6-6Z" {...stroke} fill="#EAF1FC" />
          <path d="M68 12v20h20" {...stroke} />
          <path d="M40 48h36M40 60h36M40 72h22" {...stroke} />
        </g>
      )}
    </svg>
  );
}

export function EmptyState({ kind = "document", title, text, action, compact }: {
  kind?: Kind; title: string; text: string; action?: { label: string; href: string }; compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center px-4 text-center ${compact ? "py-8" : "py-14"}`}>
      <Illustration kind={kind} />
      <h3 className="mt-3 font-[family-name:var(--font-display)] text-lg font-bold text-slate-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-slate-600">{text}</p>
      {action && (
        <a href={action.href} className="mt-5 inline-flex min-h-10 items-center rounded-lg bg-[#105AC9] px-5 text-sm font-semibold text-white hover:bg-[#0B3F8F] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#105AC9]">
          {action.label}
        </a>
      )}
    </div>
  );
}
