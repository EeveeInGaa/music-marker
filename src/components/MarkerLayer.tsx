import {
  type CSSProperties,
  memo,
  type ChangeEvent as ReactChangeEvent,
  type FocusEvent as ReactFocusEvent,
  type KeyboardEvent as ReactKeyboardEvent,
  type MouseEvent as ReactMouseEvent,
  type PointerEvent as ReactPointerEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import {
  assignMarkerLabelLanes,
  calculateMarkerLabelLaneLayout,
  type Marker,
} from "../domain/marker";
import { clampTime, formatPrecisePlaybackTime, horizontalPositionToTime } from "../domain/time";
import { useI18n } from "../i18n/i18n";
import type { MarkerLabelDisplayMode } from "./MarkerLabelDisplaySwitcher";

interface MarkerLayerProps {
  duration: number;
  labelDisplayMode: MarkerLabelDisplayMode;
  markers: readonly Marker[];
  onDescriptionChange: (markerId: string, description: string) => void;
  onDragStart: (markerId: string) => void;
  onMove: (markerId: string, time: number) => void;
  onSelect: (marker: Marker) => void;
  selectedMarkerId: string | null;
}

interface MarkerItemProps {
  duration: number;
  isSelected: boolean;
  labelDisplayMode: MarkerLabelDisplayMode;
  marker: Marker;
  onDescriptionChange: (markerId: string, description: string) => void;
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

const MARKER_LABEL_BASE_HEIGHT = 22;
const MARKER_LABEL_LANE_GAP = 4;

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
  labelDisplayMode,
  marker,
  onDescriptionChange,
  onDragStart,
  onMove,
  onSelect,
}: MarkerItemProps) {
  const { t } = useI18n();
  const markerElementRef = useRef<HTMLDivElement | null>(null);
  const dragTimeRef = useRef<HTMLOutputElement | null>(null);
  const dragSessionRef = useRef<DragSession | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const cancelDescriptionEditRef = useRef(false);
  const suppressClickRef = useRef(false);
  const suppressClickTimerRef = useRef<number | null>(null);
  const [draftDescription, setDraftDescription] = useState(marker.description);
  const [isDragging, setIsDragging] = useState(false);
  const description = draftDescription.trim();
  const label = description.length > 0 ? description : t("marker.defaultLabel");
  const labelSizeText = draftDescription.length > 0 ? draftDescription : t("marker.defaultLabel");

  useEffect(() => {
    setDraftDescription(marker.description);
  }, [marker.description]);

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
    const didStartDragging = !dragSession.didMove && Math.abs(horizontalDelta) >= 2;
    dragSession.didMove = dragSession.didMove || didStartDragging;

    if (didStartDragging) {
      setIsDragging(true);
      document.body.classList.add("is-marker-dragging");
      onDragStart(marker.id);
    }
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
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: ReactPointerEvent<HTMLButtonElement>) => {
    if (dragSessionRef.current?.pointerId !== event.pointerId) {
      return;
    }

    event.stopPropagation();
    updateDragPosition(event.clientX);
    if (dragSessionRef.current.didMove) {
      scheduleDragPaint();
    }
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

  const handleDescriptionBlur = (
    event: ReactFocusEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    if (cancelDescriptionEditRef.current) {
      cancelDescriptionEditRef.current = false;
      setDraftDescription(marker.description);
      return;
    }

    if (event.currentTarget.value !== marker.description) {
      onDescriptionChange(marker.id, event.currentTarget.value);
    }
  };

  const handleDescriptionKeyDown = (
    event: ReactKeyboardEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    event.stopPropagation();
    if (event.key === "Enter") {
      event.preventDefault();
      event.currentTarget.blur();
    } else if (event.key === "Escape") {
      event.preventDefault();
      cancelDescriptionEditRef.current = true;
      event.currentTarget.blur();
    }
  };

  const descriptionFieldProps = {
    "aria-label": t("marker.editDescription", {
      time: formatPrecisePlaybackTime(marker.time),
    }),
    enterKeyHint: "done" as const,
    maxLength: 500,
    onBlur: handleDescriptionBlur,
    onChange: (event: ReactChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setDraftDescription(event.currentTarget.value),
    onClick: (event: ReactMouseEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      event.stopPropagation(),
    onKeyDown: handleDescriptionKeyDown,
    onPointerDown: (event: ReactPointerEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      event.stopPropagation(),
    placeholder: t("marker.defaultLabel"),
    spellCheck: true,
    value: draftDescription,
  };

  return (
    <div
      className={`timeline-marker marker-${marker.position}${isSelected ? " is-selected" : ""}${isDragging ? " is-dragging" : ""}`}
      data-marker-id={marker.id}
      ref={markerElementRef}
      style={getMarkerStyle(marker, duration)}
    >
      <span className="marker-line" aria-hidden="true" />
      <button
        aria-label={t("marker.editOrMove", {
          label,
          time: formatPrecisePlaybackTime(marker.time),
        })}
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
        <output aria-hidden="true" className="marker-drag-time" ref={dragTimeRef}>
          {formatPrecisePlaybackTime(marker.time)}
        </output>
      </button>
      {labelDisplayMode === "show-all" ? (
        <span className="marker-short-label marker-label-autosize">
          <span aria-hidden="true" className="marker-label-size-mirror">
            {labelSizeText}​
          </span>
          <textarea
            {...descriptionFieldProps}
            className="marker-label-autosize-input"
            rows={1}
            wrap="soft"
          />
        </span>
      ) : (
        <input {...descriptionFieldProps} className="marker-short-label" type="text" />
      )}
    </div>
  );
});

export function MarkerLayer({
  duration,
  labelDisplayMode,
  markers,
  onDescriptionChange,
  onDragStart,
  onMove,
  onSelect,
  selectedMarkerId,
}: MarkerLayerProps) {
  const layerRef = useRef<HTMLDivElement | null>(null);

  useLayoutEffect(() => {
    const layer = layerRef.current;
    if (layer === null) {
      return;
    }
    layer.dataset.labelDisplay = labelDisplayMode;

    const timelineStage = layer.parentElement;
    if (timelineStage === null) {
      return;
    }

    let animationFrame: number | null = null;

    const updateLabelLayout = () => {
      animationFrame = null;
      const markerElements = new Map<string, HTMLDivElement>();
      for (const element of layer.querySelectorAll<HTMLDivElement>(".timeline-marker")) {
        const markerId = element.dataset.markerId;
        if (markerId !== undefined) {
          markerElements.set(markerId, element);
        }
      }

      const labelBounds = new Map<string, DOMRect>();
      const geometries = markers.map((marker) => {
        const bounds = markerElements
          .get(marker.id)
          ?.querySelector<HTMLElement>(".marker-short-label")
          ?.getBoundingClientRect();
        if (bounds !== undefined) {
          labelBounds.set(marker.id, bounds);
        }

        return {
          id: marker.id,
          position: marker.position,
          time: marker.time,
          width: bounds?.width ?? 0,
        };
      });
      const lanes = assignMarkerLabelLanes(geometries, duration, layer.clientWidth);
      const laneHeights: Record<Marker["position"], number[]> = { bottom: [], top: [] };

      for (const marker of markers) {
        const lane = lanes[marker.id] ?? 0;
        const height = labelBounds.get(marker.id)?.height ?? MARKER_LABEL_BASE_HEIGHT;
        laneHeights[marker.position][lane] = Math.max(
          laneHeights[marker.position][lane] ?? 0,
          height,
        );
      }

      const layouts = {
        bottom: calculateMarkerLabelLaneLayout(
          laneHeights.bottom,
          MARKER_LABEL_BASE_HEIGHT,
          MARKER_LABEL_LANE_GAP,
        ),
        top: calculateMarkerLabelLaneLayout(
          laneHeights.top,
          MARKER_LABEL_BASE_HEIGHT,
          MARKER_LABEL_LANE_GAP,
        ),
      };

      for (const marker of markers) {
        const lane = lanes[marker.id] ?? 0;
        markerElements
          .get(marker.id)
          ?.style.setProperty(
            "--marker-label-offset",
            `${layouts[marker.position].offsets[lane] ?? 0}px`,
          );
      }

      timelineStage.style.setProperty(
        "--marker-top-stack-space",
        `${Math.max(layouts.top.totalHeight - MARKER_LABEL_BASE_HEIGHT, 0)}px`,
      );
      timelineStage.style.setProperty(
        "--marker-bottom-stack-space",
        layouts.bottom.totalHeight > 0
          ? `${layouts.bottom.totalHeight + MARKER_LABEL_LANE_GAP}px`
          : "0px",
      );
    };

    const scheduleLabelLayout = () => {
      if (animationFrame === null) {
        animationFrame = requestAnimationFrame(updateLabelLayout);
      }
    };

    updateLabelLayout();
    const resizeObserver = new ResizeObserver(scheduleLabelLayout);
    resizeObserver.observe(layer);
    for (const label of layer.querySelectorAll<HTMLElement>(".marker-short-label")) {
      resizeObserver.observe(label);
    }

    return () => {
      resizeObserver.disconnect();
      if (animationFrame !== null) {
        cancelAnimationFrame(animationFrame);
      }
      timelineStage.style.removeProperty("--marker-top-stack-space");
      timelineStage.style.removeProperty("--marker-bottom-stack-space");
    };
  }, [duration, labelDisplayMode, markers]);

  return (
    <div className="marker-layer" data-label-display={labelDisplayMode} ref={layerRef}>
      {markers.map((marker) => (
        <MarkerItem
          duration={duration}
          isSelected={selectedMarkerId === marker.id}
          key={marker.id}
          labelDisplayMode={labelDisplayMode}
          marker={marker}
          onDescriptionChange={onDescriptionChange}
          onDragStart={onDragStart}
          onMove={onMove}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
