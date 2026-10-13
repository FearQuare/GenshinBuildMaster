import type { Metadata } from "next";
import { toAppError } from "@/lib/hoyolab/errors";
import { getAccount, getCharacter } from "@/lib/hoyolab/service";
import { loadOwnedCharacters } from "../data";
import { StatusPanel } from "../status-panel";
import { CharacterBuild } from "./character-build";

async function findOwned(slug: string) {
  if (!(await getAccount())) return null;
  const characters = await loadOwnedCharacters().catch(() => null);
  return characters?.find((c) => c.slug === decodeURIComponent(slug)) ?? null;
}

export async function generateMetadata({
  params,
}: PageProps<"/character-details/[character]">): Promise<Metadata> {
  const owned = await findOwned((await params).character);
  return { title: `${owned?.name ?? "Character"} · Character Details · Genshin Build Master` };
}

// The build of one owned character. Guests and roster errors are handled by the layout.
export default async function CharacterPage({ params }: PageProps<"/character-details/[character]">) {
  if (!(await getAccount())) return null;
  const owned = await findOwned((await params).character);
  if (!owned) {
    return (
      <StatusPanel label="Not found" title="That character isn't on your account.">
        <p>Pick one from your characters list.</p>
      </StatusPanel>
    );
  }

  const result = await getCharacter(owned.hoyolabId).then(
    (detail) => ({ detail }),
    (error: unknown) => ({ error: toAppError(error) }),
  );
  if ("error" in result) {
    return (
      <StatusPanel tone="error" label="HoYoLAB" title={`Couldn't load ${owned.name}'s build.`}>
        <p>{result.error.message}</p>
      </StatusPanel>
    );
  }
  return <CharacterBuild detail={result.detail} slug={owned.slug} />;
}
