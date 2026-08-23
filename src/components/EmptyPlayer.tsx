import type { CSSProperties } from "react";
import { FolderIcon, PlayIcon } from "./icons";

const waveformBars = [
  ["bar-01", 18],
  ["bar-02", 30],
  ["bar-03", 22],
  ["bar-04", 42],
  ["bar-05", 58],
  ["bar-06", 78],
  ["bar-07", 64],
  ["bar-08", 38],
  ["bar-09", 28],
  ["bar-10", 48],
  ["bar-11", 66],
  ["bar-12", 86],
  ["bar-13", 72],
  ["bar-14", 45],
  ["bar-15", 26],
  ["bar-16", 36],
  ["bar-17", 60],
  ["bar-18", 74],
  ["bar-19", 54],
  ["bar-20", 32],
  ["bar-21", 24],
  ["bar-22", 44],
  ["bar-23", 68],
  ["bar-24", 80],
  ["bar-25", 62],
  ["bar-26", 40],
  ["bar-27", 20],
] as const;

interface EmptyPlayerProps {
  isSelectingFile: boolean;
  missingDisplayName: string | undefined;
  mode: "empty" | "missing" | "restoring";
  onOpenFile: () => void;
}

export function EmptyPlayer({
  isSelectingFile,
  missingDisplayName,
  mode,
  onOpenFile,
}: EmptyPlayerProps) {
  const isMissing = mode === "missing";
  const isRestoring = mode === "restoring";

  return (
    <section className="player-card empty-player" aria-labelledby="empty-player-title">
      <div className="track-heading">
        <p className="eyebrow">
          {isRestoring ? "Lokaler Zustand" : isMissing ? "Datei fehlt" : "Lokaler Audioplayer"}
        </p>
        <h1 id="empty-player-title">
          {isRestoring
            ? "Letzter Titel wird geladen"
            : isMissing
              ? "Audiodatei nicht gefunden"
              : "Kein Titel geöffnet"}
        </h1>
        <p className="empty-copy">
          {isRestoring
            ? "Marker und Wiedergabeposition werden lokal wiederhergestellt."
            : isMissing
              ? `${missingDisplayName ?? "Der zuletzt geöffnete Titel"} wurde verschoben oder gelöscht. Ordne die Datei neu zu oder öffne oben einen anderen Titel.`
              : "Öffne eine Audiodatei, um ihre Waveform hier anzuzeigen."}
        </p>
      </div>

      <div className="waveform-preview" aria-hidden="true">
        <div className="waveform-bars">
          {waveformBars.map(([id, height]) => (
            <span
              className="waveform-bar"
              key={id}
              style={{ "--bar-height": `${height}%` } as CSSProperties}
            />
          ))}
        </div>
        <span className="timeline" />
      </div>

      <div className="transport-preview" aria-hidden="true">
        <span>−5</span>
        <span className="play-preview">
          <PlayIcon />
        </span>
        <span>+5</span>
      </div>

      <button
        className="open-button empty-open-button"
        disabled={isSelectingFile}
        onClick={onOpenFile}
        type="button"
      >
        <FolderIcon />
        <span>
          {isRestoring
            ? "Zustand wird geladen …"
            : isSelectingFile
              ? "Datei wird geöffnet …"
              : isMissing
                ? "Datei neu zuordnen"
                : "Audiodatei öffnen"}
        </span>
      </button>
    </section>
  );
}
