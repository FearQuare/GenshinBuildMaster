"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/current-user";

// Roster mutations for signed-in users. Guests never call these: their roster lives in
// local storage (src/lib/guest-roster.ts).

async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Sign in with Data Sync to save your roster to your account.");
  return userId;
}

export async function setOwned(characterId: string, owned: boolean) {
  if (typeof characterId !== "string" || typeof owned !== "boolean") {
    throw new Error("Invalid input");
  }
  const userId = await requireUserId();

  if (owned) {
    await db.userCharacter.upsert({
      where: { userId_characterId: { userId, characterId } },
      create: { userId, characterId },
      update: {},
    });
  } else {
    await db.userCharacter.deleteMany({ where: { userId, characterId } });
  }

  revalidatePath("/", "layout");
}

// Adds characters to the signed-in user's roster: a guest's local roster when they sign
// in, or an imported JSON file. Unknown ids are skipped. Returns how many were new.
export async function addOwned(characterIds: string[]): Promise<{ added: number }> {
  if (!Array.isArray(characterIds) || characterIds.some((id) => typeof id !== "string")) {
    throw new Error("Invalid input");
  }
  const userId = await requireUserId();

  const known = await db.character.findMany({
    where: { id: { in: characterIds } },
    select: { id: true },
  });
  const { count } = await db.userCharacter.createMany({
    data: known.map(({ id }) => ({ userId, characterId: id })),
    skipDuplicates: true,
  });

  revalidatePath("/", "layout");
  return { added: count };
}
