import type { Marker } from "./marker";

export type TrackId = string;

/** Domain data for one audio title, independent of player and view state. */
export interface Track {
  id: TrackId;
  sourcePath: string;
  displayName: string;
  markers: Marker[];
  lastPlaybackPosition: number;
}
