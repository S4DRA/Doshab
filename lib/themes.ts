export const DOSHAB_THEME_STORAGE_KEY = "doshab-theme";
export const DOSHAB_PALETTE_STORAGE_KEY = "doshab-palette";
export const DOSHAB_MODE_STORAGE_KEY = "doshab-mode";

export const DOSHAB_THEME_MODES = ["dark", "light"] as const;

export type DoshabThemeMode = (typeof DOSHAB_THEME_MODES)[number];

export const DOSHAB_PALETTE_IDS = [
  "val-classic",
  "whale-brutal",
  "cyber-grape",
  "blood-terminal",
  "industrial-lemon",
  "persian-night",
  "toxic-arcade",
  "concrete-rose",
  "signal-orange",
  "royal-brutal",
] as const;

export type DoshabPaletteId = (typeof DOSHAB_PALETTE_IDS)[number];
export type DoshabThemeId = `${DoshabPaletteId}-${DoshabThemeMode}`;

export type DoshabThemeTokens = {
  background: string;
  surface: string;
  card: string;
  accent: string;
  accentSecondary: string;
  accentTertiary: string;
  border: string;
  text: string;
  muted: string;
  danger: string;
  success: string;
  warning: string;
  shadow: string;
};

export type DoshabPaletteConfig = {
  id: DoshabPaletteId;
  name: string;
  shortName: string;
  description: string;
  personality: string;
  colors: Record<DoshabThemeMode, DoshabThemeTokens>;
  previewDetails: string[];
};

export type DoshabThemeConfig = Omit<DoshabPaletteConfig, "colors" | "id"> & {
  id: DoshabThemeId;
  mode: DoshabThemeMode;
  paletteId: DoshabPaletteId;
  colors: DoshabThemeTokens;
  backgroundStyle: string;
  cardStyle: string;
  buttonStyle: string;
  accentStyle: string;
};

export const DEFAULT_DOSHAB_PALETTE_ID: DoshabPaletteId = "val-classic";
export const DEFAULT_DOSHAB_THEME_MODE: DoshabThemeMode = "dark";
export const DEFAULT_DOSHAB_THEME_ID: DoshabThemeId = `${DEFAULT_DOSHAB_PALETTE_ID}-${DEFAULT_DOSHAB_THEME_MODE}`;

