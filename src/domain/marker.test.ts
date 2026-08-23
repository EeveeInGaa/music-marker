import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { Marker } from "./marker.ts";
import { moveMarker, sortMarkers } from "./marker.ts";

const createMarker = (id: string, time: number): Marker => ({
  color: "#4f7dd9",
  description: "",
  id,
  position: "top",
  time,
});

describe("sortMarkers", () => {
  test("sortiert Marker chronologisch", () => {
    const sorted = sortMarkers([createMarker("late", 22), createMarker("early", 4)]);

    assert.deepEqual(
      sorted.map((marker) => marker.id),
      ["early", "late"],
    );
  });

  test("verändert die Eingabeliste nicht", () => {
    const markers = [createMarker("late", 22), createMarker("early", 4)];

    sortMarkers(markers);

    assert.deepEqual(
      markers.map((marker) => marker.id),
      ["late", "early"],
    );
  });
});

describe("moveMarker", () => {
  test("verschiebt und sortiert einen Marker", () => {
    const markers = [createMarker("first", 5), createMarker("second", 10)];
    const moved = moveMarker(markers, "first", 12);

    assert.deepEqual(
      moved.map(({ id, time }) => ({ id, time })),
      [
        { id: "second", time: 10 },
        { id: "first", time: 12 },
      ],
    );
    assert.equal(markers[0]?.time, 5);
  });

  test("lässt unbekannte Marker-IDs unverändert", () => {
    const markers = [createMarker("known", 5)];

    assert.deepEqual(moveMarker(markers, "missing", 8), markers);
  });
});
