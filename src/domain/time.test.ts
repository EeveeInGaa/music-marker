import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { clampTime, formatPlaybackTime } from "./time.ts";

describe("clampTime", () => {
  test("begrenzt Positionen auf die Audiodauer", () => {
    assert.equal(clampTime(-3, 120), 0);
    assert.equal(clampTime(42.5, 120), 42.5);
    assert.equal(clampTime(125, 120), 120);
  });

  test("behandelt ungültige Werte sicher", () => {
    assert.equal(clampTime(Number.NaN, 120), 0);
    assert.equal(clampTime(10, Number.POSITIVE_INFINITY), 0);
    assert.equal(clampTime(10, 0), 0);
  });
});

describe("formatPlaybackTime", () => {
  test("formatiert Minuten und Sekunden", () => {
    assert.equal(formatPlaybackTime(0), "00:00");
    assert.equal(formatPlaybackTime(65.9), "01:05");
  });

  test("ergänzt Stunden nur für längere Titel", () => {
    assert.equal(formatPlaybackTime(3599), "59:59");
    assert.equal(formatPlaybackTime(3661), "1:01:01");
  });

  test("fängt negative und nicht endliche Werte ab", () => {
    assert.equal(formatPlaybackTime(-1), "00:00");
    assert.equal(formatPlaybackTime(Number.NaN), "00:00");
  });
});
