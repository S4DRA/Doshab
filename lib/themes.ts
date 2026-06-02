export const DOSHAB_THEME_STORAGE_KEY = "doshab-theme";

export type DoshabThemeId =
  | "dark"
  | "light"
  | "agent-amir"
  | "nima-last-light"
  | "araz-credit-empire"
  | "threez-street-hero"
  | "hamp-root-forge"
  | "mehran-blue-corner";

export type DoshabThemeIconId =
  | "mission-target"
  | "radar"
  | "shield"
  | "fingerprint"
  | "lock"
  | "surveillance-eye"
  | "alert-triangle"
  | "id-badge"
  | "black-belt"
  | "briefcase"
  | "stealth-mask"
  | "encrypted-channel"
  | "survival-compass"
  | "backpack"
  | "map"
  | "radio"
  | "medkit"
  | "skull-marker"
  | "camp"
  | "footsteps"
  | "city-ruins"
  | "moss-leaf"
  | "gas-mask"
  | "trust-level"
  | "emotion-filter"
  | "root-system"
  | "ai-agent-network"
  | "forge-build"
  | "shield-security"
  | "terminal"
  | "database"
  | "automation"
  | "deployment"
  | "blueprint"
  | "system-status"
  | "protocol-network"
  | "credit-coin"
  | "wallet"
  | "coin-stack"
  | "trading-graph"
  | "empire-tower"
  | "orbit-planet"
  | "market-terminal"
  | "calculator"
  | "vault"
  | "leaderboard"
  | "assets-card"
  | "spending-alert"
  | "profit-arrow"
  | "galactic-map"
  | "sneaker"
  | "cap"
  | "comic-burst"
  | "hero-shield"
  | "lightning-bolt"
  | "brain-psychology"
  | "mind-map-nodes"
  | "star-badge"
  | "street-tag"
  | "style-badge"
  | "trophy"
  | "power-up-dumbbell"
  | "speech-bubble"
  | "chaos-spark"
  | "campus-legend-badge";

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
  decorativeClassName?: string;
  themeIcons?: Array<{
    id: DoshabThemeIconId;
    label: string;
  }>;
  previewDetails: string[];
};

export const DEFAULT_DOSHAB_THEME_ID: DoshabThemeId = "dark";

