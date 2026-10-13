// In-memory cache and request pacing for HoYoLAB data, kept on globalThis so they survive
// dev hot reloads (like the Prisma client in src/lib/db.ts).

type Entry = { value: unknown; expiresAt: number };

const store = globalThis as unknown as {
  hoyolabCache?: Map<string, Entry>;
  hoyolabNextSlot?: Map<string, number>;
};
const cache = (store.hoyolabCache ??= new Map());
const nextSlot = (store.hoyolabNextSlot ??= new Map());

export const ROSTER_TTL_MS = 60 * 60 * 1000;
export const DETAIL_TTL_MS = 10 * 60 * 1000;
export const PROFILE_TTL_MS = 10 * 60 * 1000;
const MIN_INTERVAL_MS = 1000;

// Cache keys start with the account key, so one account's entries can be dropped together.
export function accountKey(ltuid: string, roleId: string): string {
  return `${ltuid}:${roleId}`;
}

export async function cached<T>(
  key: string,
  ttlMs: number,
  load: () => Promise<T>,
): Promise<{ value: T; cachedAt: number }> {
  const hit = cache.get(key);
  if (hit && hit.expiresAt > Date.now()) {
    return hit.value as { value: T; cachedAt: number };
  }
  const entry = { value: await load(), cachedAt: Date.now() };
  cache.set(key, { value: entry, expiresAt: entry.cachedAt + ttlMs });
  return entry;
}

export function clearAccountCache(key: string): void {
  for (const k of cache.keys()) {
    if (k === key || k.startsWith(`${key}:`)) cache.delete(k);
  }
}

// Spaces out HoYoLAB calls for one HoYoLAB login to at most one per second.
// Each caller reserves the next free slot, then waits for it.
export async function throttle(ltuid: string): Promise<void> {
  const now = Date.now();
  const slot = Math.max(now, nextSlot.get(ltuid) ?? 0);
  nextSlot.set(ltuid, slot + MIN_INTERVAL_MS);
  if (slot > now) await new Promise((resolve) => setTimeout(resolve, slot - now));
}
