import { redirect } from "next/navigation";
import { getAccount } from "@/lib/hoyolab/service";
import { loadOwnedCharacters } from "./data";
import { StatusPanel } from "./status-panel";

// /character-details opens the first character (HoYoLAB's order: highest level first).
// Guests and errors are handled by the layout.
export default async function CharacterDetailsIndex() {
  if (!(await getAccount())) return null;
  const characters = await loadOwnedCharacters().catch(() => null);
  if (!characters) return null;
  if (characters.length === 0) {
    return (
      <StatusPanel label="HoYoLAB" title="No characters on this account yet.">
        <p>HoYoLAB didn&rsquo;t list any characters. Check that your Battle Chronicle shows them.</p>
      </StatusPanel>
    );
  }
  redirect(`/character-details/${encodeURIComponent(characters[0].slug)}`);
}
