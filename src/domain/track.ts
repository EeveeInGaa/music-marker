export type TrackId = string;

/** Domain data for one audio title, independent of player and view state. */
export interface Track {
  id: TrackId;
  sourcePath: string;
  displayName: string;
  lastPlaybackPosition: number;
}

/** Current selection today; can later point into a collection of tracks. */
export interface ActiveTrackState {
  activeTrackId: TrackId | null;
}
