import type { Metadata } from "next";
import { connection } from "next/server";
import { toAppError } from "@/lib/hoyolab/errors";
import { getAccount } from "@/lib/hoyolab/service";
import { CharacterSidebar } from "./character-sidebar";
import { loadOwnedCharacters, type OwnedCharacter } from "./data";
import { GuestNotice, StatusPanel } from "./status-panel";

export const metadata: Metadata = {
  title: "Character Details · Genshin Build Master",
};

// Sidebar of owned characters + the selected character's build ([character]/page.tsx).
// The layout stays mounted while switching characters, so the sidebar keeps its search
// and scroll position.
export default async function CharacterDetailsLayout({ children }: LayoutProps<"/character-details">) {
  await connection();
  const main = "mx-auto w-full max-w-7xl px-4 pt-6 pb-16 sm:px-6 lg:pt-10";

  if (!(await getAccount())) {
    return (
      <main className={main}>
        <h1 className="sr-only">Character Details</h1>
        <GuestNotice />
      </main>
    );
  }

  let characters: OwnedCharacter[];
  try {
    characters = await loadOwnedCharacters();
  } catch (error) {
    const { message } = toAppError(error);
    return (
      <main className={main}>
        <h1 className="sr-only">Character Details</h1>
        <StatusPanel tone="error" label="HoYoLAB" title="Couldn't load your characters.">
          <p>{message}</p>
        </StatusPanel>
      </main>
    );
  }

  return (
    <main className={`${main} grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-8`}>
      <CharacterSidebar characters={characters} />
      <div className="min-w-0">{children}</div>
    </main>
  );
}
