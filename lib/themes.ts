export const DOSHAB_THEME_STORAGE_KEY = "doshab-theme";

export type DoshabThemeId =
  | "dark"
  | "light"
  | "agent-amir"
  | "nima-last-light"
  | "araz-credit-empire"
  | "threez-street-hero"
  | "hamp-root-forge"
  | "bios-core"
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
  | "command-node"
  | "forge-hammer"
  | "server-rack"
  | "code-brackets"
  | "protocol-lock"
  | "system-core"
  | "war-room-map"
  | "power-core"
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
  | "campus-legend-badge"
  | "boxing-glove"
  | "mma-glove"
  | "fight-card"
  | "corner-stool"
  | "blue-corner-marker"
  | "guard-shield"
  | "focus-heartbeat"
  | "silent-mode"
  | "watchful-eye"
  | "smoke-fog"
  | "icy-spark"
  | "discipline-badge"
  | "strength-mark"
  | "calm-status";

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
    description: "The calm default dark interface with deep red surfaces and hot pink accents.",
    personality: "Private, focused, and familiar.",
    colors: {
      background: "#2B0000",
      surface: "#180004",
      card: "#32000b",
      accent: "#ff0037",
      accentSecondary: "#ff8ab0",
      border: "rgba(255, 0, 84, 0.26)",
      text: "#ffffff",
    },
    backgroundStyle:
      "radial-gradient(circle at 18% 0%, rgba(255, 0, 84, 0.18), transparent 52%), linear-gradient(180deg, #3a0009, #2B0000)",
    cardStyle: "linear-gradient(180deg, #32000b, #1d0005)",
    buttonStyle: "linear-gradient(135deg, #ff0015, #ff4f6c)",
    accentStyle: "0 0 0 1px rgba(255, 0, 84, 0.42), 0 18px 48px -34px rgba(255, 0, 84, 0.82)",
    themeIcons: [
      { id: "surveillance-eye", label: "Private watch" },
      { id: "lock", label: "Locked room" },
      { id: "encrypted-channel", label: "Encrypted channel" },
      { id: "shield", label: "Protected space" },
      { id: "fingerprint", label: "Trusted identity" },
      { id: "mission-target", label: "Focused target" },
    ],
    previewDetails: ["Private workspace", "Warm focus", "Default signal"],
  },
  {
    id: "light",
    name: "Doshab Light",
    shortName: "Light",
    description: "A bright, clean version of Doshab with hot pink accents and deep red text.",
    personality: "Clear, lightweight, and readable.",
    colors: {
      background: "#fff5f8",
      surface: "#ffe8ef",
      card: "#ffffff",
      accent: "#ff0037",
      accentSecondary: "#2B0000",
      border: "rgba(43, 0, 0, 0.14)",
      text: "#2B0000",
    },
    backgroundStyle:
      "radial-gradient(circle at 18% 0%, rgba(255, 0, 84, 0.16), transparent 48%), linear-gradient(180deg, #ffffff, #fff5f8)",
    cardStyle: "linear-gradient(180deg, #ffffff, #ffe8ef)",
    buttonStyle: "linear-gradient(135deg, #ff0040, #cc002c)",
    accentStyle: "0 0 0 1px rgba(255, 0, 84, 0.3), 0 18px 42px -34px rgba(43, 0, 0, 0.42)",
    themeIcons: [
      { id: "trust-level", label: "Trust level" },
      { id: "id-badge", label: "Readable identity" },
      { id: "shield", label: "Protected space" },
      { id: "emotion-filter", label: "Clean mood" },
      { id: "protocol-network", label: "Clear network" },
      { id: "command-node", label: "Quick command" },
    ],
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
      "A dark founder-warrior command center for system architecture, AI agents, forged infrastructure, and Rootonset creator mode.",
    personality:
      "Lone founder, software warlord, armored system architect, ancient-tech blacksmith, and silent final-boss builder.",
    colors: {
      background: "#010202",
      surface: "#070808",
      card: "#111314",
      accent: "#d8b56a",
      accentSecondary: "#86d79a",
      border: "rgba(216, 181, 106, 0.6)",
      text: "#f4ead7",
    },
    backgroundStyle:
      "radial-gradient(circle at 16% 12%, rgba(216, 181, 106, 0.2), transparent 34%), radial-gradient(circle at 84% 74%, rgba(134, 215, 154, 0.12), transparent 38%), repeating-linear-gradient(110deg, rgba(216, 181, 106, 0.07) 0 1px, transparent 1px 20px), linear-gradient(180deg, #0d0f0e, #010202)",
    cardStyle:
      "linear-gradient(135deg, rgba(216, 181, 106, 0.13), transparent 34%), linear-gradient(180deg, #1a1d1c, #050606)",
    buttonStyle: "linear-gradient(135deg, #d8b56a, #f1d79b)",
    accentStyle:
      "0 0 0 1px rgba(216, 181, 106, 0.68), 0 18px 52px -34px rgba(216, 181, 106, 0.58)",
    decorativeClassName: "theme-preview-hamp-root-forge",
    themeIcons: [
      { id: "terminal", label: "Terminal" },
      { id: "command-node", label: "Command node" },
      { id: "root-system", label: "Root network" },
      { id: "forge-hammer", label: "Forge hammer" },
      { id: "shield-security", label: "Shield" },
      { id: "database", label: "Database" },
      { id: "deployment", label: "Deployment" },
      { id: "server-rack", label: "Server rack" },
      { id: "code-brackets", label: "Code brackets" },
      { id: "ai-agent-network", label: "AI network" },
      { id: "blueprint", label: "Blueprint" },
      { id: "protocol-lock", label: "Protocol lock" },
      { id: "system-core", label: "System core" },
      { id: "war-room-map", label: "War-room map" },
      { id: "power-core", label: "Power core" },
    ],
    previewDetails: [
      "Founder Mode",
      "Root System: Online",
      "Forge Status: Active",
      "AI Agent Network: Ready",
      "Command Core Stable",
      "Powered by Rootonset",
    ],
  },
  {
    id: "bios-core",
    name: "BIOS Core",
    shortName: "BIOS",
    description:
      "A premium retro BIOS setup screen with original blue panels, gray menu chrome, and yellow selected states.",
    personality:
      "Retro, technical, sharp, mysterious, minimal, nostalgic, and system-level without becoming noisy.",
    colors: {
      background: "#000080",
      surface: "#0000AA",
      card: "#404040",
      accent: "#FFFF00",
      accentSecondary: "#C0C0C0",
      border: "rgba(192, 192, 192, 0.72)",
      text: "#FFFFFF",
    },
    backgroundStyle:
      "linear-gradient(rgba(255, 255, 255, 0.045) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 255, 255, 0.035) 1px, transparent 1px), linear-gradient(180deg, #0000AA, #000080)",
    cardStyle:
      "linear-gradient(180deg, #5A5A5A, #303030), linear-gradient(90deg, rgba(255, 255, 255, 0.14), transparent 42%)",
    buttonStyle: "linear-gradient(180deg, #FFFF00, #D6C900)",
    accentStyle:
      "0 0 0 1px rgba(192, 192, 192, 0.74), inset 0 0 0 1px rgba(255, 255, 255, 0.16), 0 18px 52px -38px rgba(255, 255, 0, 0.48)",
    decorativeClassName: "theme-preview-bios-core",
    themeIcons: [
      { id: "terminal", label: "Boot terminal" },
      { id: "system-core", label: "System core" },
      { id: "server-rack", label: "Server rack" },
      { id: "database", label: "Database" },
      { id: "power-core", label: "Power core" },
      { id: "protocol-network", label: "Network node" },
      { id: "protocol-lock", label: "Protocol lock" },
      { id: "shield-security", label: "Shield" },
      { id: "command-node", label: "Command node" },
      { id: "alert-triangle", label: "Warning" },
    ],
    previewDetails: [
      "SYSTEM READY",
      "BOOT MODE: DOSHAB",
      "VOICE MODULE: ONLINE",
      "CHAT BUS: ACTIVE",
      "NOTIFICATIONS: ENABLED",
      "MEMORY CHECK: PASSED",
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
      background: "#010713",
      surface: "#06111d",
      card: "#0e1a29",
      accent: "#7fd7ff",
      accentSecondary: "#d7f5ff",
      border: "rgba(127, 215, 255, 0.38)",
      text: "#ecfbff",
    },
    backgroundStyle:
      "radial-gradient(circle at 14% 16%, rgba(127, 215, 255, 0.2), transparent 34%), radial-gradient(circle at 86% 70%, rgba(215, 245, 255, 0.1), transparent 36%), radial-gradient(circle at 74% 18%, rgba(112, 48, 52, 0.12), transparent 24%), linear-gradient(110deg, transparent 0 46%, rgba(127, 215, 255, 0.1) 47%, transparent 49%), linear-gradient(180deg, #06111d, #010713)",
    cardStyle:
      "radial-gradient(circle at 12% 0%, rgba(127, 215, 255, 0.17), transparent 38%), linear-gradient(180deg, #0e1a29, #06111d)",
    buttonStyle: "linear-gradient(135deg, #7fd7ff, #d7f5ff)",
    accentStyle:
      "0 0 0 1px rgba(127, 215, 255, 0.46), 0 20px 58px -38px rgba(127, 215, 255, 0.76)",
    decorativeClassName: "theme-preview-mehran-blue-corner",
    themeIcons: [
      { id: "boxing-glove", label: "Boxing glove" },
      { id: "mma-glove", label: "MMA glove" },
      { id: "fight-card", label: "Fight card" },
      { id: "corner-stool", label: "Corner stool" },
      { id: "blue-corner-marker", label: "Blue corner marker" },
      { id: "guard-shield", label: "Guard shield" },
      { id: "focus-heartbeat", label: "Heartbeat / focus" },
      { id: "silent-mode", label: "Silent mode" },
      { id: "watchful-eye", label: "Watchful presence" },
      { id: "smoke-fog", label: "Smoke / fog" },
      { id: "icy-spark", label: "Icy spark" },
      { id: "alert-triangle", label: "Warning triangle" },
      { id: "discipline-badge", label: "Discipline badge" },
      { id: "strength-mark", label: "Strength icon" },
      { id: "calm-status", label: "Calm status" },
    ],
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
