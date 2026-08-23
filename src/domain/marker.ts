export type MarkerPosition = "top" | "bottom";

export interface Marker {
  id: string;
  time: number;
  position: MarkerPosition;
  color: string;
  description: string;
}

export interface MarkerColor {
  name: "blue" | "green" | "pink" | "slate" | "teal" | "violet" | "yellow";
  value: string;
}

export interface MarkerLabelGeometry {
  id: string;
  position: MarkerPosition;
  time: number;
  width: number;
}

export const MARKER_COLORS: readonly MarkerColor[] = [
  { name: "blue", value: "#4f7dd9" },
  { name: "teal", value: "#2d988b" },
  { name: "green", value: "#659b4e" },
  { name: "yellow", value: "#c9952e" },
  { name: "violet", value: "#8668c7" },
  { name: "pink", value: "#c75e91" },
  { name: "slate", value: "#71859b" },
];

export const DEFAULT_MARKER_COLOR = MARKER_COLORS[0]?.value ?? "#4f7dd9";

export function sortMarkers(markers: readonly Marker[]): Marker[] {
  return [...markers].sort((first, second) => first.time - second.time);
}

export function moveMarker(markers: readonly Marker[], markerId: string, time: number): Marker[] {
  return sortMarkers(
    markers.map((marker) => (marker.id === markerId ? { ...marker, time } : marker)),
  );
}

export function updateMarkerDescription(
  markers: readonly Marker[],
  markerId: string,
  description: string,
): Marker[] {
  return markers.map((marker) => (marker.id === markerId ? { ...marker, description } : marker));
}

export function assignMarkerLabelLanes(
  labels: readonly MarkerLabelGeometry[],
  duration: number,
  timelineWidth: number,
  minimumGap = 8,
): Record<string, number> {
  const lanesByMarkerId: Record<string, number> = {};
  if (
    !Number.isFinite(duration) ||
    duration <= 0 ||
    !Number.isFinite(timelineWidth) ||
    timelineWidth <= 0
  ) {
    for (const label of labels) {
      lanesByMarkerId[label.id] = 0;
    }
    return lanesByMarkerId;
  }

  const safeMinimumGap = Number.isFinite(minimumGap) ? Math.max(minimumGap, 0) : 0;

  for (const position of ["top", "bottom"] as const) {
    const laneEnds: number[] = [];
    const positionedLabels = labels
      .filter((label) => label.position === position)
      .sort((first, second) => first.time - second.time);

    for (const label of positionedLabels) {
      const safeTime = Number.isFinite(label.time)
        ? Math.min(Math.max(label.time, 0), duration)
        : 0;
      const safeWidth = Number.isFinite(label.width) ? Math.max(label.width, 0) : 0;
      const center = (safeTime / duration) * timelineWidth;
      const start = center - safeWidth / 2;
      const end = center + safeWidth / 2;
      const availableLane = laneEnds.findIndex((laneEnd) => start >= laneEnd + safeMinimumGap);
      const lane = availableLane === -1 ? laneEnds.length : availableLane;

      laneEnds[lane] = end;
      lanesByMarkerId[label.id] = lane;
    }
  }

  return lanesByMarkerId;
}
