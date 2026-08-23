import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  createEmptyLibrary,
  findTrackBySourcePath,
  LIBRARY_SCHEMA_VERSION,
  parseTrackLibrary,
  upsertTrack,
} from "./library.ts";
import type { Track } from "./track.ts";

const firstTrack: Track = {
  displayName: "Erster Titel.mp3",
  id: "track-one",
  lastPlaybackPosition: 12.5,
  markers: [
    {
      color: "#4f7dd9",
      description: "Einsatz",
      id: "marker-one",
      position: "top",
      time: 4.25,
    },
  ],
  sourcePath: "/music/first.mp3",
};

const secondTrack: Track = {
  displayName: "Zweiter Titel.wav",
  id: "track-two",
  lastPlaybackPosition: 0,
  markers: [],
  sourcePath: "/music/second.wav",
};

describe("track library", () => {
  test("verwaltet mehrere Tracks, obwohl nur der letzte aktiv ist", () => {
    const library = upsertTrack(upsertTrack(createEmptyLibrary(), firstTrack), secondTrack);

    assert.equal(Object.keys(library.tracksById).length, 2);
    assert.equal(library.lastOpenedTrackId, secondTrack.id);
    assert.equal(findTrackBySourcePath(library, firstTrack.sourcePath)?.id, firstTrack.id);
  });

  test("aktualisiert einen Track ohne andere Tracks zu verlieren", () => {
    const library = upsertTrack(upsertTrack(createEmptyLibrary(), firstTrack), secondTrack);
    const updated = upsertTrack(library, { ...firstTrack, lastPlaybackPosition: 28 });

    assert.equal(updated.tracksById[firstTrack.id]?.lastPlaybackPosition, 28);
    assert.deepEqual(updated.tracksById[secondTrack.id], secondTrack);
  });
});

describe("parseTrackLibrary", () => {
  test("validiert und übernimmt persistierte Track- und Markerdaten", () => {
    const parsed = parseTrackLibrary({
      lastOpenedTrackId: firstTrack.id,
      schemaVersion: LIBRARY_SCHEMA_VERSION,
      tracksById: { [firstTrack.id]: firstTrack },
    });

    assert.deepEqual(parsed.tracksById[firstTrack.id], firstTrack);
    assert.equal(parsed.lastOpenedTrackId, firstTrack.id);
  });

  test("ignoriert ungültige Tracks und eine dadurch verwaiste letzte Auswahl", () => {
    const parsed = parseTrackLibrary({
      lastOpenedTrackId: "broken",
      schemaVersion: LIBRARY_SCHEMA_VERSION,
      tracksById: {
        broken: { ...firstTrack, lastPlaybackPosition: -1 },
        valid: secondTrack,
      },
    });

    assert.deepEqual(parsed.tracksById, { [secondTrack.id]: secondTrack });
    assert.equal(parsed.lastOpenedTrackId, null);
  });

  test("fällt bei einem unbekannten Schema sicher auf einen leeren Zustand zurück", () => {
    assert.deepEqual(parseTrackLibrary({ schemaVersion: 99 }), createEmptyLibrary());
    assert.deepEqual(parseTrackLibrary(null), createEmptyLibrary());
  });
});