export const DOSHAB_THEMES: DoshabThemeConfig[] = [
  {
    id: "dark",
    name: "Doshab Dark",
    shortName: "Dark",
    description: "The calm default dark interface with warm orange accents.",
    personality: "Private, focused, and familiar.",
    colors: {
      background: "#060807",
      surface: "#0d100e",
      card: "#191e19",
      accent: "#FF5F25",
      accentSecondary: "#9ccf9a",
      border: "rgba(245, 241, 232, 0.14)",
      text: "#ffffff",
    },
    backgroundStyle:
      "radial-gradient(circle at 18% 0%, rgba(255, 95, 37, 0.12), transparent 52%), linear-gradient(180deg, #090c0a, #060807)",
    cardStyle: "linear-gradient(180deg, #191e19, #121612)",
    buttonStyle: "linear-gradient(135deg, #FF5F25, #ff7847)",
    accentStyle: "0 0 0 1px rgba(255, 95, 37, 0.32), 0 18px 48px -34px rgba(255, 95, 37, 0.7)",
    previewDetails: ["Private workspace", "Warm focus", "Default signal"],
  },
  {
    id: "light",
    name: "Doshab Light",
    shortName: "Light",
    description: "A bright, clean version of Doshab for daytime use.",
    personality: "Clear, lightweight, and readable.",
    colors: {
      background: "#f8f7f2",
      surface: "#edeee7",
      card: "#ffffff",
      accent: "#FF5F25",
      accentSecondary: "#65705f",
      border: "rgba(21, 24, 18, 0.14)",
      text: "#151812",
    },
    backgroundStyle:
      "radial-gradient(circle at 18% 0%, rgba(255, 95, 37, 0.16), transparent 48%), linear-gradient(180deg, #ffffff, #f8f7f2)",
    cardStyle: "linear-gradient(180deg, #ffffff, #f1f2ec)",
    buttonStyle: "linear-gradient(135deg, #FF5F25, #d94e1d)",
    accentStyle: "0 0 0 1px rgba(255, 95, 37, 0.28), 0 18px 42px -34px rgba(21, 24, 18, 0.45)",
    previewDetails: ["Day mode", "Clean panels", "Readable mission"],
  },
  {
    id: "agent-amir",
    name: "Agent Amir",
    shortName: "Amir",
    description:
      "A funny cinematic secret-agent theme mixed with black-belt karate energy.",
    personality:
      "Cool, mysterious, playful, premium, and cinematic without becoming childish.",
    colors: {
      background: "#050506",
      surface: "#0b0d0e",
      card: "#151515",
      accent: "#d4af37",
      accentSecondary: "#00ff7f",
      border: "rgba(212, 175, 55, 0.32)",
      text: "#f0ead8",
    },
    backgroundStyle:
      "radial-gradient(circle at 16% 12%, rgba(212, 175, 55, 0.2), transparent 36%), radial-gradient(circle at 78% 8%, rgba(255, 59, 48, 0.15), transparent 38%), radial-gradient(circle at 72% 78%, rgba(0, 255, 127, 0.1), transparent 34%), repeating-linear-gradient(135deg, rgba(212, 175, 55, 0.09) 0 1px, transparent 1px 12px), linear-gradient(180deg, #0b0d0e, #050506)",
    cardStyle:
      "radial-gradient(circle at 20% 0%, rgba(212, 175, 55, 0.13), transparent 42%), radial-gradient(circle at 92% 12%, rgba(0, 255, 127, 0.08), transparent 32%), linear-gradient(180deg, #171717, #090a0b)",
    buttonStyle: "linear-gradient(135deg, #d4af37, #f4d47b)",
    accentStyle:
      "0 0 0 1px rgba(212, 175, 55, 0.42), 0 18px 56px -34px rgba(0, 255, 127, 0.72)",
    decorativeClassName: "theme-preview-agent-amir",
    themeIcons: [
      { id: "mission-target", label: "Mission target" },
      { id: "radar", label: "Radar" },
      { id: "shield", label: "Shield" },
      { id: "fingerprint", label: "Fingerprint" },
      { id: "lock", label: "Lock" },
      { id: "surveillance-eye", label: "Surveillance eye" },
      { id: "alert-triangle", label: "Alert triangle" },
      { id: "id-badge", label: "ID badge" },
      { id: "black-belt", label: "Black belt knot" },
      { id: "briefcase", label: "Briefcase" },
      { id: "stealth-mask", label: "Stealth mask" },
      { id: "encrypted-channel", label: "Encrypted channel" },
    ],
    previewDetails: [
      "Mission Active",
      "Black Belt Access",
      "Stealth Mode: Funny",
      "Agent Status: Unpredictable",
      "Risk Level: Amir",
      "Clearance Verified",
    ],
  },
  {
    id: "nima-last-light",
    name: "Nima: Last Light",
    shortName: "Nima",
    description:
      "A chill, confident, post-apocalyptic theme with calm danger and villain-energy undertones.",
    personality:
      "Quiet villain arc, survival confidence, abandoned city beauty, and emotionally distant control.",
    colors: {
      background: "#070908",
      surface: "#101410",
      card: "#1a1f1a",
      accent: "#8b9f62",
      accentSecondary: "#c4633a",
      border: "rgba(139, 159, 98, 0.34)",
      text: "#ebe6d6",
    },
    backgroundStyle:
      "radial-gradient(circle at 16% 10%, rgba(139, 159, 98, 0.2), transparent 34%), radial-gradient(circle at 84% 78%, rgba(196, 99, 58, 0.15), transparent 38%), radial-gradient(circle at 54% 8%, rgba(45, 68, 80, 0.18), transparent 28%), repeating-linear-gradient(112deg, rgba(235, 230, 214, 0.05) 0 1px, transparent 1px 18px), linear-gradient(180deg, #101410, #070908)",
    cardStyle:
      "radial-gradient(circle at 15% 0%, rgba(139, 159, 98, 0.17), transparent 38%), linear-gradient(145deg, rgba(235, 230, 214, 0.05), transparent 34%), linear-gradient(180deg, #20261f, #0f130f)",
    buttonStyle: "linear-gradient(135deg, #7f955a, #9cad72)",
    accentStyle:
      "0 0 0 1px rgba(139, 159, 98, 0.4), 0 18px 56px -34px rgba(196, 99, 58, 0.74)",
    decorativeClassName: "theme-preview-nima-last-light",
    themeIcons: [
      { id: "survival-compass", label: "Survival compass" },
      { id: "backpack", label: "Backpack" },
      { id: "map", label: "Map" },
      { id: "radio", label: "Radio" },
      { id: "medkit", label: "Medkit" },
      { id: "skull-marker", label: "Danger marker" },
      { id: "camp", label: "Camp" },
      { id: "alert-triangle", label: "Warning triangle" },
      { id: "footsteps", label: "Footsteps" },
      { id: "city-ruins", label: "Broken city" },
      { id: "moss-leaf", label: "Moss detail" },
      { id: "gas-mask", label: "Protection mask" },
      { id: "trust-level", label: "Trust level" },
      { id: "emotion-filter", label: "Emotion filter" },
    ],
    previewDetails: [
      "Survival Mode",
      "Trust Level: Low",
      "Calm Threat",
      "Villain Arc Loading",
      "Best Friend Access",
      "Emotion Filter: Disabled",
      "Risk Level: High",
    ],
  },
  {
    id: "araz-credit-empire",
    name: "Araz: Credit Empire",
    shortName: "Araz",
    description:
      "A premium galactic finance terminal for grind mode, empire building, and overspending alarms.",
    personality:
      "Ambitious space trader, empire accountant, money obsessive, and financially chaotic grind mode.",
    colors: {
      background: "#01040d",
      surface: "#061126",
      card: "#0d213f",
      accent: "#ffc84d",
      accentSecondary: "#27c8ff",
      border: "rgba(39, 200, 255, 0.38)",
      text: "#edf7ff",
    },
    backgroundStyle:
      "radial-gradient(circle at 18% 14%, rgba(166, 92, 255, 0.25), transparent 34%), radial-gradient(circle at 82% 20%, rgba(39, 200, 255, 0.2), transparent 34%), radial-gradient(circle at 72% 82%, rgba(255, 200, 77, 0.14), transparent 36%), linear-gradient(115deg, rgba(39, 200, 255, 0.13) 0 1px, transparent 1px 18px), linear-gradient(180deg, #061126, #01040d)",
    cardStyle:
      "radial-gradient(circle at 14% 0%, rgba(39, 200, 255, 0.2), transparent 38%), linear-gradient(145deg, rgba(199, 209, 218, 0.08), transparent 34%), linear-gradient(180deg, #0d213f, #041023)",
    buttonStyle: "linear-gradient(135deg, #ffc84d, #ffe29a)",
    accentStyle:
      "0 0 0 1px rgba(39, 200, 255, 0.44), 0 18px 56px -34px rgba(255, 200, 77, 0.88)",
    decorativeClassName: "theme-preview-araz-credit-empire",
    themeIcons: [
      { id: "credit-coin", label: "Credit coin" },
      { id: "wallet", label: "Wallet" },
      { id: "coin-stack", label: "Coin stack" },
      { id: "trading-graph", label: "Trading graph" },
      { id: "empire-tower", label: "Empire tower" },
      { id: "orbit-planet", label: "Orbit planet" },
      { id: "market-terminal", label: "Market terminal" },
      { id: "calculator", label: "Calculator" },
      { id: "vault", label: "Vault" },
      { id: "alert-triangle", label: "Overspending alert" },
      { id: "leaderboard", label: "Leaderboard" },
      { id: "assets-card", label: "Assets card" },
      { id: "spending-alert", label: "Spending alert" },
      { id: "profit-arrow", label: "Profit arrow" },
      { id: "galactic-map", label: "Galactic map" },
    ],
    previewDetails: [
      "Grind Mode Active",
      "Credit Balance: Unstable",
      "Empire Status: Building",
      "Spending Alert: High Risk",
      "Profit Dream Detected",
      "Galactic Assets: 12.7M CR",
    ],
  },
  {
    id: "threez-street-hero",
    name: "3z: Street Hero",
    shortName: "3z",
    description:
      "A stylish streetwear superhero theme with bold confidence, cool hats, sneakers, psychology-student energy, and chaotic fun.",
    personality:
      "Streetwear superhero, sneakerhead confidence, campus legend energy, and funny stupid-genius brain chaos.",
    colors: {
      background: "#050506",
      surface: "#101014",
      card: "#1a1b23",
      accent: "#ff3131",
      accentSecondary: "#246bff",
      border: "rgba(255, 49, 49, 0.36)",
      text: "#fffaf0",
    },
    backgroundStyle:
      "radial-gradient(circle at 16% 14%, rgba(255, 49, 49, 0.24), transparent 34%), radial-gradient(circle at 82% 78%, rgba(36, 107, 255, 0.22), transparent 38%), radial-gradient(circle at 64% 18%, rgba(255, 204, 51, 0.14), transparent 26%), radial-gradient(circle at 42% 52%, rgba(139, 92, 246, 0.1), transparent 28%), radial-gradient(circle at center, rgba(255, 250, 240, 0.13) 1px, transparent 1.5px), linear-gradient(180deg, #101014, #050506)",
    cardStyle:
      "radial-gradient(circle at 16% 0%, rgba(255, 49, 49, 0.2), transparent 38%), radial-gradient(circle at 92% 100%, rgba(36, 107, 255, 0.16), transparent 40%), linear-gradient(180deg, #20212b, #101014)",
    buttonStyle: "linear-gradient(135deg, #ff3131 0%, #d71920 48%, #246bff 100%)",
    accentStyle:
      "0 0 0 2px rgba(255, 49, 49, 0.34), 0 20px 64px -36px rgba(36, 107, 255, 0.9)",
    decorativeClassName: "theme-preview-threez-street-hero",
    themeIcons: [
      { id: "sneaker", label: "Sneaker" },
      { id: "cap", label: "Cap" },
      { id: "comic-burst", label: "Comic burst" },
      { id: "hero-shield", label: "Hero shield" },
      { id: "lightning-bolt", label: "Lightning bolt" },
      { id: "brain-psychology", label: "Brain / psychology" },
      { id: "mind-map-nodes", label: "Mind-map nodes" },
      { id: "star-badge", label: "Star badge" },
      { id: "street-tag", label: "Street tag" },
      { id: "style-badge", label: "Style badge" },
      { id: "trophy", label: "Trophy" },
      { id: "power-up-dumbbell", label: "Power-up" },
      { id: "speech-bubble", label: "Speech bubble" },
      { id: "chaos-spark", label: "Chaos icon" },
      { id: "campus-legend-badge", label: "Campus legend badge" },
    ],
    previewDetails: [
      "Hero Fit: Active",
      "Sneaker Status: Clean",
      "Mind Map: Confused",
      "Style Level: 3z",
      "Campus Legend Mode",
      "Brain Cell: Loading",
      "Psychology Power-Up",
    ],
  },
  {
    id: "hamp-root-forge",
    name: "Hamp: Root Forge",
    shortName: "Forge",
    description:
      "A premium founder/developer theme with ancient metal, vintage technology, AI system-builder identity, and lone-warrior command energy.",
    personality:
      "Founder mode, system architect, lone builder, ancient-tech craftsman, and calm premium dashboard authority.",
    colors: {
      background: "#030407",
      surface: "#0a0c10",
      card: "#151820",
      accent: "#b88a52",
      accentSecondary: "#33d7ff",
      border: "rgba(184, 138, 82, 0.36)",
      text: "#f0e7d7",
    },
    backgroundStyle:
      "radial-gradient(circle at 16% 12%, rgba(184, 138, 82, 0.2), transparent 34%), radial-gradient(circle at 82% 74%, rgba(54, 23, 86, 0.42), transparent 40%), radial-gradient(circle at 78% 22%, rgba(51, 215, 255, 0.12), transparent 28%), repeating-linear-gradient(110deg, rgba(184, 138, 82, 0.07) 0 1px, transparent 1px 18px), linear-gradient(180deg, #101217, #030407)",
    cardStyle:
      "radial-gradient(circle at 14% 0%, rgba(51, 215, 255, 0.14), transparent 34%), radial-gradient(circle at 86% 8%, rgba(91, 50, 155, 0.2), transparent 34%), linear-gradient(180deg, #1d2029, #080a0d)",
    buttonStyle: "#b88a52",
    accentStyle:
      "0 0 0 1px rgba(184, 138, 82, 0.46), 0 20px 62px -38px rgba(51, 215, 255, 0.72)",
    decorativeClassName: "theme-preview-hamp-root-forge",
    themeIcons: [
      { id: "root-system", label: "Root system" },
      { id: "ai-agent-network", label: "AI agent network" },
      { id: "forge-build", label: "Forge/build" },
      { id: "shield-security", label: "Shield/security" },
      { id: "terminal", label: "Terminal" },
      { id: "database", label: "Database" },
      { id: "automation", label: "Automation" },
      { id: "deployment", label: "Deployment" },
      { id: "blueprint", label: "Blueprint" },
      { id: "system-status", label: "System status" },
      { id: "protocol-network", label: "Protocol/network" },
    ],
    previewDetails: [
      "Founder Mode",
      "Root System: Online",
      "Forge Status: Active",
      "AI Agent Ready",
      "Path Confirmed",
      "Powered by Rootonset",
    ],
  },
  {
    id: "mehran-blue-corner",
    name: "Mehran: Blue Corner",
    shortName: "Corner",
    description:
      "A quiet, icy blue underground fighter theme inspired by silent-corner energy, MMA discipline, and crime-drama tension.",
    personality:
      "Silent fighter in the corner, cold blue confidence, quiet danger, MMA focus, and calm intimidating control.",
    colors: {
      background: "#020711",
      surface: "#07111d",
      card: "#101927",
      accent: "#65caff",
      accentSecondary: "#b9ecff",
      border: "rgba(101, 202, 255, 0.34)",
      text: "#e9f7ff",
    },
    backgroundStyle:
      "radial-gradient(circle at 12% 18%, rgba(101, 202, 255, 0.2), transparent 34%), radial-gradient(circle at 88% 72%, rgba(185, 236, 255, 0.1), transparent 36%), linear-gradient(110deg, transparent 0 46%, rgba(101, 202, 255, 0.1) 47%, transparent 49%), linear-gradient(180deg, #07111d, #020711)",
    cardStyle:
      "radial-gradient(circle at 12% 0%, rgba(101, 202, 255, 0.16), transparent 38%), linear-gradient(180deg, #101927, #07111d)",
    buttonStyle: "linear-gradient(135deg, #65caff, #b9ecff)",
    accentStyle:
      "0 0 0 1px rgba(101, 202, 255, 0.42), 0 20px 58px -38px rgba(101, 202, 255, 0.72)",
    decorativeClassName: "theme-preview-mehran-blue-corner",
    previewDetails: [
      "Silent Mode",
      "Blue Corner",
      "Fight Status: Calm",
      "Words Used: 0",
      "MMA Focus",
      "Threat Level: Quiet",
      "Corner Presence",
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
