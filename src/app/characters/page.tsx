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
    db.userCharacter.findMany({ where: { userId }, select: { characterId: true } }),
  ]);

  return (
    <main className="mx-auto w-full max-w-6xl px-4 py-10 sm:px-6 sm:py-14">
      <CharacterGrid
        characters={characters}
        ownedIds={owned.map((o) => o.characterId)}
      />
    </main>
  );
}
