import Link from "next/link";
import type { ReactNode } from "react";

// Full-width message for the Character Details page: guests, errors, empty rosters.
export function StatusPanel({
  label,
  title,
  children,
  tone = "info",
}: {
  label: string;
  title: string;
  children: ReactNode;
  tone?: "info" | "error";
}) {
  return (
    <div
      role={tone === "error" ? "alert" : undefined}
      className="boot-in flex flex-col items-start gap-4 rounded-card border border-dashed border-line-strong bg-panel px-6 py-10 sm:px-10 sm:py-14"
    >
      <p className="font-mono text-xs tracking-wider uppercase">
        <span className={tone === "error" ? "text-accent" : "text-cyan"}>
          {tone === "error" ? "! " : "> "}
        </span>
        <span className="text-muted">{label}</span>
      </p>
      <h2 className="max-w-[24ch] text-3xl leading-tight text-text-strong sm:text-4xl">{title}</h2>
      <div className="flex max-w-[60ch] flex-col gap-3 text-text">{children}</div>
    </div>
  );
}

export function GuestNotice() {
  return (
    <StatusPanel label="Data Sync required" title="Builds come straight from your HoYoLAB account.">
      <p>
        Character Details shows the artifacts, weapon and stats each character is wearing right
        now, read from your Battle Chronicle. Click <strong className="text-text-strong">Data Sync</strong>{" "}
        at the top right to sign in.
      </p>
      <p className="text-sm text-muted">
        Your roster on{" "}
        <Link href="/characters" className="text-text underline underline-offset-4 hover:text-text-strong">
          Characters
        </Link>{" "}
        works without signing in.
      </p>
    </StatusPanel>
  );
}
