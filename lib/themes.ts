export const DOSHAB_THEME_STORAGE_KEY = "doshab-theme";

export type DoshabThemeId = "dark" | "light";

export type DoshabThemeConfig = {
  id: DoshabThemeId;
  name: string;
  shortName: string;
  description: string;
  personality: string;
  colors: {
    background: string;
    surface: string;
    card: string;
    accent: string;
    accentSecondary: string;
    border: string;
    text: string;
  };
  backgroundStyle: string;
  cardStyle: string;
  buttonStyle: string;
  accentStyle: string;
  previewDetails: string[];
};

export const DEFAULT_DOSHAB_THEME_ID: DoshabThemeId = "dark";

export const DOSHAB_THEMES: DoshabThemeConfig[] = [
  {
    id: "dark",
    name: "Dark Mode",
    shortName: "Dark",
    description: "High-contrast premium neo-brutalist dark mode.",
    personality:
      "Confident, sharp, premium, tactile, and high-contrast without drifting into muddy dashboard styling.",
    colors: {
      background: "#08090b",
      surface: "#121417",
      card: "#1c2026",
      accent: "#ffd200",
      accentSecondary: "#685bff",
      border: "rgba(245, 246, 247, 0.18)",
      text: "#f5f6f7",
    },
    backgroundStyle: "#08090b",
    cardStyle: "#14161a",
    buttonStyle: "#ffd400",
    accentStyle: "6px 6px 0 #000000",
    previewDetails: [
      "High contrast",
      "Matte charcoal surfaces",
      "Acid yellow controls",
      "Hard shadow depth",
    ],
  },
  {
    id: "light",
    name: "Light Mode",
    shortName: "Light",
    description: "High-contrast premium neo-brutalist light mode.",
    personality:
      "Clean, bold, paper-bright, structured, and premium with strong hierarchy and tactile contrast.",
    colors: {
      background: "#f7f7f5",
      surface: "#ffffff",
      card: "#fdfdfb",
      accent: "#ffd200",
      accentSecondary: "#685bff",
      border: "rgba(17, 17, 17, 0.22)",
      text: "#111111",
    },
    backgroundStyle: "#f4f0e6",
    cardStyle: "#fffdf4",
    buttonStyle: "#ffd400",
    accentStyle: "6px 6px 0 #151515",
    previewDetails: [
      "Paper-bright canvas",
      "Strong ink outlines",
      "Bright tactile controls",
      "Crisp readable hierarchy",
    ],
  },
];

export function resolveDoshabThemeId(value: string | null | undefined): DoshabThemeId {
  return DOSHAB_THEMES.some((theme) => theme.id === value)
    ? (value as DoshabThemeId)
    : DEFAULT_DOSHAB_THEME_ID;
}

export function getDoshabTheme(themeId: string | null | undefined) {
  const resolvedThemeId = resolveDoshabThemeId(themeId);

  return DOSHAB_THEMES.find((theme) => theme.id === resolvedThemeId) ?? DOSHAB_THEMES[0];
}
