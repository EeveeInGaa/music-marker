import { useCallback, useRef, useState } from "react";
import type { Track } from "../domain/track";
import { formatPlaybackTime } from "../domain/time";
import { AudioWaveform, type AudioWaveformHandle } from "./AudioWaveform";
import { PauseIcon, PlayIcon } from "./icons";

interface AudioPlayerProps {
  sourceUrl: string;
  track: Track;
}

function toPlaybackError(error: Error): string {
  const detail = error.message.trim();
  return detail.length > 0
    ? `Die Audiodatei konnte nicht geladen werden: ${detail}`
    : "Die Audiodatei konnte nicht geladen werden.";
}

export function AudioPlayer({ sourceUrl, track }: AudioPlayerProps) {
  const waveformRef = useRef<AudioWaveformHandle | null>(null);
  const [currentTime, setCurrentTime] = useState(track.lastPlaybackPosition);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [playbackError, setPlaybackError] = useState<string | null>(null);

  const handleReady = useCallback(
    (nextDuration: number) => {
      setDuration(nextDuration);
      setIsReady(true);
      setLoadingProgress(100);

      if (track.lastPlaybackPosition > 0) {
        waveformRef.current?.seekTo(track.lastPlaybackPosition);
      }
    },
    [track.lastPlaybackPosition],
  );

  const handleTimeChange = useCallback((nextTime: number) => {
    setCurrentTime((previousTime) =>
      Math.floor(previousTime) === Math.floor(nextTime) ? previousTime : nextTime,
    );
  }, []);

  const handlePlaybackError = useCallback((error: Error) => {
    setPlaybackError(toPlaybackError(error));
    setIsPlaying(false);
    setIsReady(false);
  }, []);

  const handleTogglePlayback = async () => {
    try {
      await waveformRef.current?.togglePlayback();
    } catch (error: unknown) {
      handlePlaybackError(error instanceof Error ? error : new Error(String(error)));
    }
  };

  return (
    <section className="player-card active-player" aria-labelledby="track-title">
      <div className="track-heading active-track-heading">
        <p className="eyebrow">Aktiver Titel</p>
        <h1 id="track-title" title={track.displayName}>
          {track.displayName}
        </h1>
      </div>

      <figure className="waveform-figure">
        <AudioWaveform
          onError={handlePlaybackError}
          onLoadingChange={setLoadingProgress}
          onPlayingChange={setIsPlaying}
          onReady={handleReady}
          onTimeChange={handleTimeChange}
          ref={waveformRef}
          sourceUrl={sourceUrl}
        />
        <figcaption>
          {isReady
            ? "Klicken oder ziehen, um die Wiedergabeposition zu ändern."
            : `Waveform wird geladen · ${Math.round(loadingProgress)} %`}
        </figcaption>
      </figure>

      {playbackError !== null ? (
        <p className="player-error" role="alert">
          {playbackError}
        </p>
      ) : null}

      <p className="time-display">
        <span className="visually-hidden">Wiedergabeposition und Gesamtdauer: </span>
        <span>{formatPlaybackTime(currentTime)}</span>
        <span aria-hidden="true"> / </span>
        <span>{formatPlaybackTime(duration)}</span>
      </p>

      <fieldset className="transport">
        <legend className="visually-hidden">Wiedergabesteuerung</legend>
        <button
          className="skip-button"
          disabled={!isReady}
          onClick={() => waveformRef.current?.seekBy(-5)}
          type="button"
        >
          <span aria-hidden="true">−5</span>
          <span className="visually-hidden">5 Sekunden zurück</span>
        </button>
        <button
          aria-label={isPlaying ? "Pause" : "Wiedergabe"}
          aria-pressed={isPlaying}
          className="play-button"
          disabled={!isReady}
          onClick={() => void handleTogglePlayback()}
          type="button"
        >
          {isPlaying ? <PauseIcon /> : <PlayIcon />}
        </button>
        <button
          className="skip-button"
          disabled={!isReady}
          onClick={() => waveformRef.current?.seekBy(5)}
          type="button"
        >
          <span aria-hidden="true">+5</span>
          <span className="visually-hidden">5 Sekunden vor</span>
        </button>
      </fieldset>
    </section>
  );
}
