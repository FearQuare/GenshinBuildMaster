// The roster as a JSON file, for guests to save and load their data (and for anyone to
// back it up). Pure functions: no browser or database access, so they're unit-tested.

export type OwnedEntry = { id: string; addedAt: string };

export type RosterFile = {
  app: "genshin-build-master";
  version: 1;
  exportedAt: string;
  ownedCharacters: OwnedEntry[];
};

export function toRosterFile(entries: OwnedEntry[], now = new Date()): RosterFile {
  return {
    app: "genshin-build-master",
    version: 1,
    exportedAt: now.toISOString(),
    ownedCharacters: entries.map(({ id, addedAt }) => ({ id, addedAt })),
  };
}

export function rosterFileName(now = new Date()): string {
  return `genshin-build-master-roster-${now.toISOString().slice(0, 10)}.json`;
}

export class RosterFileError extends Error {}

// Reads an exported file. Characters this app doesn't know (typos, newer data) are
// skipped and counted; duplicates keep their first entry.
export function parseRosterFile(
  text: string,
  knownIds: ReadonlySet<string>,
): { entries: OwnedEntry[]; skipped: number } {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new RosterFileError("That file isn't valid JSON.");
  }
  const file = data as Partial<RosterFile> | null;
  if (file?.app !== "genshin-build-master" || !Array.isArray(file.ownedCharacters)) {
    throw new RosterFileError("That isn't a Genshin Build Master roster file.");
  }
  if (file.version !== 1) {
    throw new RosterFileError("This roster file is from a newer version of the app.");
  }

  const entries: OwnedEntry[] = [];
  const seen = new Set<string>();
  let skipped = 0;
  for (const item of file.ownedCharacters as unknown[]) {
    const { id, addedAt } = (item ?? {}) as Partial<OwnedEntry>;
    if (typeof id !== "string" || !knownIds.has(id)) {
      skipped++;
      continue;
    }
    if (seen.has(id)) continue;
    seen.add(id);
    const date = typeof addedAt === "string" ? new Date(addedAt) : null;
    entries.push({
      id,
      addedAt: date && !Number.isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString(),
    });
  }
  return { entries, skipped };
}

// Adds `incoming` to `current`, keeping existing entries (and their dates) as they are.
export function mergeEntries(current: OwnedEntry[], incoming: OwnedEntry[]): OwnedEntry[] {
  const have = new Set(current.map((e) => e.id));
  return [...current, ...incoming.filter((e) => !have.has(e.id))];
}