export const DOSHAB_PALETTES: DoshabPaletteConfig[] = [
  {
    id: "val-classic",
    name: "VAL Classic",
    shortName: "Classic",
    description: "Black, white, strong red, and deep blue tuned for VAL's default identity.",
    personality: "Direct, sharp, iconic, and readable.",
    colors: {
      dark: {
        background: "#08090b",
        surface: "#14161a",
        card: "#1d2026",
        accent: "#ff3232",
        accentSecondary: "#2457ff",
        accentTertiary: "#ffffff",
        border: "#000000",
        text: "#f7f7f2",
        muted: "#adb3bf",
        danger: "#ff3232",
        success: "#2bd875",
        warning: "#ffd342",
        shadow: "#000000",
      },
      light: {
        background: "#f6f3ea",
        surface: "#fffdf5",
        card: "#ece8dc",
        accent: "#e62828",
        accentSecondary: "#1748d8",
        accentTertiary: "#111111",
        border: "#111111",
        text: "#111111",
        muted: "#55514a",
        danger: "#d91f1f",
        success: "#118a45",
        warning: "#cc9200",
        shadow: "#111111",
      },
    },
    previewDetails: ["Thick ink borders", "Red command state", "Blue support blocks", "Clean VAL default"],
  },
  {
    id: "whale-brutal",
    name: "Whale Brutal",
    shortName: "Whale",
    description: "Deep navy and off-white with cyan signal accents.",
    personality: "Nautical, heavy, calm, and technical.",
    colors: {
      dark: {
        background: "#06131f",
        surface: "#0d2435",
        card: "#14344a",
        accent: "#39d7ff",
        accentSecondary: "#f4f0df",
        accentTertiary: "#0a0a0a",
        border: "#000000",
        text: "#eff8ff",
        muted: "#abc2d2",
        danger: "#ff4b5f",
        success: "#39e58c",
        warning: "#ffcf4a",
        shadow: "#000000",
      },
      light: {
        background: "#edf7fb",
        surface: "#fbf7e8",
        card: "#d6eaf2",
        accent: "#00a9d6",
        accentSecondary: "#06283d",
        accentTertiary: "#ffffff",
        border: "#06131f",
        text: "#06131f",
        muted: "#496171",
        danger: "#d92c43",
        success: "#087e49",
        warning: "#b98000",
        shadow: "#06131f",
      },
    },
    previewDetails: ["Navy shell", "Cyan action blocks", "Off-white panels", "Serious and stable"],
  },
  {
    id: "cyber-grape",
    name: "Cyber Grape",
    shortName: "Grape",
    description: "Purple, black, lavender, and acid green without noisy decoration.",
    personality: "Electric, focused, night-mode native, and crisp.",
    colors: {
      dark: {
        background: "#0b0712",
        surface: "#1d1033",
        card: "#28184a",
        accent: "#9d5cff",
        accentSecondary: "#ccff33",
        accentTertiary: "#d9c3ff",
        border: "#000000",
        text: "#fbf7ff",
        muted: "#c4b2df",
        danger: "#ff4f8b",
        success: "#b6ff3d",
        warning: "#ffd447",
        shadow: "#000000",
      },
      light: {
        background: "#f2eaff",
        surface: "#ffffff",
        card: "#e4d2ff",
        accent: "#702dff",
        accentSecondary: "#78b800",
        accentTertiary: "#20102f",
        border: "#16051f",
        text: "#16051f",
        muted: "#604b74",
        danger: "#c71f64",
        success: "#4f8700",
        warning: "#b57a00",
        shadow: "#16051f",
      },
    },
    previewDetails: ["Grape blocks", "Acid selection", "Lavender contrast", "Controlled cyber tone"],
  },
  {
    id: "blood-terminal",
    name: "Blood Terminal",
    shortName: "Terminal",
    description: "Deep red, black, cream, and yellow with command-line severity.",
    personality: "Hard, dramatic, warm, and legible.",
    colors: {
      dark: {
        background: "#0c0505",
        surface: "#230b0b",
        card: "#351111",
        accent: "#d71920",
        accentSecondary: "#ffe066",
        accentTertiary: "#fff1d0",
        border: "#000000",
        text: "#fff3e0",
        muted: "#d3b7a4",
        danger: "#ff3b3b",
        success: "#2fd56f",
        warning: "#ffe066",
        shadow: "#000000",
      },
      light: {
        background: "#fff1d0",
        surface: "#fff9eb",
        card: "#edd6b8",
        accent: "#b90f18",
        accentSecondary: "#e5aa00",
        accentTertiary: "#111111",
        border: "#111111",
        text: "#1b0808",
        muted: "#63473d",
        danger: "#b90f18",
        success: "#08783b",
        warning: "#b87900",
        shadow: "#111111",
      },
    },
    previewDetails: ["Red authority", "Cream surfaces", "Yellow warnings", "Terminal clarity"],
  },
  {
    id: "industrial-lemon",
    name: "Industrial Lemon",
    shortName: "Lemon",
    description: "Yellow, black, gray, and white for a workshop-grade interface.",
    personality: "Mechanical, bold, bright, and disciplined.",
    colors: {
      dark: {
        background: "#101010",
        surface: "#202020",
        card: "#2f2f2f",
        accent: "#ffd400",
        accentSecondary: "#ffffff",
        accentTertiary: "#8a8a8a",
        border: "#000000",
        text: "#ffffff",
        muted: "#c8c8c8",
        danger: "#ff4747",
        success: "#38d978",
        warning: "#ffd400",
        shadow: "#000000",
      },
      light: {
        background: "#f1f1ed",
        surface: "#ffffff",
        card: "#d8d8d2",
        accent: "#ffd400",
        accentSecondary: "#111111",
        accentTertiary: "#6f6f6f",
        border: "#111111",
        text: "#111111",
        muted: "#545454",
        danger: "#c82424",
        success: "#0d7c3d",
        warning: "#a87900",
        shadow: "#111111",
      },
    },
    previewDetails: ["Safety yellow", "Gray structure", "Black rails", "Industrial hierarchy"],
  },
  {
    id: "persian-night",
    name: "Persian Night",
    shortName: "Persian",
    description: "Midnight blue, turquoise, gold, and black with a premium mood.",
    personality: "Luxurious, composed, deep, and polished.",
    colors: {
      dark: {
        background: "#050b19",
        surface: "#0b1c36",
        card: "#123054",
        accent: "#18d4c8",
        accentSecondary: "#e6b84a",
        accentTertiary: "#050505",
        border: "#000000",
        text: "#eef7ff",
        muted: "#a9bdd0",
        danger: "#ff4c66",
        success: "#3be08a",
        warning: "#e6b84a",
        shadow: "#000000",
      },
      light: {
        background: "#eaf5f5",
        surface: "#fff8e6",
        card: "#cfe5e6",
        accent: "#00a99d",
        accentSecondary: "#b07c00",
        accentTertiary: "#061328",
        border: "#061328",
        text: "#061328",
        muted: "#4f6573",
        danger: "#c62843",
        success: "#087f54",
        warning: "#a16b00",
        shadow: "#061328",
      },
    },
    previewDetails: ["Midnight base", "Turquoise controls", "Gold badges", "Premium contrast"],
  },
  {
    id: "toxic-arcade",
    name: "Toxic Arcade",
    shortName: "Arcade",
    description: "Lime green, black, purple, and white with arcade energy kept tidy.",
    personality: "Loud, fast, structured, and high-contrast.",
    colors: {
      dark: {
        background: "#050805",
        surface: "#101c0e",
        card: "#172915",
        accent: "#a6ff00",
        accentSecondary: "#8b5cff",
        accentTertiary: "#ffffff",
        border: "#000000",
        text: "#f5ffe8",
        muted: "#b8caa8",
        danger: "#ff3d71",
        success: "#a6ff00",
        warning: "#ffd22e",
        shadow: "#000000",
      },
      light: {
        background: "#efffdf",
        surface: "#ffffff",
        card: "#d9f7bf",
        accent: "#69cc00",
        accentSecondary: "#6d34e8",
        accentTertiary: "#111111",
        border: "#111111",
        text: "#101a0a",
        muted: "#4c613e",
        danger: "#c91e55",
        success: "#4c9900",
        warning: "#a87800",
        shadow: "#111111",
      },
    },
    previewDetails: ["Lime actions", "Purple focus", "Arcade contrast", "No visual clutter"],
  },
  {
    id: "concrete-rose",
    name: "Concrete Rose",
    shortName: "Rose",
    description: "Concrete gray, pink, black, and off-white for a softer brutalist angle.",
    personality: "Architectural, restrained, warm, and readable.",
    colors: {
      dark: {
        background: "#111112",
        surface: "#242426",
        card: "#333336",
        accent: "#ff6fae",
        accentSecondary: "#d9d5cc",
        accentTertiary: "#0a0a0a",
        border: "#000000",
        text: "#f7f3ec",
        muted: "#bdb8b1",
        danger: "#ff4b6c",
        success: "#40d97f",
        warning: "#ffca45",
        shadow: "#000000",
      },
      light: {
        background: "#efede8",
        surface: "#fffaf0",
        card: "#d7d4ce",
        accent: "#e5498f",
        accentSecondary: "#3c3c40",
        accentTertiary: "#ffffff",
        border: "#111111",
        text: "#1b1b1d",
        muted: "#5f5a56",
        danger: "#c72a4e",
        success: "#147d45",
        warning: "#a87600",
        shadow: "#111111",
      },
    },
    previewDetails: ["Concrete cards", "Rose action", "Off-white canvas", "Warm brutalism"],
  },
  {
    id: "signal-orange",
    name: "Signal Orange",
    shortName: "Signal",
    description: "Orange, black, cream, and electric blue for urgent command surfaces.",
    personality: "Assertive, mobile-friendly, bright, and tactical.",
    colors: {
      dark: {
        background: "#0b0704",
        surface: "#24150b",
        card: "#37200f",
        accent: "#ff6a00",
        accentSecondary: "#28a8ff",
        accentTertiary: "#fff2d8",
        border: "#000000",
        text: "#fff2e6",
        muted: "#d1b49d",
        danger: "#ff4040",
        success: "#30d87c",
        warning: "#ffbe32",
        shadow: "#000000",
      },
      light: {
        background: "#fff0d8",
        surface: "#fffaf0",
        card: "#ead3b2",
        accent: "#f05a00",
        accentSecondary: "#007fe8",
        accentTertiary: "#111111",
        border: "#111111",
        text: "#1b1008",
        muted: "#654d3a",
        danger: "#c42828",
        success: "#0a7f45",
        warning: "#a86e00",
        shadow: "#111111",
      },
    },
    previewDetails: ["Orange command", "Blue shortcuts", "Cream contrast", "Strong mobile blocks"],
  },
  {
    id: "royal-brutal",
    name: "Royal Brutal",
    shortName: "Royal",
    description: "Royal blue, black, silver, and white with a colder premium finish.",
    personality: "Formal, powerful, crisp, and platform-grade.",
    colors: {
      dark: {
        background: "#050713",
        surface: "#111a3a",
        card: "#182657",
        accent: "#2f5bff",
        accentSecondary: "#c8ced8",
        accentTertiary: "#ffffff",
        border: "#000000",
        text: "#f2f5ff",
        muted: "#b5bdd2",
        danger: "#ff4b64",
        success: "#3bd880",
        warning: "#ffd45a",
        shadow: "#000000",
      },
      light: {
        background: "#edf1ff",
        surface: "#ffffff",
        card: "#d8deef",
        accent: "#214cff",
        accentSecondary: "#7a8292",
        accentTertiary: "#111111",
        border: "#111111",
        text: "#09112c",
        muted: "#535c72",
        danger: "#c42a42",
        success: "#107a45",
        warning: "#a97900",
        shadow: "#111111",
      },
    },
    previewDetails: ["Royal blue fill", "Silver panels", "Ink borders", "Cold premium feel"],
  },
];

