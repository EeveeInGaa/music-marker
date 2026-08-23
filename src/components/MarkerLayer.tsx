import type { CSSProperties, PointerEvent } from "react";
import type { Marker } from "../domain/marker";
import { clampTime, formatPlaybackTime } from "../domain/time";

interface MarkerLayerProps {
  duration: number;
  markers: readonly Marker[];
  onSelect: (marker: Marker) => void;
  selectedMarkerId: string | null;
}

interface MarkerStyle extends CSSProperties {
  "--marker-color": string;
  "--marker-offset": string;
}

function getMarkerStyle(marker: Marker, duration: number): MarkerStyle {
  const offset = duration > 0 ? (clampTime(marker.time, duration) / duration) * 100 : 0;

  return {
    "--marker-color": marker.color,
    "--marker-offset": `${offset}%`,
  };
}

function stopPointerPropagation(event: PointerEvent<HTMLButtonElement>) {
  event.stopPropagation();
}

export function MarkerLayer({ duration, markers, onSelect, selectedMarkerId }: MarkerLayerProps) {
  return (
    <div className="marker-layer">
      {markers.map((marker) => {
        const description = marker.description.trim();
        const label = description.length > 0 ? description : "Marker";

        return (
          <div
            className={`timeline-marker marker-${marker.position}${
              selectedMarkerId === marker.id ? " is-selected" : ""
            }`}
            key={marker.id}
            style={getMarkerStyle(marker, duration)}
          >
            <span className="marker-line" aria-hidden="true" />
            <button
              aria-label={`${label} bei ${formatPlaybackTime(marker.time)} bearbeiten`}
              className="marker-handle"
              onClick={(event) => {
                event.stopPropagation();
                onSelect(marker);
              }}
              onPointerDown={stopPointerPropagation}
              type="button"
            >
              <span className="marker-dot" aria-hidden="true" />
              <span className="marker-short-label" aria-hidden="true">
                {label}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}
