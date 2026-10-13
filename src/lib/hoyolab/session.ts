import { createCipheriv, createDecipheriv, createHash, randomBytes, randomUUID } from "node:crypto";
import { cookies } from "next/headers";
import { db } from "@/lib/db";
import { AppError } from "./errors";
import type { Credentials, GenshinAccount, Server } from "./types";

// Sign-in sessions. Signing in = connecting a HoYoLAB account through Data Sync. The
// browser only holds an opaque, httpOnly session id; the credentials stay on the server.
//
// - Default: in server memory, gone when the browser session ends (session cookie,
//   MEMORY_TTL_MS at most) or the server restarts.
// - "Remember me": also stored in Postgres (HoyolabSession) for REMEMBER_DAYS, with the
//   ltoken AES-256-GCM encrypted under HOYOLAB_SESSION_KEY.
//
// The database stores only a SHA-256 of the session id, so a leaked row can't be
// replayed as a cookie.

const COOKIE_NAME = "hoyolab_session";
const MEMORY_TTL_MS = 24 * 60 * 60 * 1000;
const REMEMBER_DAYS = 30;
const DEVICE_ID_KEY = "hoyolab_device_id";

export type Connection = {
  userId: string;
  credentials: Credentials;
  account: GenshinAccount;
  deviceId: string;
  expiresAt: number;
};

const store = globalThis as unknown as { hoyolabSessions?: Map<string, Connection> };
const sessions = (store.hoyolabSessions ??= new Map());

function hashSessionId(sessionId: string): string {
  return createHash("sha256").update(sessionId).digest("hex");
}

// ---------------------------------------------------------------- encryption

function encryptionKey(): Buffer {
  const raw = process.env.HOYOLAB_SESSION_KEY;
  const key = raw ? Buffer.from(raw, "base64") : null;
  if (!key || key.length !== 32) {
    throw new AppError(
      "REMEMBER_UNAVAILABLE",
      "“Remember me” isn't set up on this server. Sign in without it, or set HOYOLAB_SESSION_KEY.",
    );
  }
  return key;
}

function encrypt(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const data = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString("base64");
}

function decrypt(encoded: string): string {
  const raw = Buffer.from(encoded, "base64");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), raw.subarray(0, 12));
  decipher.setAuthTag(raw.subarray(12, 28));
  return Buffer.concat([decipher.update(raw.subarray(28)), decipher.final()]).toString("utf8");
}

// ---------------------------------------------------------------- device id

// x-rpc-device_id: generated once per install, then reused for every request.
export async function getDeviceId(): Promise<string> {
  // createMany + skipDuplicates keeps the first id if two requests race here.
  await db.appSetting.createMany({
    data: [{ key: DEVICE_ID_KEY, value: randomUUID() }],
    skipDuplicates: true,
  });
  const setting = await db.appSetting.findUniqueOrThrow({ where: { key: DEVICE_ID_KEY } });
  return setting.value;
}

// ---------------------------------------------------------------- sessions

// Signs this browser in as `connection.userId`, replacing whatever session it had.
export async function createConnection(
  connection: Omit<Connection, "expiresAt">,
  remember: boolean,
): Promise<void> {
  // Check the key before touching anything, so a misconfigured "Remember me" fails cleanly.
  const ltokenEncrypted = remember ? encrypt(connection.credentials.ltoken) : null;
  await deleteCurrentSession();

  const sessionId = randomBytes(32).toString("base64url");
  const id = hashSessionId(sessionId);
  const expiresAt = remember
    ? Date.now() + REMEMBER_DAYS * 24 * 60 * 60 * 1000
    : Date.now() + MEMORY_TTL_MS;

  if (ltokenEncrypted) {
    const { userId, credentials, account } = connection;
    await db.hoyolabSession.create({
      data: {
        id,
        userId,
        ltuid: credentials.ltuid,
        ltokenEncrypted,
        hoyolabUid: account.hoyolabUid,
        roleId: account.roleId,
        server: account.server,
        nickname: account.nickname,
        level: account.level,
        avatarUrl: account.avatarUrl,
        expiresAt: new Date(expiresAt),
      },
    });
  }
  sessions.set(id, { ...connection, expiresAt });

  (await cookies()).set(COOKIE_NAME, sessionId, {
    httpOnly: true,
    sameSite: "strict",
    // Plain http in dev (including phones on the LAN), https in production.
    secure: process.env.NODE_ENV === "production",
    path: "/",
    // No maxAge for session-only connections: the browser drops the cookie on close.
    ...(remember ? { maxAge: REMEMBER_DAYS * 24 * 60 * 60 } : {}),
  });
}

async function sessionIdFromCookie(): Promise<string | null> {
  const sessionId = (await cookies()).get(COOKIE_NAME)?.value;
  return sessionId ? hashSessionId(sessionId) : null;
}

// The current request's connection, or null when signed out.
export async function getConnection(): Promise<Connection | null> {
  const id = await sessionIdFromCookie();
  if (!id) return null;

  const inMemory = sessions.get(id);
  if (inMemory) {
    if (inMemory.expiresAt > Date.now()) return inMemory;
    sessions.delete(id);
    return null;
  }

  const row = await db.hoyolabSession.findUnique({ where: { id } });
  if (!row) return null;
  if (row.expiresAt.getTime() <= Date.now()) {
    await db.hoyolabSession.deleteMany({ where: { id } });
    return null;
  }

  let ltoken: string;
  try {
    ltoken = decrypt(row.ltokenEncrypted);
  } catch {
    // Key changed or missing: the stored login is unusable, so forget it.
    await db.hoyolabSession.deleteMany({ where: { id } });
    return null;
  }
  const connection: Connection = {
    userId: row.userId,
    credentials: { ltuid: row.ltuid, ltoken },
    account: {
      hoyolabUid: row.hoyolabUid,
      roleId: row.roleId,
      server: row.server as Server,
      nickname: row.nickname,
      level: row.level,
      avatarUrl: row.avatarUrl,
    },
    deviceId: await getDeviceId(),
    expiresAt: row.expiresAt.getTime(),
  };
  sessions.set(id, connection);
  return connection;
}

export async function clearSessionCookie(): Promise<void> {
  try {
    (await cookies()).delete(COOKIE_NAME);
  } catch {
    // Pages (Server Components) can't change cookies. The session itself is already
    // deleted, so the leftover cookie points at nothing and reads as signed out.
  }
}

async function deleteCurrentSession(): Promise<void> {
  const id = await sessionIdFromCookie();
  if (!id) return;
  sessions.delete(id);
  await db.hoyolabSession.deleteMany({ where: { id } });
}

// Signs `userId` out everywhere: forgets every stored login for them (memory, database)
// and clears this browser's cookie. Returns the accounts that were connected, so the
// caller can clear their cache.
export async function deleteConnections(
  userId: string,
): Promise<{ ltuid: string; roleId: string }[]> {
  const removed: { ltuid: string; roleId: string }[] = [];
  for (const [id, connection] of sessions) {
    if (connection.userId !== userId) continue;
    removed.push({ ltuid: connection.credentials.ltuid, roleId: connection.account.roleId });
    sessions.delete(id);
  }
  const rows = await db.hoyolabSession.findMany({
    where: { userId },
    select: { ltuid: true, roleId: true },
  });
  removed.push(...rows);
  await db.hoyolabSession.deleteMany({ where: { userId } });
  await clearSessionCookie();
  return removed;
}
