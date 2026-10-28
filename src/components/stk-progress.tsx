import { Check, Loader2, X } from "lucide-react";

export type StkStage = "sending" | "waiting" | "confirmed" | "failed";

export function maskPhone(input: string) {
  const d = input.replace(/\D/g, "").replace(/^254/, "").replace(/^0/, "");
  return d.length >= 9 ? `+254 ${d.slice(0, 3)} ••• ${d.slice(6, 9)}` : "your phone";
}

export function StkProgress({ stage, phone, failure }: { stage: StkStage; phone: string; failure?: string }) {
  const masked = maskPhone(phone);
  const at = stage === "sending" ? 0 : stage === "waiting" || stage === "failed" ? 1 : 2;
  const steps = [
    { doing: `Sending STK Push to ${masked}…`, done: `STK Push sent to ${masked}` },
    { doing: "Waiting for PIN entry…", done: "PIN entered" },
    { doing: "Payment confirmed. Updating balance…", done: "Payment confirmed. Balance updated" },
  ];

  return (
    <div role="status" aria-live="polite">
      <ol className="space-y-3">
        {steps.map((s, i) => {
          const failed = stage === "failed" && i === at;
          const done = i < at;
          const active = i === at && !failed;
          return (
            <li key={i} className={`flex items-center gap-3 ${!done && !active && !failed ? "text-slate-400" : "text-slate-900"}`}>
              <span className={`flex size-7 shrink-0 items-center justify-center rounded-full ${done ? "bg-[#0E8A4F] text-white" : failed ? "bg-[#BE123C] text-white" : active ? "bg-[#DDEBF8] text-[#105AC9]" : "bg-slate-100 text-slate-400"}`}>
                {done ? <Check size={15} aria-hidden="true" /> : failed ? <X size={15} aria-hidden="true" /> : active ? <Loader2 size={15} aria-hidden="true" className="motion-safe:animate-spin" /> : <span className="size-1.5 rounded-full bg-current" />}
              </span>
              <span className={`text-sm ${active ? "font-semibold" : ""}`}>{done ? s.done : failed ? failure ?? "Payment cancelled" : s.doing}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}
