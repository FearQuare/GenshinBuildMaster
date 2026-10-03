// Character icons live in public/characters/ (downloaded by scripts/fetch-character-icons.ts).
// Every Traveler element shares one icon.
export function characterIconFile(characterId: string): string {
  return characterId.startsWith("traveler-") ? "traveler.png" : `${characterId}.png`;
}

export function characterIconSrc(characterId: string): string {
  return `/characters/${characterIconFile(characterId)}`;
}
