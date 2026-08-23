import { useCallback, useEffect, useRef, useState } from "react";
import { DEFAULT_MARKER_COLOR, type Marker, moveMarker, sortMarkers } from "../domain/marker";
import { clampTime, formatPlaybackTime } from "../domain/time";
import type { Track } from "../domain/track";
import { AudioWaveform, type AudioWaveformHandle } from "./AudioWaveform";
import { PauseIcon, PlayIcon } from "./icons";
import { MarkerEditor, type MarkerEditorMode } from "./MarkerEditor";
import { MarkerLayer } from "./MarkerLayer";

interface AudioPlayerProps {
  onMarkersChange: (markers: Marker[]) => void;
  sourceUrl: string;
  track: Track;
}

interface MarkerEditorState {
  marker: Marker;
  mode: MarkerEditorMode;
}

function toPlaybackError(error: Error): string {
  const detail = error.message.trim();
  return detail.length > 0
    ? `Die Audiodatei konnte nicht geladen werden: ${detail}`
    : "Die Audiodatei konnte nicht geladen werden.";
}

function isInteractiveKeyboardTarget(target: EventTarget | null): boolean {
  return (
    target instanceof Element &&
    target.closest(
      "button, input, textarea, select, [contenteditable]:not([contenteditable='false'])",
    ) !== null
  );
}

export function AudioPlayer({ onMarkersChange, sourceUrl, track }: AudioPlayerProps) {
  const waveformRef = useRef<AudioWaveformHandle | null>(null);
  const [currentTime, setCurrentTime] = useState(track.lastPlaybackPosition);
  const [duration, setDuration] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [markerEditor, setMarkerEditor] = useState<MarkerEditorState | null>(null);
  const [selectedMarkerId, setSelectedMarkerId] = useState<string | null>(null);

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

  const handleCloseMarkerEditor = useCallback(() => {
    setMarkerEditor(null);
  }, []);

  const handleAddMarkerAtTime = useCallback((time: number) => {
    setSelectedMarkerId(null);
    setMarkerEditor({
      marker: {
        color: DEFAULT_MARKER_COLOR,
        description: "",
        id: crypto.randomUUID(),
        position: "top",
        time,
      },
      mode: "create",
    });
  }, []);

  const handleAddMarker = () => {
    const markerTime = clampTime(waveformRef.current?.getCurrentTime() ?? currentTime, duration);
    handleAddMarkerAtTime(markerTime);
  };

  const handleSaveMarker = (marker: Marker) => {
    const nextMarkers =
      markerEditor?.mode === "edit"
        ? track.markers.map((currentMarker) =>
            currentMarker.id === marker.id ? marker : currentMarker,
          )
        : [...track.markers, marker];

    onMarkersChange(sortMarkers(nextMarkers));
    setSelectedMarkerId(marker.id);
    handleCloseMarkerEditor();
  };

  const handleDeleteMarker = (markerId: string) => {
    onMarkersChange(track.markers.filter((marker) => marker.id !== markerId));
    setSelectedMarkerId(null);
    handleCloseMarkerEditor();
  };

  const handleSelectMarker = useCallback((marker: Marker) => {
    setSelectedMarkerId(marker.id);
    setMarkerEditor({ marker, mode: "edit" });
  }, []);

  const handleMarkerDragStart = useCallback((markerId: string) => {
    setSelectedMarkerId(markerId);
    setMarkerEditor(null);
  }, []);

  const handleMarkerMove = useCallback(
    (markerId: string, time: number) => {
      onMarkersChange(moveMarker(track.markers, markerId, clampTime(time, duration)));
    },
    [duration, onMarkersChange, track.markers],
  );

  const handleTogglePlayback = useCallback(async () => {
    try {
      await waveformRef.current?.togglePlayback();
    } catch (error: unknown) {
      handlePlaybackError(error instanceof Error ? error : new Error(String(error)));
    }
  }, [handlePlaybackError]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.code !== "Space" ||
        event.repeat ||
        !isReady ||
        isInteractiveKeyboardTarget(event.target)
      ) {
        return;
      }

      event.preventDefault();
      void handleTogglePlayback();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleTogglePlayback, isReady]);

  return (
    <section className="player-card active-player" aria-labelledby="track-title">
      <div className="track-heading active-track-heading">
        <p className="eyebrow">Aktiver Titel</p>
        <h1 id="track-title">{track.displayName}</h1>
      </div>

      <figure className="waveform-figure">
        <div className="timeline-stage">
          <AudioWaveform
            onError={handlePlaybackError}
            onLoadingChange={setLoadingProgress}
            onPlayingChange={setIsPlaying}
            onReady={handleReady}
            onRequestMarkerAtTime={handleAddMarkerAtTime}
            onTimeChange={handleTimeChange}
            ref={waveformRef}
            sourceUrl={sourceUrl}
          />
          {isReady ? (
            <MarkerLayer
              duration={duration}
              markers={track.markers}
              onDragStart={handleMarkerDragStart}
              onMove={handleMarkerMove}
              onSelect={handleSelectMarker}
              selectedMarkerId={selectedMarkerId}
            />
          ) : null}
        </div>
        <figcaption>
          {isReady
            ? "Freie Fläche: spulen · Markerpunkt: verschieben · Rechtsklick: neuer Marker."
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

      <div className="player-controls">
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
            aria-keyshortcuts="Space"
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
        <span className="control-divider" aria-hidden="true" />
        <button
          className="add-marker-button"
          disabled={!isReady}
          onClick={handleAddMarker}
          type="button"
        >
          <span aria-hidden="true">＋</span>
          Marker
        </button>
      </div>

      {markerEditor !== null ? (
        <MarkerEditor
          duration={duration}
          initialMarker={markerEditor.marker}
          key={`${markerEditor.mode}-${markerEditor.marker.id}`}
          mode={markerEditor.mode}
          onClose={handleCloseMarkerEditor}
          onDelete={handleDeleteMarker}
          onSave={handleSaveMarker}
        />
      ) : null}
    </section>
  );
}
