import type { Marker } from "./marker";
import type { Track, TrackId } from "./track";

export const LIBRARY_SCHEMA_VERSION = 1 as const;

/** Persisted app data. The map supports multiple tracks while the UI activates only one. */
export interface TrackLibrary {
  schemaVersion: typeof LIBRARY_SCHEMA_VERSION;
  tracksById: Record<TrackId, Track>;
  lastOpenedTrackId: TrackId | null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function isFiniteNonNegativeNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0;
}

function parseMarker(value: unknown): Marker | null {
  if (!isRecord(value)) {
    return null;
  }

  const { color, description, id, position, time } = value;
  if (
    !isNonEmptyString(id) ||
    !isFiniteNonNegativeNumber(time) ||
    (position !== "top" && position !== "bottom") ||
    !isNonEmptyString(color) ||
    typeof description !== "string"
  ) {
    return null;
  }

  return { color, description, id, position, time };
}

function parseTrack(value: unknown): Track | null {
  if (!isRecord(value)) {
    return null;
  }

  const { displayName, id, lastPlaybackPosition, markers, sourcePath } = value;
  if (
    !isNonEmptyString(id) ||
    !isNonEmptyString(sourcePath) ||
    !isNonEmptyString(displayName) ||
    !Array.isArray(markers) ||
    !isFiniteNonNegativeNumber(lastPlaybackPosition)
  ) {
    return null;
  }

  const parsedMarkers = markers.map(parseMarker);
  if (parsedMarkers.some((marker) => marker === null)) {
    return null;
  }

  return {
    displayName,
    id,
    lastPlaybackPosition,
    markers: parsedMarkers.filter((marker): marker is Marker => marker !== null),
    sourcePath,
  };
}

export function createEmptyLibrary(): TrackLibrary {
  return {
    lastOpenedTrackId: null,
    schemaVersion: LIBRARY_SCHEMA_VERSION,
    tracksById: {},
  };
}

/** Safely hydrates untrusted JSON and retains every valid track in the current schema. */
export function parseTrackLibrary(value: unknown): TrackLibrary {
  if (!isRecord(value) || value.schemaVersion !== LIBRARY_SCHEMA_VERSION) {
    return createEmptyLibrary();
  }

  const rawTracks = value.tracksById;
  if (!isRecord(rawTracks)) {
    return createEmptyLibrary();
  }

  const tracksById: Record<TrackId, Track> = {};
  for (const rawTrack of Object.values(rawTracks)) {
    const track = parseTrack(rawTrack);
    if (track !== null) {
      tracksById[track.id] = track;
    }
  }

  const lastOpenedTrackId =
    typeof value.lastOpenedTrackId === "string" && tracksById[value.lastOpenedTrackId] !== undefined
      ? value.lastOpenedTrackId
      : null;

  return {
    lastOpenedTrackId,
    schemaVersion: LIBRARY_SCHEMA_VERSION,
    tracksById,
  };
}

export function findTrackBySourcePath(library: TrackLibrary, sourcePath: string): Track | null {
  return Object.values(library.tracksById).find((track) => track.sourcePath === sourcePath) ?? null;
}

export function upsertTrack(library: TrackLibrary, track: Track): TrackLibrary {
  return {
    ...library,
    lastOpenedTrackId: track.id,
    tracksById: {
      ...library.tracksById,
      [track.id]: track,
    },
  };
}
