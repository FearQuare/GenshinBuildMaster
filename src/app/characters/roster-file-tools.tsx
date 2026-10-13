"use client";

import { useMemo, useRef, useState } from "react";
import type { Character } from "@/generated/prisma/client";
import {
  parseRosterFile,
  RosterFileError,
  rosterFileName,
  toRosterFile,
} from "@/lib/roster-file";
import type { useRoster } from "@/lib/use-roster";

const BUTTON =
  "inline-flex h-11 items-center gap-2 whitespace-nowrap rounded-card border-[1.5px] border-line-strong px-4 text-sm text-text-strong transition-colors duration-(--dur-micro) hover:border-accent hover:bg-deep active:translate-y-px disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

type Status = { kind: "ok" | "error"; text: string };

// Export / Import the roster as a JSON file. Mainly for guests, whose roster otherwise
// lives only in this browser; signed-in users can use it as a backup.
export function RosterFileTools({
  roster,
  characters,
}: {
  roster: ReturnType<typeof useRoster>;
  characters: Character[];
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [busy, setBusy] = useState(false);
  const knownIds = useMemo(() => new Set(characters.map((c) => c.id)), [characters]);

  function exportFile() {
    const now = new Date();
    const blob = new Blob([JSON.stringify(toRosterFile(roster.entries, now), null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = rosterFileName(now);
    link.click();
    URL.revokeObjectURL(url);
    setStatus({ kind: "ok", text: `Exported ${roster.entries.length} characters.` });
  }

  async function importFile(file: File) {
    setBusy(true);
    setStatus(null);
    try {
      const { entries, skipped } = parseRosterFile(await file.text(), knownIds);
      const added = await roster.importEntries(entries);
      const parts = [`Imported ${added} new ${added === 1 ? "character" : "characters"}`];
      if (entries.length > added) parts.push(`${entries.length - added} already owned`);
      if (skipped) parts.push(`${skipped} unknown skipped`);
      setStatus({ kind: "ok", text: `${parts.join(", ")}.` });
    } catch (error) {
      setStatus({
        kind: "error",
        text:
          error instanceof RosterFileError
            ? error.message
            : "Couldn't import that file. Check your connection and try again.",
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <section
      aria-label="Save and load your roster"
      className="flex flex-col gap-4 rounded-card border border-line bg-panel p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5"
    >
      <div className="flex min-w-0 flex-col gap-1.5">
        <p className="flex items-center gap-2 font-mono text-xs tracking-wider uppercase">
          {roster.signedIn ? (
            <>
              <span aria-hidden className="size-2 rounded-full bg-accent" />
              <span className="text-text-strong">Synced to your account</span>
            </>
          ) : (
            <>
              <span aria-hidden className="caret size-2 bg-cyan" />
              <span className="text-cyan">Guest mode</span>
            </>
          )}
        </p>
        <p className="max-w-[60ch] text-sm text-muted">
          {roster.signedIn
            ? "Export a JSON copy as a backup, or import one to add its characters to your account."
            : "Your roster is saved in this browser only. Export it as JSON to keep a copy, or use Data Sync to save it to your HoYoLAB account."}
        </p>
        {status && (
          <p
            role={status.kind === "error" ? "alert" : "status"}
            className={`font-mono text-xs ${status.kind === "error" ? "text-text" : "text-text-strong"}`}
          >
            <span aria-hidden className={status.kind === "error" ? "text-accent" : "text-cyan"}>
              {status.kind === "error" ? "! " : "> "}
            </span>
            {status.text}
          </p>
        )}
      </div>

      <div className="flex shrink-0 flex-wrap gap-2">
        <button
          type="button"
          onClick={exportFile}
          disabled={!roster.ready || roster.entries.length === 0}
          className={BUTTON}
        >
          <DownloadIcon />
          Export JSON
        </button>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={!roster.ready || busy}
          aria-busy={busy}
          className={BUTTON}
        >
          <UploadIcon />
          {busy ? "Importing…" : "Import JSON"}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          aria-hidden
          tabIndex={-1}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) importFile(file);
          }}
        />
      </div>
    </section>
  );
}

function DownloadIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-4 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 2v8m0 0L5 7m3 3l3-3M3 13h10" strokeLinecap="square" />
    </svg>
  );
}

function UploadIcon() {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className="size-4 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M8 10V2m0 0L5 5m3-3l3 3M3 13h10" strokeLinecap="square" />
    </svg>
  );
}
