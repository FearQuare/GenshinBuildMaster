// Element colors as CSS variables (tokens in globals.css), for inline styles.
export const ELEMENT_COLOR: Record<string, string> = {
  PYRO: "var(--color-pyro)",
  HYDRO: "var(--color-hydro)",
  ANEMO: "var(--color-anemo)",
  ELECTRO: "var(--color-electro)",
  DENDRO: "var(--color-dendro)",
  CRYO: "var(--color-cryo)",
  GEO: "var(--color-geo)",
};

export function elementColor(element: string | null | undefined): string {
  return (element && ELEMENT_COLOR[element]) || "var(--color-muted)";
}
