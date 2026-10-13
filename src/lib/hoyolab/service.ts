import { db } from "@/lib/db";
import {
  accountKey,
  cached,
  clearAccountCache,
  DETAIL_TTL_MS,
  PROFILE_TTL_MS,
  ROSTER_TTL_MS,
  throttle,
} from "./cache";
import {
  getCharacterDetail,
  getCharacterList,
  getGameRecordCard,
  getIndex,
  getUserFullInfo,
  type RequestContext,
} from "./client";
import { AppError, toAppError } from "./errors";
import { isServer, type ConnectInput } from "./input";
import { matchCharacters } from "./match";
import { mapAvatarUrl, mapCharacterDetail, mapCharacterList, mapProfileStats } from "./mappers";
import {
  clearSessionCookie,
  createConnection,
  deleteConnections,
  getConnection,
  getDeviceId,
  type Connection,
} from "./session";
import type { GenshinAccount, Profile, Server, SyncResult } from "./types";

// What the HoYoLAB route handlers call. Routes stay thin: parse the request, call one
// of these, and turn errors into responses with errorResponse().

const GENSHIN_GAME_ID = 2;

// Finds the Genshin account behind these credentials (endpoints 1 and 2), matching
// role_id and server when they're given. Doubles as the credentials check.
async function discoverAccount(
  ctx: RequestContext,
  wanted: { roleId?: string; server?: Server },
): Promise<GenshinAccount> {
  await throttle(ctx.credentials.ltuid);
  const info = await getUserFullInfo(ctx);
  const hoyolabUid = String(info.user_info?.uid ?? "");
  if (!hoyolabUid) throw new AppError("HOYOLAB_ERROR", "HoYoLAB didn't return your account id.");

  await throttle(ctx.credentials.ltuid);
  const card = await getGameRecordCard(ctx, hoyolabUid);
  const genshin = (card.list ?? []).filter(
    (entry) => entry.game_id === GENSHIN_GAME_ID && entry.game_role_id && isServer(entry.region),
  );
  if (genshin.length === 0) {
    throw new AppError(
      "NO_GENSHIN_ACCOUNT",
      "This HoYoLAB account has no Genshin Impact account linked. Link it in HoYoLAB's Battle Chronicle, then try again.",
    );
  }

  const match = genshin.find(
    (entry) =>
      (!wanted.roleId || entry.game_role_id === wanted.roleId) &&
      (!wanted.server || entry.region === wanted.server),
  );
  if (!match) {
    const where = [wanted.roleId && `UID ${wanted.roleId}`, wanted.server && `on ${wanted.server}`]
      .filter(Boolean)
      .join(" ");
    throw new AppError(
      "ROLE_NOT_FOUND",
      `No Genshin account ${where} is linked to this HoYoLAB account. Leave UID and server empty to find it automatically.`,
    );
  }

  return {
    hoyolabUid,
    roleId: match.game_role_id!,
    server: match.region as Server,
    nickname: match.nickname ?? "",
    level: match.level ?? 0,
    avatarUrl: info.user_info?.avatar_url ?? "",
  };
}

// Discovers the account, then adds the profile card numbers (genshin/api/index).
// The index part is cached, so confirming right after a test doesn't refetch it.
async function loadProfile(input: ConnectInput): Promise<Profile & { deviceId: string }> {
  const deviceId = await getDeviceId();
  const ctx = { credentials: input.credentials, deviceId };
  try {
    const found = await discoverAccount(ctx, input);
    const key = `${accountKey(input.credentials.ltuid, found.roleId)}:profile`;
    const { value: index } = await cached(key, PROFILE_TTL_MS, async () => {
      await throttle(input.credentials.ltuid);
      return getIndex(ctx, found.roleId, found.server);
    });
    return {
      account: { ...found, avatarUrl: mapAvatarUrl(index, found.avatarUrl) },
      stats: mapProfileStats(index),
      deviceId,
    };
  } catch (error) {
    throw toAppError(error);
  }
}

// Data Sync step 1: checks the credentials and returns the profile card, storing nothing.
export async function testConnection(input: ConnectInput): Promise<Profile> {
  const { account, stats } = await loadProfile(input);
  return { account, stats };
}

