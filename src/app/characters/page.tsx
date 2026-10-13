import type { Metadata } from "next";
import { connection } from "next/server";
import { db } from "@/lib/db";
import { getCurrentUserId } from "@/lib/current-user";
import { CharacterGrid } from "./character-grid";

export const metadata: Metadata = {
  title: "Characters · Genshin Build Master",
};

export default async function CharactersPage() {
  await connection();
  const userId = await getCurrentUserId();

  const [characters, owned] = await Promise.all([
    db.character.findMany({ orderBy: { name: "asc" } }),
    // Guests (no user) keep their roster in local storage; the grid reads it there.
    userId
      ? db.userCharacter.findMany({ where: { userId }, select: { characterId: true, createdAt: true } })
      : null,
  ]);

  return (
    <main className="mx-auto w-full max-w-7xl px-4 pt-8 pb-16 sm:px-6 sm:pt-10">
      <h1 className="sr-only">Characters</h1>
      <CharacterGrid
        characters={characters}
        serverOwned={
          owned?.map((o) => ({ id: o.characterId, addedAt: o.createdAt.toISOString() })) ?? null
        }
      />
    </main>
  );
}
