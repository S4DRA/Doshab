import type { MusicSearchPage, MusicTrack } from "../types";

export interface MusicProvider {
  search(query: string, pageToken?: string): Promise<MusicSearchPage>;
  getTrack(id: string): Promise<MusicTrack | null>;
  getTracks(ids: string[]): Promise<MusicTrack[]>;
  getRelatedTracks(track: MusicTrack): Promise<MusicTrack[]>;
  browse(pageToken?: string): Promise<MusicSearchPage>;
  createPlaybackSource(id: string): string;
}
