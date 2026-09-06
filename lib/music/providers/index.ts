import "server-only";
import { youtubeProvider } from "./youtube";
import type { MusicProvider } from "./provider";

export function getMusicProvider(provider: string): MusicProvider {
  if (provider === "youtube") return youtubeProvider;
  throw new Error("Unsupported music provider.");
}
