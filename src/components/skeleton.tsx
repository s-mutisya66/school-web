export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`animate-pulse rounded-lg bg-slate-200 ${className}`} />;
}

type Variant = "cards" | "stats" | "table" | "form";

export function PageSkeleton({ variant = "cards" }: { variant?: Variant }) {
  return (
    <main className="space-y-6 p-4 sm:p-6" aria-busy="true">
      <span className="sr-only">Loading…</span>

      <div className="space-y-2">
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {variant === "stats" && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {[0, 1, 2, 3].map((i) => <Skeleton key={i} className="h-[164px] rounded-2xl" />)}
          </div>
          <div className="grid gap-6 xl:grid-cols-3">
            <Skeleton className="h-96 rounded-2xl xl:col-span-2" />
            <Skeleton className="h-96 rounded-2xl" />
          </div>
        </>
      )}

      {variant === "cards" && (
        <div className="grid gap-6 xl:grid-cols-2">
          {[0, 1].map((i) => <Skeleton key={i} className="h-44 rounded-2xl" />)}
        </div>
      )}

      {variant === "table" && (
        <div className="space-y-3 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          <Skeleton className="h-10 w-full max-w-sm" />
          {[0, 1, 2, 3, 4, 5].map((i) => <Skeleton key={i} className="h-10 w-full" />)}
        </div>
      )}

      {variant === "form" && (
        <div className="max-w-md space-y-4 rounded-2xl bg-white p-5 shadow-sm ring-1 ring-black/5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-10 w-full" />
            </div>
          ))}
          <Skeleton className="h-10 w-32" />
        </div>
      )}
    </main>
  );
}