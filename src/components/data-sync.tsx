"use client";

import { useRouter } from "next/navigation";
import { useEffect, useId, useRef, useState, type FormEvent, type ReactNode } from "react";
import { addOwned } from "@/app/characters/actions";
import { clearGuestRoster, getGuestRoster } from "@/lib/guest-roster";
import type { GenshinAccount, Profile, Server, SyncResult } from "@/lib/hoyolab/types";

// Sign-in for the navbar. Signed out: a "Data Sync" button that opens the HoYoLAB
// credentials panel → profile card → "Yes, that's me". Signed in: the profile picture,
// which opens a menu with "Sign Out". Talks to /api/hoyolab/connection.

const SERVER_LABELS: Record<Server, string> = {
  os_euro: "Europe",
  os_usa: "America",
  os_asia: "Asia",
  os_cht: "TW / HK / MO",
};

const FOCUS_RING =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-focus";

type Values = { ltuid: string; ltoken: string; roleId: string; server: Server | ""; remember: boolean };
type FieldErrors = Partial<Record<"ltuid" | "ltoken" | "roleId", string>>;
type Step = "form" | "scanning" | "profile" | "linking";
type ApiFailure = { code: string; message: string };

class ApiError extends Error {
  constructor(readonly failure: ApiFailure) {
    super(failure.message);
  }
}

async function callApi<T>(path: string, init: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    throw new ApiError({ code: "NETWORK", message: "Couldn't reach the server. Check your connection." });
  }
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    throw new ApiError(
      body?.error ?? { code: "UNKNOWN", message: "Something went wrong. Try again." },
    );
  }
  return body as T;
}

function credentialsBody(values: Values, extra: Record<string, unknown> = {}) {
  return JSON.stringify({
    ltuid_v2: values.ltuid.trim(),
    ltoken_v2: values.ltoken.trim(),
    role_id: values.roleId.trim() || undefined,
    server: values.server || undefined,
    ...extra,
  });
}

function validate(values: Values): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.ltuid.trim()) errors.ltuid = "Paste your ltuid_v2.";
  else if (!/^\d+$/.test(values.ltuid.trim())) errors.ltuid = "ltuid_v2 is a number.";
  if (!values.ltoken.trim()) errors.ltoken = "Paste your ltoken_v2.";
  if (values.roleId.trim() && !/^\d{9,10}$/.test(values.roleId.trim())) {
    errors.roleId = "UID is 9 or 10 digits.";
  }
  return errors;
}

// Closes a popover on Escape or a click outside `ref`.
function useDismiss(ref: React.RefObject<HTMLElement | null>, open: boolean, close: () => void) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && close();
    const onPointer = (e: PointerEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) close();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [ref, open, close]);
}

export function DataSync({ account }: { account: GenshinAccount | null }) {
  return account ? <ProfileMenu account={account} /> : <SyncButton />;
}

// ---------------------------------------------------------------- signed out

const EMPTY_VALUES: Values = { ltuid: "", ltoken: "", roleId: "", server: "", remember: false };