export const DOSHAB_THEMES: DoshabThemeConfig[] = DOSHAB_PALETTES.flatMap((palette) =>
  DOSHAB_THEME_MODES.map((mode) => {
    const colors = palette.colors[mode];

    return {
      ...palette,
      id: `${palette.id}-${mode}` as DoshabThemeId,
      mode,
      paletteId: palette.id,
      colors,
      backgroundStyle: colors.background,
      cardStyle: colors.card,
      buttonStyle: colors.accent,
      accentStyle: `6px 6px 0 ${colors.shadow}`,
    };
  }),
);

export function getDoshabThemeId(
  paletteId: DoshabPaletteId = DEFAULT_DOSHAB_PALETTE_ID,
  mode: DoshabThemeMode = DEFAULT_DOSHAB_THEME_MODE,
): DoshabThemeId {
  return `${paletteId}-${mode}`;
}

export function resolveDoshabPaletteId(value: string | null | undefined): DoshabPaletteId {
  return DOSHAB_PALETTE_IDS.includes(value as DoshabPaletteId)
    ? (value as DoshabPaletteId)
    : DEFAULT_DOSHAB_PALETTE_ID;
}

export function resolveDoshabThemeMode(value: string | null | undefined): DoshabThemeMode {
  return DOSHAB_THEME_MODES.includes(value as DoshabThemeMode)
    ? (value as DoshabThemeMode)
    : DEFAULT_DOSHAB_THEME_MODE;
}

export function resolveDoshabThemeId(value: string | null | undefined): DoshabThemeId {
  if (value === "dark" || value === "light") {
    return getDoshabThemeId(DEFAULT_DOSHAB_PALETTE_ID, value);
  }

  return DOSHAB_THEMES.some((theme) => theme.id === value)
    ? (value as DoshabThemeId)
    : DEFAULT_DOSHAB_THEME_ID;
}

export function getDoshabTheme(themeId: string | null | undefined) {
  const resolvedThemeId = resolveDoshabThemeId(themeId);

  return DOSHAB_THEMES.find((theme) => theme.id === resolvedThemeId) ?? DOSHAB_THEMES[0];
}

export function getDoshabPalette(paletteId: string | null | undefined) {
  const resolvedPaletteId = resolveDoshabPaletteId(paletteId);

  return DOSHAB_PALETTES.find((palette) => palette.id === resolvedPaletteId) ?? DOSHAB_PALETTES[0];
}
