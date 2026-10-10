/** Shared color presets for admin + storefront swatches. */
export type PaletteColor = {
  key: string;
  name: string;
  hex: string;
};

export const COLOR_PALETTE: PaletteColor[] = [
  { key: "black", name: "Чорний", hex: "#111111" },
  { key: "bone", name: "Молочний", hex: "#E8E4DC" },
  { key: "white", name: "Білий", hex: "#F5F5F2" },
  { key: "grey", name: "Сірий", hex: "#8A8680" },
  { key: "charcoal", name: "Графіт", hex: "#3A3632" },
  { key: "brown", name: "Коричневий", hex: "#5C4033" },
  { key: "burgundy", name: "Бордо", hex: "#6B2430" },
  { key: "navy", name: "Синій", hex: "#1E3A5F" },
  { key: "olive", name: "Олива", hex: "#4A5240" },
  { key: "sand", name: "Пісок", hex: "#C4B59A" },
];

/** ASCII slug for color key from any UA/EN name. */
export function colorKeyFromName(name: string): string {
  const map: Record<string, string> = {
    а: "a",
    б: "b",
    в: "v",
    г: "h",
    ґ: "g",
    д: "d",
    е: "e",
    є: "ye",
    ж: "zh",
    з: "z",
    и: "y",
    і: "i",
    ї: "yi",
    й: "y",
    к: "k",
    л: "l",
    м: "m",
    н: "n",
    о: "o",
    п: "p",
    р: "r",
    с: "s",
    т: "t",
    у: "u",
    ф: "f",
    х: "kh",
    ц: "ts",
    ч: "ch",
    ш: "sh",
    щ: "shch",
    ь: "",
    ю: "yu",
    я: "ya",
    "'": "",
    "’": "",
  };
  const lower = name.trim().toLowerCase();
  let out = "";
  for (const ch of lower) {
    if (/[a-z0-9]/.test(ch)) out += ch;
    else if (ch === " " || ch === "-" || ch === "_") out += "-";
    else if (map[ch] != null) out += map[ch];
  }
  return out.replace(/-+/g, "-").replace(/^-|-$/g, "").slice(0, 24) || "color";
}

export function normalizeHex(raw: string): string {
  const s = raw.trim();
  if (/^#[0-9a-fA-F]{6}$/.test(s)) return s.toUpperCase();
  if (/^[0-9a-fA-F]{6}$/.test(s)) return `#${s.toUpperCase()}`;
  if (/^#[0-9a-fA-F]{3}$/.test(s)) {
    const [, a, b, c] = s;
    return `#${a}${a}${b}${b}${c}${c}`.toUpperCase();
  }
  return s;
}

const PALETTE_BY_KEY = new Map(
  COLOR_PALETTE.map((c) => [c.key.toLowerCase(), c] as const)
);

/** Look up display name + hex from internal key (black → Чорний / #111111). */
export function paletteColorForKey(key: string): PaletteColor | undefined {
  return PALETTE_BY_KEY.get(key.trim().toLowerCase());
}

/**
 * Human label for a key: palette UA name, else capitalize the key.
 * Custom keys without palette entry stay as typed name elsewhere.
 */
export function colorNameFromKey(key: string): string {
  const found = paletteColorForKey(key);
  if (found) return found.name;
  const k = key.trim();
  if (!k) return "";
  return k.charAt(0).toUpperCase() + k.slice(1).replace(/-/g, " ");
}
