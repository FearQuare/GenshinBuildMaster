import { getConnection } from "@/lib/hoyolab/session";

// Users are HoYoLAB accounts: signing in means connecting one through Data Sync.
// Returns null for guests, whose roster lives in the browser's local storage
// (src/lib/guest-roster.ts). Pages and server actions get the user only from here.
export async function getCurrentUserId(): Promise<string | null> {
  const connection = await getConnection();
  return connection?.userId ?? null;
}
