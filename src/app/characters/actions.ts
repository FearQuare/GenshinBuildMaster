"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/current-user";

export async function setOwned(characterId: string, owned: boolean) {
  if (typeof characterId !== "string" || typeof owned !== "boolean") {
    throw new Error("Invalid input");
  }
  const userId = await getCurrentUserId();

  if (owned) {
    await db.userCharacter.upsert({
      where: { userId_characterId: { userId, characterId } },
      create: { userId, characterId },
      update: {},
    });
  } else {
    await db.userCharacter.deleteMany({ where: { userId, characterId } });
  }

  revalidatePath("/characters");
}
