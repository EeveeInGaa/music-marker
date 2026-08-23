import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { clampTime } from "../domain/time";

export interface AudioWaveformHandle {
  getCurrentTime: () => number;
  seekBy: (seconds: number) => void;
  seekTo: (time: number) => void;
  togglePlayback: () => Promise<void>;
}

interface AudioWaveformProps {
  onError: (error: Error) => void;
  onLoadingChange: (progress: number) => void;
  onPlayingChange: (isPlaying: boolean) => void;
  onReady: (duration: number) => void;
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
    { onError, onLoadingChange, onPlayingChange, onReady, onTimeChange, sourceUrl },
    ref,
  ) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const waveSurferRef = useRef<WaveSurfer | null>(null);

    useImperativeHandle(
      ref,
      () => ({
        getCurrentTime: () => waveSurferRef.current?.getCurrentTime() ?? 0,
        seekBy: (seconds) => {
          const waveSurfer = waveSurferRef.current;
          if (waveSurfer === null) {
            return;
          }

          const nextTime = clampTime(
            waveSurfer.getCurrentTime() + seconds,
            waveSurfer.getDuration(),
          );
          waveSurfer.setTime(nextTime);
        },
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
        colorScheme.removeEventListener("change", updateColors);
        waveSurfer.destroy();
        waveSurferRef.current = null;
      };
    }, [onError, onLoadingChange, onPlayingChange, onReady, onTimeChange, sourceUrl]);

    return <div className="waveform" ref={containerRef} />;
  },
);
