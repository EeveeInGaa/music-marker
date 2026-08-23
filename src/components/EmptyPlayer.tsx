import type { CSSProperties } from "react";
import { useI18n } from "../i18n/i18n";
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
  const { t } = useI18n();
  const isMissing = mode === "missing";
  const isRestoring = mode === "restoring";

  return (
    <section className="player-card empty-player" aria-labelledby="empty-player-title">
      <div className="track-heading">
        <p className="eyebrow">
          {t(
            isRestoring
              ? "empty.localState"
              : isMissing
                ? "empty.fileMissing"
                : "empty.localPlayer",
          )}
        </p>
        <h1 id="empty-player-title">
          {t(
            isRestoring ? "empty.restoringTitle" : isMissing ? "empty.missingTitle" : "empty.title",
          )}
        </h1>
        <p className="empty-copy">
          {isRestoring
            ? t("empty.restoringCopy")
            : isMissing
              ? t("empty.missingCopy", {
                  displayName: missingDisplayName ?? t("empty.missingTrackFallback"),
                })
              : t("empty.copy")}
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
        <span className="play-preview">
          <PlayIcon />
        </span>
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
            ? t("empty.restoringButton")
            : isSelectingFile
              ? t("empty.openingButton")
              : isMissing
                ? t("empty.relinkButton")
                : t("empty.openButton")}
        </span>
      </button>
    </section>
  );
}
