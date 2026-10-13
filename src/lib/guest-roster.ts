"use client";

import { useSyncExternalStore } from "react";
import { mergeEntries, type OwnedEntry } from "./roster-file";

// A guest's roster (someone who hasn't signed in with Data Sync), kept in this browser's
// local storage. Holds only character ids and dates, never credentials. Tabs stay in
// sync through the storage event.

const STORAGE_KEY = "gbm:roster:v1";
const EMPTY: OwnedEntry[] = [];

const listeners = new Set<() => void>();
let snapshot: OwnedEntry[] | null = null;

function read(): OwnedEntry[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(
      (e): e is OwnedEntry => typeof e?.id === "string" && typeof e?.addedAt === "string",
    );
  } catch {
    // Storage blocked (private mode, disabled) or corrupted: behave as empty.
    return EMPTY;
  }
}

function write(entries: OwnedEntry[]) {
  snapshot = entries;
  try {
    if (entries.length) localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Storage blocked: keep the in-memory snapshot so the page still works this visit.
  }
  listeners.forEach((notify) => notify());
}

function subscribe(notify: () => void) {
  listeners.add(notify);
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY && event.key !== null) return;
    snapshot = null;
    notify();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(notify);
    window.removeEventListener("storage", onStorage);
  };
}

export function getGuestRoster(): OwnedEntry[] {
  return (snapshot ??= read());
}

export function useGuestRoster(): OwnedEntry[] {
  // The server has no local storage, so guests render empty first, then hydrate.
  return useSyncExternalStore(subscribe, getGuestRoster, () => EMPTY);
}

export function setGuestOwned(id: string, owned: boolean) {
  const current = getGuestRoster();
  if (owned === current.some((e) => e.id === id)) return;
  write(
    owned
      ? [...current, { id, addedAt: new Date().toISOString() }]
      : current.filter((e) => e.id !== id),
  );
}

export function addGuestEntries(entries: OwnedEntry[]) {
  write(mergeEntries(getGuestRoster(), entries));
}

export function clearGuestRoster() {
  write(EMPTY);
}
