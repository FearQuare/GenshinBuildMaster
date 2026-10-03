"use client";

import { useOptimistic, useState, useTransition } from "react";
import { setOwned } from "./characters/actions";

export function FeaturedToggle({
  characterId,
  name,
  owned,
}: {
  characterId: string;
  name: string;
  owned: boolean;
}) {
  const [optimisticOwned, setOptimisticOwned] = useOptimistic(owned);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState(false);

  function toggle() {
    const next = !optimisticOwned;
    setError(false);
    startTransition(async () => {
      setOptimisticOwned(next);
      try {
        await setOwned(characterId, next);
      } catch {
        setError(true);
      }
    });
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        type="button"
        onClick={toggle}
        aria-pressed={optimisticOwned}
        aria-busy={pending}
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
      {error && (
        <p role="alert" className="font-mono text-xs text-text">
          Couldn&rsquo;t save that. Check your connection and try again.
        </p>
      )}
    </div>
  );
}
