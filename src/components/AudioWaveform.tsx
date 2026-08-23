import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { clampTime, horizontalPositionToTime } from "../domain/time";

export interface AudioWaveformHandle {
  getCurrentTime: () => number;
  seekTo: (time: number) => void;
  togglePlayback: () => Promise<void>;
}

interface AudioWaveformProps {
  onError: (error: Error) => void;
  onLoadingChange: (progress: number) => void;
  onPlayingChange: (isPlaying: boolean) => void;
  onReady: (duration: number) => void;
  onRequestMarkerAtTime: (time: number) => void;
  onTimeChange: (time: number) => void;
  sourceUrl: string;
}

function getWaveformColors() {
  const styles = getComputedStyle(document.documentElement);

  return {
    cursorColor: styles.getPropertyValue("--playhead").trim(),
    progressColor: styles.getPropertyValue("--wave-progress").trim(),
    waveColor: styles.getPropertyValue("--wave").trim(),
  };
}

export const AudioWaveform = forwardRef<AudioWaveformHandle, AudioWaveformProps>(
  function AudioWaveform(
    {
      onError,
      onLoadingChange,
      onPlayingChange,
      onReady,
      onRequestMarkerAtTime,
      onTimeChange,
      sourceUrl,
    },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const waveSurferRef = useRef<WaveSurfer | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        getCurrentTime: () => waveSurferRef.current?.getCurrentTime() ?? 0,
        seekTo: (time) => {
          const waveSurfer = waveSurferRef.current;
          if (waveSurfer === null) {
            return;
          }

          waveSurfer.setTime(clampTime(time, waveSurfer.getDuration()));
        },
        togglePlayback: async () => {
          await waveSurferRef.current?.playPause();
        },
      }),
      [],
    );

    useEffect(() => {
      const container = containerRef.current;
      if (container === null) {
        return;
      }

      const waveSurfer = WaveSurfer.create({
        ...getWaveformColors(),
        autoCenter: false,
        autoScroll: false,
        barGap: 4,
        barMinHeight: 3,
        barRadius: 3,
        barWidth: 3,
        container,
        cursorWidth: 2,
        dragToSeek: { debounceTime: 40 },
        height: 112,
        hideScrollbar: true,
        interact: true,
        normalize: true,
      });
      waveSurferRef.current = waveSurfer;

      const requestMarkerAtHorizontalPosition = (clientX: number) => {
        const bounds = container.getBoundingClientRect();
        const markerTime = horizontalPositionToTime(
          clientX - bounds.left,
          bounds.width,
          waveSurfer.getDuration(),
        );
        onRequestMarkerAtTime(markerTime);
      };

      let secondaryPointerId: number | null = null;

      const handleSecondaryPointerDown = (event: PointerEvent) => {
        const isSecondaryClick = event.button === 2 || (event.button === 0 && event.ctrlKey);
        if (!isSecondaryClick) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        secondaryPointerId = event.pointerId;
        container.setPointerCapture(event.pointerId);
      };

      const handleContextMenu = (event: MouseEvent) => {
        event.preventDefault();
        event.stopPropagation();
      };

      const handleSecondaryPointerUp = (event: PointerEvent) => {
        if (event.pointerId !== secondaryPointerId) {
          return;
        }

        event.preventDefault();
        event.stopPropagation();
        secondaryPointerId = null;
        if (container.hasPointerCapture(event.pointerId)) {
          container.releasePointerCapture(event.pointerId);
        }
        requestMarkerAtHorizontalPosition(event.clientX);
      };

      const handleSecondaryPointerCancel = (event: PointerEvent) => {
        if (event.pointerId === secondaryPointerId) {
          secondaryPointerId = null;
        }
      };

      container.addEventListener("pointerdown", handleSecondaryPointerDown, true);
      container.addEventListener("pointerup", handleSecondaryPointerUp, true);
      container.addEventListener("pointercancel", handleSecondaryPointerCancel, true);
      container.addEventListener("contextmenu", handleContextMenu);

      waveSurfer.on("loading", onLoadingChange);
      waveSurfer.on("ready", onReady);
      waveSurfer.on("timeupdate", onTimeChange);
      waveSurfer.on("play", () => onPlayingChange(true));
      waveSurfer.on("pause", () => onPlayingChange(false));
      waveSurfer.on("finish", () => onPlayingChange(false));
      waveSurfer.on("error", onError);

      const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
      const updateColors = () => waveSurfer.setOptions(getWaveformColors());
      colorScheme.addEventListener("change", updateColors);

      void waveSurfer.load(sourceUrl).catch(() => undefined);

      return () => {
        container.removeEventListener("pointerdown", handleSecondaryPointerDown, true);
        container.removeEventListener("pointerup", handleSecondaryPointerUp, true);
        container.removeEventListener("pointercancel", handleSecondaryPointerCancel, true);
        container.removeEventListener("contextmenu", handleContextMenu);
        colorScheme.removeEventListener("change", updateColors);
        waveSurfer.destroy();
        waveSurferRef.current = null;
      };
    }, [
      onError,
      onLoadingChange,
      onPlayingChange,
      onReady,
      onRequestMarkerAtTime,
      onTimeChange,
      sourceUrl,
    ]);

    return <div className="waveform" ref={containerRef} />;
  },
);
