import type { MusicTrack } from "../types";

export interface MusicProvider {
  search(query: string): Promise<MusicTrack[]>;
  getTrack(id: string): Promise<MusicTrack | null>;
  getTracks(ids: string[]): Promise<MusicTrack[]>;
  getRelatedTracks(track: MusicTrack): Promise<MusicTrack[]>;
  browse(): Promise<MusicTrack[]>;
  createPlaybackSource(id: string): string;
}
