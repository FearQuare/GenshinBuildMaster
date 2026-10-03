// Placeholder until accounts exist: every request acts as this single seeded user.
// Replace getCurrentUserId with a real session lookup when auth is added.
export const LOCAL_USER_ID = "local-user";

export async function getCurrentUserId(): Promise<string> {
  return LOCAL_USER_ID;
}
