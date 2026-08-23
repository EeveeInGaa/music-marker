import assert from "node:assert/strict";
import { describe, test } from "node:test";
import type { Marker } from "./marker.ts";
import { sortMarkers } from "./marker.ts";

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
