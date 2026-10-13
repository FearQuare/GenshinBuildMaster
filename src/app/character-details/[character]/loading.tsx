// Shown while a character's build loads from HoYoLAB (the sidebar stays put).
export default function Loading() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-6">
      <span className="sr-only">Loading build…</span>
      <div className="grid gap-6 rounded-card border border-line bg-panel p-5 sm:p-6 md:grid-cols-[minmax(0,16rem)_minmax(0,1fr)]">
        <div className="skeleton aspect-[3/4] rounded-card md:aspect-auto md:h-80" />
        <div className="flex flex-col gap-4">
          <div className="skeleton h-4 w-24 rounded-sm" />
          <div className="skeleton h-12 w-2/3 rounded-sm" />
          <div className="skeleton h-4 w-1/2 rounded-sm" />
          <div className="mt-2 flex gap-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="skeleton size-16 rounded-card" />
            ))}
          </div>
          <div className="flex gap-2">
            {[0, 1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="skeleton size-10 rounded-full" />
            ))}
          </div>
        </div>
      </div>
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.35fr)]">
        <div className="skeleton h-96 rounded-card" />
        <div className="skeleton h-96 rounded-card" />
      </div>
    </div>
  );
}