// Data Sync step 2 ("Yes, that's me"): verifies again, finds or creates the user for this
// HoYoLAB account, signs this browser in as them and ticks the characters they own.
// A failed character sync doesn't undo the sign-in: `sync` is null and the user can retry
// from the account menu.
export async function connect(
  input: ConnectInput,
): Promise<{ account: GenshinAccount; sync: SyncResult | null }> {
  const { account, deviceId } = await loadProfile(input);
  const user = await db.user.upsert({
    where: { hoyolabUid: account.hoyolabUid },
    create: { hoyolabUid: account.hoyolabUid, name: account.nickname, avatarUrl: account.avatarUrl },
    update: { name: account.nickname, avatarUrl: account.avatarUrl },
  });
  const connection = { userId: user.id, credentials: input.credentials, account, deviceId };
  await createConnection(connection, input.remember);

  let sync: SyncResult | null = null;
  try {
    sync = await syncOwned({ ...connection, expiresAt: 0 }, false);
  } catch (error) {
    console.error("Character sync after sign-in failed:", toAppError(error).code);
  }
  return { account, sync };
}

// Sign out: deletes every stored login for this user and their cached HoYoLAB data.
export async function disconnect(): Promise<void> {
  const connection = await getConnection();
  if (!connection) {
    await clearSessionCookie();
    return;
  }
  for (const { ltuid, roleId } of await deleteConnections(connection.userId)) {
    clearAccountCache(accountKey(ltuid, roleId));
  }
}

export async function getAccount(): Promise<GenshinAccount | null> {
  const connection = await getConnection();
  return connection?.account ?? null;
}

async function requireConnection(): Promise<Connection> {
  const connection = await getConnection();
  if (!connection) {
    throw new AppError("NOT_CONNECTED", "Sign in with Data Sync first.");
  }
  return connection;
}

// Runs a HoYoLAB call for the current connection. An expired login signs the user out,
// so the UI's next status check shows Data Sync again.
async function withConnection<T>(run: (connection: Connection) => Promise<T>): Promise<T> {
  const connection = await requireConnection();
  try {
    return await run(connection);
  } catch (error) {
    const appError = toAppError(error);
    if (appError.code === "LOGIN_EXPIRED") await disconnect();
    throw appError;
  }
}

// The account's HoYoLAB roster, cached for an hour unless `fresh`.
async function loadRoster({ credentials, deviceId, account }: Connection, fresh = false) {
  const key = `${accountKey(credentials.ltuid, account.roleId)}:roster`;
  if (fresh) clearAccountCache(key);
  const { value, cachedAt } = await cached(key, ROSTER_TTL_MS, async () => {
    await throttle(credentials.ltuid);
    const raw = await getCharacterList({ credentials, deviceId }, account.roleId, account.server);
    return mapCharacterList(raw);
  });
  return { characters: value, fetchedAt: new Date(cachedAt).toISOString() };
}

export function getRoster() {
  return withConnection((connection) => loadRoster(connection));
}

// Ticks every character the HoYoLAB account owns in the user's roster. Only adds:
// characters ticked by hand stay ticked. `unmatched` lists HoYoLAB names we don't know
// (usually a release newer than data/characters.json).
async function syncOwned(connection: Connection, fresh: boolean): Promise<SyncResult> {
  const [{ characters }, ours] = await Promise.all([
    loadRoster(connection, fresh),
    db.character.findMany({ select: { id: true, name: true } }),
  ]);
  const { ids, unmatched } = matchCharacters(characters, ours);
  const { count } = await db.userCharacter.createMany({
    data: ids.map((characterId) => ({ userId: connection.userId, characterId })),
    skipDuplicates: true,
  });
  return { added: count, matched: ids.length, unmatched };
}

// "Sync characters" in the account menu: refetches the roster from HoYoLAB.
export function syncCharacters(): Promise<SyncResult> {
  return withConnection((connection) => syncOwned(connection, true));
}

export function getCharacter(characterId: number) {
  return withConnection(async ({ credentials, deviceId, account }) => {
    const key = `${accountKey(credentials.ltuid, account.roleId)}:detail:${characterId}`;
    const { value, cachedAt } = await cached(key, DETAIL_TTL_MS, async () => {
      await throttle(credentials.ltuid);
      const raw = await getCharacterDetail(
        { credentials, deviceId },
        account.roleId,
        account.server,
        characterId,
      );
      const detail = mapCharacterDetail(raw);
      if (!detail) {
        throw new AppError("CHARACTER_NOT_FOUND", "That character isn't on this account.");
      }
      return detail;
    });
    return { ...value, fetchedAt: new Date(cachedAt).toISOString() };
  });
}

