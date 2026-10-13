"use client";

import { useMemo, useOptimistic, useState, useSyncExternalStore, useTransition } from "react";
import { addOwned, setOwned as setOwnedAction } from "@/app/characters/actions";
import { addGuestEntries, getGuestRoster, setGuestOwned, useGuestRoster } from "./guest-roster";
import type { OwnedEntry } from "./roster-file";

const EMPTY: OwnedEntry[] = [];
const noopSubscribe = () => () => {};

// One roster API for both kinds of visitor. Pages pass `serverOwned` from the database
// when someone is signed in, or null for a guest, whose roster is in local storage.
export function useRoster(serverOwned: OwnedEntry[] | null) {
  const signedIn = serverOwned !== null;
  const guest = useGuestRoster();
  // False during SSR and hydration: a guest's roster isn't known until local storage is read.
  const hydrated = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const [optimistic, applyOptimistic] = useOptimistic(
    serverOwned ?? EMPTY,
    (current, { id, value }: { id: string; value: boolean }) =>
      value
        ? [...current.filter((e) => e.id !== id), { id, addedAt: new Date().toISOString() }]
        : current.filter((e) => e.id !== id),
  );

  const entries = signedIn ? optimistic : guest;
  const owned = useMemo(() => new Set(entries.map((e) => e.id)), [entries]);

  function setOwned(id: string, value: boolean, name = "that character") {
    setError(null);
    if (!signedIn) {
      setGuestOwned(id, value);
      return;
    }
    startTransition(async () => {
      applyOptimistic({ id, value });
      try {
        await setOwnedAction(id, value);
      } catch {
        setError(`Couldn't update ${name}. Check your connection and try again.`);
      }
    });
  }

  // Adds characters (from an imported file). Returns how many weren't owned yet.
  async function importEntries(incoming: OwnedEntry[]): Promise<number> {
    if (!signedIn) {
      const before = getGuestRoster().length;
      addGuestEntries(incoming);
      return getGuestRoster().length - before;
    }
    const { added } = await addOwned(incoming.map((e) => e.id));
    return added;
  }

  return { signedIn, ready: signedIn || hydrated, entries, owned, setOwned, importEntries, error };
}
