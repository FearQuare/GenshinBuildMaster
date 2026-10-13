"use client";

import { useState } from "react";

// Downloads the build card as a PNG, rendered on the server
// (/api/hoyolab/characters/[id]/card).
export function DownloadCardButton({ characterId, fileName }: { characterId: number; fileName: string }) {
  const [state, setState] = useState<"idle" | "rendering" | "error">("idle");

  async function download() {
    setState("rendering");
    try {
      const response = await fetch(`/api/hoyolab/characters/${characterId}/card`);
      if (!response.ok) throw new Error(String(response.status));
      const url = URL.createObjectURL(await response.blob());
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      link.click();
      URL.revokeObjectURL(url);
      setState("idle");
    } catch {
      setState("error");
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={download}
        disabled={state === "rendering"}
        aria-busy={state === "rendering"}
        className="inline-flex h-10 items-center gap-2 whitespace-nowrap rounded-card bg-accent px-4 text-sm text-accent-ink transition-transform duration-(--dur-micro) hover:-translate-y-px active:translate-y-px disabled:pointer-events-none disabled:opacity-70 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus"
      >
        <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.6">
          <path d="M8 2v8m0 0L5 7m3 3l3-3M3 13h10" strokeLinecap="square" />
        </svg>
        {state === "rendering" ? "Rendering…" : "Download PNG"}
      </button>
      {state === "error" && (
        <p role="alert" className="font-mono text-[11px] text-text">
          Couldn&rsquo;t render the card. Try again.
        </p>
      )}
    </div>
  );
}