function SyncButton() {
  const router = useRouter();
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [step, setStep] = useState<Step>("form");
  const [values, setValues] = useState<Values>(EMPTY_VALUES);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<ApiFailure | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);

  // Requests in flight finish, but a closed panel ignores their results.
  const busy = step === "scanning" || step === "linking";

  function close() {
    if (busy) return;
    setOpen(false);
    buttonRef.current?.focus();
  }
  useDismiss(rootRef, open, close);

  async function scan(event: FormEvent) {
    event.preventDefault();
    const errors = validate(values);
    setFieldErrors(errors);
    setFailure(null);
    if (Object.keys(errors).length) return;

    setStep("scanning");
    try {
      const found = await callApi<Profile>("/api/hoyolab/connection/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: credentialsBody(values),
      });
      setProfile(found);
      setStep("profile");
    } catch (error) {
      setFailure(error instanceof ApiError ? error.failure : null);
      setStep("form");
    }
  }

  async function confirm() {
    if (!profile) return;
    setStep("linking");
    setFailure(null);
    try {
      // Pin the account the user just confirmed, so sign-in can't land on a different one.
      await callApi("/api/hoyolab/connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: credentialsBody(
          { ...values, roleId: profile.account.roleId, server: profile.account.server },
          { remember: values.remember },
        ),
      });
      // Bring the guest roster along: merge it into the account, then clear local storage.
      const local = getGuestRoster();
      if (local.length) {
        await addOwned(local.map((e) => e.id));
        clearGuestRoster();
      }
      setValues(EMPTY_VALUES);
      setOpen(false);
      router.refresh();
    } catch (error) {
      setFailure(
        error instanceof ApiError
          ? error.failure
          : { code: "UNKNOWN", message: "Signed in, but your guest roster couldn't be copied over. It's still in this browser." },
      );
      setStep("profile");
      router.refresh();
    }
  }

  function backToForm() {
    setProfile(null);
    setFailure(null);
    setStep("form");
  }

  return (
    <div ref={rootRef} className="ml-auto">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => (open ? close() : setOpen(true))}
        className={`group relative inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-card border-[1.5px] px-2.5 font-mono text-xs font-semibold tracking-normal uppercase min-[360px]:px-3 min-[360px]:tracking-wider transition-colors duration-(--dur-micro) active:translate-y-px ${FOCUS_RING} ${
          open
            ? "border-accent bg-accent text-accent-ink"
            : "border-accent text-text-strong hover:bg-deep"
        }`}
      >
        <SyncIcon className="hidden size-3.5 min-[360px]:block" />
        Data Sync
      </button>

      {open && (
        <div
          id={panelId}
          role="dialog"
          aria-label="Data Sync"
          className="boot-in absolute inset-x-0 top-full max-h-[calc(100dvh-4rem-env(safe-area-inset-top))] overflow-y-auto border-b border-accent bg-bg sm:inset-x-auto sm:right-6 sm:mt-2 sm:w-[27rem] sm:rounded-card sm:border"
        >
          <PanelHeader onClose={close} closeDisabled={busy} />
          <div className="p-4 sm:p-5">
            {step === "form" && (
              <CredentialsForm
                values={values}
                onChange={setValues}
                fieldErrors={fieldErrors}
                failure={failure}
                onSubmit={scan}
              />
            )}
            {step === "scanning" && <ScanningCard />}
            {(step === "profile" || step === "linking") && profile && (
              <ProfileCard
                profile={profile}
                linking={step === "linking"}
                failure={failure}
                onConfirm={confirm}
                onReject={backToForm}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function PanelHeader({ onClose, closeDisabled }: { onClose: () => void; closeDisabled: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-line bg-panel px-4 py-2.5 sm:px-5">
      <p className="font-mono text-xs tracking-wider text-muted uppercase">
        <span className="text-accent">&gt;</span> data_sync <span className="text-line-strong">{"//"}</span>{" "}
        <span className="text-cyan">hoyolab</span>
      </p>
      <button
        type="button"
        onClick={onClose}
        disabled={closeDisabled}
        aria-label="Close Data Sync"
        className={`grid size-8 place-items-center rounded-card text-muted transition-colors duration-(--dur-micro) hover:text-text-strong disabled:opacity-40 ${FOCUS_RING}`}
      >
        <svg aria-hidden viewBox="0 0 16 16" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3.5 3.5l9 9m0-9l-9 9" strokeLinecap="square" />
        </svg>
      </button>
    </div>
  );
}

function CredentialsForm({
  values,
  onChange,
  fieldErrors,
  failure,
  onSubmit,
}: {
  values: Values;
  onChange: (values: Values) => void;
  fieldErrors: FieldErrors;
  failure: ApiFailure | null;
  onSubmit: (event: FormEvent) => void;
}) {
  const [showToken, setShowToken] = useState(false);
  const set = <K extends keyof Values>(key: K, value: Values[K]) => onChange({ ...values, [key]: value });

  return (
    <form noValidate onSubmit={onSubmit} className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <h2 className="text-xl text-text-strong">Sign in with HoYoLAB</h2>
        <p className="text-sm leading-relaxed text-muted">
          Open <span className="text-text">hoyolab.com</span> while logged in → DevTools →
          Application → Cookies → <span className="text-text">.hoyolab.com</span> → copy{" "}
          <code className="font-mono text-xs text-text-strong">ltuid_v2</code> and{" "}
          <code className="font-mono text-xs text-text-strong">ltoken_v2</code>.
        </p>
      </div>

      {failure && <FailureNotice failure={failure} />}

      <Field id="ds-ltuid" label="ltuid_v2" error={fieldErrors.ltuid}>
        <input
          id="ds-ltuid"
          autoFocus
          inputMode="numeric"
          autoComplete="off"
          spellCheck={false}
          value={values.ltuid}
          onChange={(e) => set("ltuid", e.target.value)}
          aria-invalid={!!fieldErrors.ltuid}
          aria-describedby={fieldErrors.ltuid ? "ds-ltuid-error" : undefined}
          className={inputClass(!!fieldErrors.ltuid)}
          placeholder="123456789"
        />
      </Field>

      <Field id="ds-ltoken" label="ltoken_v2" error={fieldErrors.ltoken}>
        <div className="relative">
          <input
            id="ds-ltoken"
            type={showToken ? "text" : "password"}
            autoComplete="off"
            spellCheck={false}
            value={values.ltoken}
            onChange={(e) => set("ltoken", e.target.value)}
            aria-invalid={!!fieldErrors.ltoken}
            aria-describedby={fieldErrors.ltoken ? "ds-ltoken-error" : undefined}
            className={`${inputClass(!!fieldErrors.ltoken)} pr-16`}
            placeholder="v2_…"
          />
          <button
            type="button"
            onClick={() => setShowToken(!showToken)}
            aria-pressed={showToken}
            className={`absolute inset-y-1 right-1 rounded-[6px] px-2 font-mono text-[11px] tracking-wider text-muted uppercase hover:text-text-strong ${FOCUS_RING}`}
          >
            {showToken ? "Hide" : "Show"}
          </button>
        </div>
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field id="ds-uid" label="UID" hint="optional" error={fieldErrors.roleId}>
          <input
            id="ds-uid"
            inputMode="numeric"
            autoComplete="off"
            value={values.roleId}
            onChange={(e) => set("roleId", e.target.value)}
            aria-invalid={!!fieldErrors.roleId}
            aria-describedby={fieldErrors.roleId ? "ds-uid-error" : undefined}
            className={inputClass(!!fieldErrors.roleId)}
            placeholder="Auto"
          />
        </Field>
        <Field id="ds-server" label="Server" hint="optional">
          <select
            id="ds-server"
            value={values.server}
            onChange={(e) => set("server", e.target.value as Server | "")}
            className={inputClass(false)}
          >
            <option value="">Auto</option>
            {(Object.keys(SERVER_LABELS) as Server[]).map((server) => (
              <option key={server} value={server}>
                {SERVER_LABELS[server]}
              </option>
            ))}
          </select>
        </Field>
      </div>

      <label className="flex cursor-pointer items-start gap-3 text-sm text-text">
        <input
          type="checkbox"
          checked={values.remember}
          onChange={(e) => set("remember", e.target.checked)}
          className="mt-0.5 size-4 shrink-0 accent-accent"
        />
        <span>
          Remember me
          <span className="block text-xs text-muted">
            Stay signed in on this device for 30 days. Otherwise you&rsquo;re signed out when the
            browser closes.
          </span>
        </span>
      </label>

      <button
        type="submit"
        className={`inline-flex h-12 items-center justify-center gap-2 rounded-card bg-accent px-5 text-lg text-accent-ink transition-transform duration-(--dur-micro) hover:-translate-y-px active:translate-y-px ${FOCUS_RING}`}
      >
        Scan account
      </button>

      <p className="font-mono text-[11px] leading-relaxed text-muted">
        Your token goes to this app&rsquo;s server only, is used to read your Battle Chronicle,
        and is never shown again.
      </p>
    </form>
  );
}

function Field({
  id,
  label,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-1.5">
      <label htmlFor={id} className="flex items-baseline gap-2 font-mono text-xs text-text-strong">
        {label}
        {hint && <span className="text-muted">{hint}</span>}
      </label>
      {children}
      {error && (
        <p id={`${id}-error`} className="font-mono text-xs text-text">
          {error}
        </p>
      )}
    </div>
  );
}

function inputClass(invalid: boolean) {
  return `h-11 w-full min-w-0 rounded-card border bg-panel px-3 font-mono text-sm text-text-strong placeholder:text-muted hover:bg-panel-2 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-focus ${
    invalid ? "border-accent" : "border-line"
  }`;
}

const FAILURE_TITLES: Record<string, string> = {
  LOGIN_EXPIRED: "Login expired",
  VERIFICATION_REQUIRED: "Verification needed",
  CHRONICLE_PRIVATE: "Battle Chronicle is private",
  NO_GENSHIN_ACCOUNT: "No Genshin account",
  ROLE_NOT_FOUND: "UID not found",
  REMEMBER_UNAVAILABLE: "Remember me unavailable",
};

function FailureNotice({ failure }: { failure: ApiFailure }) {
  return (
    <div role="alert" className="flex flex-col gap-1 border-l-2 border-accent bg-deep px-3 py-2.5">
      <p className="font-mono text-xs tracking-wider text-text-strong uppercase">
        <span className="text-accent">! </span>
        {FAILURE_TITLES[failure.code] ?? "Sync failed"}
      </p>
      <p className="text-sm text-text">{failure.message}</p>
    </div>
  );
}

function ScanningCard() {
  return (
    <div role="status" aria-live="polite" className="flex flex-col gap-5">
      <p className="font-mono text-xs tracking-wider text-text-strong uppercase">
        Scanning HoYoLAB<span aria-hidden className="caret text-accent">▮</span>
      </p>
      <div className="flex items-center gap-4">
        <div className="skeleton size-20 shrink-0 rounded-full" />
        <div className="flex flex-1 flex-col gap-2">
          <div className="skeleton h-6 w-2/3 rounded-sm" />
          <div className="skeleton h-4 w-full rounded-sm" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="skeleton h-20 rounded-card" />
        <div className="skeleton h-20 rounded-card" />
      </div>
      <div className="skeleton h-32 rounded-card" />
      <p className="sr-only">Looking up your account. This takes a few seconds.</p>
    </div>
  );
}

function ProfileCard({
  profile,
  linking,
  failure,
  onConfirm,
  onReject,
}: {
  profile: Profile;
  linking: boolean;
  failure: ApiFailure | null;
  onConfirm: () => void;
  onReject: () => void;
}) {
  const { account, stats } = profile;
  const endgame = [
    { label: "Spiral Abyss", value: stats.spiralAbyss, tone: "text-text-strong" },
    {
      label: "Imaginarium Theater",
      value: stats.theaterAct ? `Act ${stats.theaterAct}` : null,
      tone: "text-cyan",
    },
    {
      label: "Stygian Onslaught",
      value: stats.stygian ? stats.stygian.name || `Difficulty ${stats.stygian.difficulty}` : null,
      tone: "text-accent",
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <p className="font-mono text-xs tracking-wider text-muted uppercase">
        <span className="text-cyan">&gt;</span> Match found. Is this you?
      </p>

      <div className="flex items-center gap-4">
        <GlitchAvatar src={account.avatarUrl} name={account.nickname} size="lg" />
        <div className="flex min-w-0 flex-col gap-1">
          <p className="truncate text-2xl leading-tight text-text-strong">{account.nickname}</p>
          <p className="font-mono text-xs leading-relaxed text-muted">
            AR {account.level} · UID {account.roleId}
            <br />
            {SERVER_LABELS[account.server]}
          </p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-2">
        <BigStat label="Achievements" value={stats.achievements} />
        <BigStat label="Characters" value={stats.characters} />
      </dl>

      <dl className="flex flex-col border-y border-line">
        {endgame.map(({ label, value, tone }) => (
          <div key={label} className="flex items-baseline justify-between gap-4 border-b border-line py-2.5 last:border-b-0">
            <dt className="text-sm text-text">{label}</dt>
            <dd className={`font-mono text-sm tabular-nums ${value ? tone : "text-muted"}`}>
              {value ?? "No run yet"}
            </dd>
          </div>
        ))}
      </dl>

      {failure && <FailureNotice failure={failure} />}

      <div className="flex flex-col gap-2 sm:flex-row-reverse">
        <button
          type="button"
          onClick={onConfirm}
          disabled={linking}
          aria-busy={linking}
          className={`inline-flex h-12 items-center justify-center rounded-card bg-accent sm:flex-1 px-5 text-lg whitespace-nowrap text-accent-ink transition-transform duration-(--dur-micro) hover:-translate-y-px active:translate-y-px disabled:pointer-events-none disabled:opacity-70 ${FOCUS_RING}`}
        >
          {linking ? "Linking…" : "Yes, that’s me"}
        </button>
        <button
          type="button"
          onClick={onReject}
          disabled={linking}
          className={`inline-flex h-12 items-center justify-center rounded-card border-[1.5px] border-line-strong px-5 text-text transition-colors duration-(--dur-micro) hover:bg-panel-2 active:translate-y-px disabled:opacity-50 ${FOCUS_RING}`}
        >
          Not me
        </button>
      </div>
    </div>
  );
}

function BigStat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col gap-1 rounded-card border border-line bg-panel px-3 py-3">
      <dt className="font-mono text-[11px] tracking-wider text-muted uppercase">{label}</dt>
      <dd className="font-mono text-3xl text-text-strong tabular-nums">{value.toLocaleString("en-US")}</dd>
    </div>
  );
}

// ---------------------------------------------------------------- signed in

function ProfileMenu({ account }: { account: GenshinAccount }) {
  const router = useRouter();
  const menuId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [failed, setFailed] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [syncStatus, setSyncStatus] = useState<{ kind: "ok" | "error"; text: string } | null>(null);

  function close() {
    setOpen(false);
    buttonRef.current?.focus();
  }
  useDismiss(rootRef, open, close);

  async function syncCharacters() {
    setSyncing(true);
    setSyncStatus(null);
    try {
      const { added, matched, unmatched } = await callApi<SyncResult>("/api/hoyolab/characters/sync", {
        method: "POST",
      });
      const parts = [
        added ? `Ticked ${added} new ${added === 1 ? "character" : "characters"}.` : `All ${matched} already ticked.`,
      ];
      if (unmatched.length) parts.push(`Not in this app yet: ${unmatched.join(", ")}.`);
      setSyncStatus({ kind: "ok", text: parts.join(" ") });
      router.refresh();
    } catch (error) {
      setSyncStatus({
        kind: "error",
        text: error instanceof ApiError ? error.message : "Couldn't sync. Try again.",
      });
      // An expired login signed the user out on the server; show Data Sync again.
      if (error instanceof ApiError && error.failure.code === "LOGIN_EXPIRED") router.refresh();
    } finally {
      setSyncing(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    setFailed(false);
    try {
      await callApi("/api/hoyolab/connection", { method: "DELETE" });
      setOpen(false);
      router.refresh();
    } catch {
      setFailed(true);
    } finally {
      setSigningOut(false);
    }
  }

  return (
    <div ref={rootRef} className="relative ml-auto">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={`${account.nickname}, account menu`}
        onClick={() => (open ? close() : setOpen(true))}
        className={`group block rounded-full ${FOCUS_RING}`}
      >
        <GlitchAvatar src={account.avatarUrl} name={account.nickname} size="sm" active={open} />
      </button>

      {open && (
        <div
          id={menuId}
          className="boot-in absolute top-full right-0 mt-3 w-64 rounded-card border border-accent bg-bg"
        >
          <div className="flex flex-col gap-0.5 border-b border-line px-4 py-3">
            <p className="truncate text-lg text-text-strong">{account.nickname}</p>
            <p className="font-mono text-xs text-muted">
              AR {account.level} · UID {account.roleId}
            </p>
          </div>
          <div className="flex flex-col p-2">
            <button
              type="button"
              onClick={syncCharacters}
              disabled={syncing || signingOut}
              aria-busy={syncing}
              className={`flex h-11 w-full items-center gap-3 rounded-[6px] px-3 text-left text-text-strong transition-colors duration-(--dur-micro) hover:bg-deep disabled:opacity-60 ${FOCUS_RING}`}
            >
              <SyncIcon className="size-4 text-accent" />
              {syncing ? "Syncing…" : "Sync characters"}
            </button>
            {syncStatus && (
              <p
                role={syncStatus.kind === "error" ? "alert" : "status"}
                className={`px-3 pt-1 pb-2 font-mono text-xs leading-relaxed ${syncStatus.kind === "error" ? "text-text" : "text-muted"}`}
              >
                {syncStatus.text}
              </p>
            )}
            <button
              type="button"
              onClick={signOut}
              disabled={signingOut || syncing}
              aria-busy={signingOut}
              className={`flex h-11 w-full items-center gap-3 rounded-[6px] px-3 text-left text-text-strong transition-colors duration-(--dur-micro) hover:bg-deep disabled:opacity-60 ${FOCUS_RING}`}
            >
              <svg aria-hidden viewBox="0 0 16 16" className="size-4 text-accent" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2.5H3v11h3M10.5 5l3 3-3 3M13.5 8H6" strokeLinecap="square" />
              </svg>
              {signingOut ? "Signing out…" : "Sign Out"}
            </button>
            {failed && (
              <p role="alert" className="px-3 pt-1 pb-2 font-mono text-xs text-text">
                Couldn&rsquo;t sign out. Try again.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------- shared bits

// Round profile picture with red and cyan ghost rings that jitter on hover.
function GlitchAvatar({
  src,
  name,
  size,
  active = false,
}: {
  src: string;
  name: string;
  size: "sm" | "lg";
  active?: boolean;
}) {
  const [broken, setBroken] = useState(false);
  const box = size === "lg" ? "size-20" : "size-9";

  return (
    <span className={`group relative block shrink-0 ${box}`}>
      <span aria-hidden className="glitch-red absolute inset-0 rounded-full border-2 border-accent" />
      <span aria-hidden className="glitch-cyan absolute inset-0 rounded-full border-2 border-cyan" />
      <span
        className={`relative grid size-full place-items-center overflow-hidden rounded-full border-2 bg-panel-2 ${
          active ? "border-accent" : "border-line-strong"
        }`}
      >
        {src && !broken ? (
          // HoYoLAB CDN images; external, so a plain img rather than next/image.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={src}
            alt=""
            referrerPolicy="no-referrer"
            onError={() => setBroken(true)}
            className="size-full object-cover"
          />
        ) : (
          <span aria-hidden className={`font-mono text-text-strong ${size === "lg" ? "text-2xl" : "text-sm"}`}>
            {name.charAt(0).toUpperCase() || "?"}
          </span>
        )}
      </span>
    </span>
  );
}

function SyncIcon({ className = "size-3.5" }: { className?: string }) {
  return (
    <svg aria-hidden viewBox="0 0 16 16" className={className} fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M13 6.5A5 5 0 0 0 3.6 4.5M3 9.5a5 5 0 0 0 9.4 2" strokeLinecap="square" />
      <path d="M3.5 2v2.8h2.8M12.5 14v-2.8H9.7" strokeLinecap="square" />
    </svg>
  );
}
