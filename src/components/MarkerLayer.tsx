import {
  type CSSProperties,
  memo,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import type { Marker } from "../domain/marker";
import { clampTime, formatPrecisePlaybackTime, horizontalPositionToTime } from "../domain/time";

interface MarkerLayerProps {
  duration: number;
  markers: readonly Marker[];
  onDragStart: (markerId: string) => void;
  onMove: (markerId: string, time: number) => void;
  onSelect: (marker: Marker) => void;
  selectedMarkerId: string | null;
}

interface MarkerItemProps {
  duration: number;
  isSelected: boolean;
  marker: Marker;
  onDragStart: (markerId: string) => void;
  onMove: (markerId: string, time: number) => void;
  onSelect: (marker: Marker) => void;
}

interface MarkerStyle extends CSSProperties {
  "--marker-color": string;
  "--marker-offset": string;
}

interface DragSession {
  didMove: boolean;
  initialPixel: number;
  lastPixel: number;
  lastTime: number;
  pointerId: number;
  startClientX: number;
  timelineWidth: number;
}

function getMarkerStyle(marker: Marker, duration: number): MarkerStyle {
  const offset = duration > 0 ? (clampTime(marker.time, duration) / duration) * 100 : 0;

  return {
    "--marker-color": marker.color,
    "--marker-offset": `${offset}%`,
  };
}

const MarkerItem = memo(function MarkerItem({
  duration,
  isSelected,
  marker,
  onDragStart,
  onMove,
  onSelect,
}: MarkerItemProps) {
  const markerElementRef = useRef<HTMLDivElement | null>(null);
  const dragTimeRef = useRef<HTMLOutputElement | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const suppressClickRef = useRef(false);
  const suppressClickTimerRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const description = marker.description.trim();
  const label = description.length > 0 ? description : "Marker";

  const paintDragPosition = () => {
    animationFrameRef.current = null;
    const dragSession = dragSessionRef.current;
    const markerElement = markerElementRef.current;
    if (dragSession === null || markerElement === null) {
      return;
    }

    markerElement.style.setProperty(
      "--marker-drag-offset",
      `${dragSession.lastPixel - dragSession.initialPixel}px`,
    );

    if (dragTimeRef.current !== null) {
      dragTimeRef.current.textContent = formatPrecisePlaybackTime(dragSession.lastTime);
    }
  };

  const scheduleDragPaint = () => {
    if (animationFrameRef.current === null) {
      animationFrameRef.current = requestAnimationFrame(paintDragPosition);
    }
  };

  const updateDragPosition = (clientX: number) => {
    const dragSession = dragSessionRef.current;
    if (dragSession === null) {
      return;
    }

    const horizontalDelta = clientX - dragSession.startClientX;
    dragSession.lastPixel = Math.min(
      Math.max(dragSession.initialPixel + horizontalDelta, 0),
      dragSession.timelineWidth,
    );
    dragSession.lastTime = horizontalPositionToTime(
      dragSession.lastPixel,
      dragSession.timelineWidth,
      duration,
    );
    dragSession.didMove = dragSession.didMove || Math.abs(horizontalDelta) >= 2;
  };

  const finishDrag = (shouldCommit: boolean) => {
    const dragSession = dragSessionRef.current;
    const markerElement = markerElementRef.current;
    if (dragSession === null) {
      return;
    }

    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    if (markerElement !== null) {
      if (shouldCommit && dragSession.didMove) {
        const offset = (dragSession.lastPixel / dragSession.timelineWidth) * 100;
        markerElement.style.setProperty("--marker-offset", `${offset}%`);
      }

      markerElement.style.removeProperty("--marker-drag-offset");
    }

    document.body.classList.remove("is-marker-dragging");
    dragSessionRef.current = null;
    setIsDragging(false);

    if (shouldCommit && dragSession.didMove) {
      suppressClickRef.current = true;
      suppressClickTimerRef.current = window.setTimeout(() => {
        suppressClickRef.current = false;
        suppressClickTimerRef.current = null;
      }, 0);
      onMove(marker.id, dragSession.lastTime);
    }
  };

  useEffect(
    () => () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (suppressClickTimerRef.current !== null) {
        clearTimeout(suppressClickTimerRef.current);
      }
      document.body.classList.remove("is-marker-dragging");
    },
    [],
  );

  const handlePointerDown = (event: ReactPointerEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (event.button !== 0 || event.ctrlKey || duration <= 0) {
      return;
    }

    const markerElement = markerElementRef.current;
    if (markerElement === null) {
      return;
    }

    const timelineElement = markerElement.parentElement;
    if (timelineElement === null) {
      return;
    }

    const timelineBounds = timelineElement.getBoundingClientRect();
    if (timelineBounds.width <= 0) {
      return;
    }

    const initialPixel = (clampTime(marker.time, duration) / duration) * timelineBounds.width;
    dragSessionRef.current = {
      didMove: false,
      initialPixel,
      lastPixel: initialPixel,
      lastTime: marker.time,
      pointerId: event.pointerId,
      startClientX: event.clientX,
      timelineWidth: timelineBounds.width,
    };
    suppressClickRef.current = false;
    setIsDragging(true);
    document.body.classList.add("is-marker-dragging");
    event.currentTarget.setPointerCapture(event.pointerId);
    onDragStart(marker.id);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragSessionRef.current?.pointerId !== event.pointerId) {
      return;
    }

    event.stopPropagation();
    updateDragPosition(event.clientX);
    scheduleDragPaint();
  };

  const handlePointerUp = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragSessionRef.current?.pointerId !== event.pointerId) {
      return;
    }

    event.stopPropagation();
    updateDragPosition(event.clientX);
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    paintDragPosition();
    finishDrag(true);

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  };

  const handlePointerCancel = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragSessionRef.current?.pointerId !== event.pointerId) {
      return;
    }

    finishDrag(false);
  };

  return (
    <div
      className={`timeline-marker marker-${marker.position}${isSelected ? " is-selected" : ""}${isDragging ? " is-dragging" : ""}`}
      ref={markerElementRef}
      style={getMarkerStyle(marker, duration)}
    >
      <span className="marker-line" aria-hidden="true" />
      <button
        aria-label={`${label} bei ${formatPrecisePlaybackTime(marker.time)} bearbeiten oder verschieben`}
        className="marker-handle"
        onClick={(event) => {
          event.stopPropagation();
          if (suppressClickRef.current) {
            suppressClickRef.current = false;
            if (suppressClickTimerRef.current !== null) {
              clearTimeout(suppressClickTimerRef.current);
              suppressClickTimerRef.current = null;
            }
            event.preventDefault();
            return;
          }

          onSelect(marker);
        }}
        onPointerCancel={handlePointerCancel}
        onPointerDown={handlePointerDown}
        onLostPointerCapture={handlePointerCancel}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        type="button"
      >
        <span className="marker-dot" aria-hidden="true" />
        <span className="marker-short-label" aria-hidden="true">
          {label}
        </span>
        <output aria-hidden="true" className="marker-drag-time" ref={dragTimeRef}>
          {formatPrecisePlaybackTime(marker.time)}
        </output>
      </button>
    </div>
  );
});

export function MarkerLayer({
  duration,
  markers,
  onDragStart,
  onMove,
  onSelect,
  selectedMarkerId,
}: MarkerLayerProps) {
  return (
    <div className="marker-layer">
      {markers.map((marker) => (
        <MarkerItem
          duration={duration}
          isSelected={selectedMarkerId === marker.id}
          key={marker.id}
          marker={marker}
          onDragStart={onDragStart}
          onMove={onMove}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
