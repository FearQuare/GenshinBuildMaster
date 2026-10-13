"use client";

import type { OwnedEntry } from "@/lib/roster-file";
import { useRoster } from "@/lib/use-roster";

export function FeaturedToggle({
  characterId,
  name,
  serverOwned,
}: {
  characterId: string;
  name: string;
  serverOwned: OwnedEntry[] | null;
}) {
  const roster = useRoster(serverOwned);
  const optimisticOwned = roster.owned.has(characterId);

  function toggle() {
    roster.setOwned(characterId, !optimisticOwned, name);
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={optimisticOwned}
        className={`inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-card border px-4 font-mono text-sm transition-colors duration-(--dur-micro) active:translate-y-px focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus ${
          optimisticOwned
            ? "border-accent bg-deep text-text-strong"
            : "border-line-strong text-text hover:border-accent hover:bg-panel-2"
        }`}
      >
        <span aria-hidden className={optimisticOwned ? "text-accent" : "text-muted"}>
          {optimisticOwned ? "■" : "□"}
        </span>
        {optimisticOwned ? `${name} is in your roster` : `I own ${name}`}
      </button>
      {roster.error && (
        <p role="alert" className="font-mono text-xs text-text">
          {roster.error}
        </p>
      )}
    </div>
  );
}
