export type MarkerPosition = "top" | "bottom";

export interface Marker {
  id: string;
  time: number;
  position: MarkerPosition;
  color: string;
  description: string;
}

export interface MarkerColor {
  label: string;
  value: string;
}

export const MARKER_COLORS: readonly MarkerColor[] = [
  { label: "Blau", value: "#4f7dd9" },
  { label: "Türkis", value: "#2d988b" },
  { label: "Grün", value: "#659b4e" },
  { label: "Gelb", value: "#c9952e" },
  { label: "Violett", value: "#8668c7" },
  { label: "Pink", value: "#c75e91" },
  { label: "Schiefer", value: "#71859b" },
];

export const DEFAULT_MARKER_COLOR = MARKER_COLORS[0]?.value ?? "#4f7dd9";

export function sortMarkers(markers: readonly Marker[]): Marker[] {
  return [...markers].sort((first, second) => first.time - second.time);
}
