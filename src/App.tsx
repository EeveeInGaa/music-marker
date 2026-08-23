import { useCallback, useEffect, useRef, useState } from "react";
import { AppShell } from "./components/AppShell";
import { AudioPlayer } from "./components/AudioPlayer";
import { EmptyPlayer } from "./components/EmptyPlayer";
import {
  createEmptyLibrary,
  findTrackBySourcePath,
  type TrackLibrary,
  upsertTrack,
} from "./domain/library";
import type { Marker } from "./domain/marker";
import type { Track, TrackId } from "./domain/track";
import { type TranslationKey, useI18n } from "./i18n/i18n";
import {
  resolveAudioFile,
  SelectedAudioFileUnavailableError,
  selectAudioFile,
} from "./services/audioFiles";
import { loadTrackLibrary, saveTrackLibrary } from "./services/persistence";

interface ActiveTrackSession {
  sourceUrl: string;
  trackId: TrackId;
}

type RestoreStatus = "loading" | "ready";

interface LocalizedError {
  key: TranslationKey;
  values?: Readonly<Record<string, string>>;
}

function toLocalizedError(
  error: unknown,
  fallbackKey: TranslationKey,
  detailKey: TranslationKey,
): LocalizedError {
  const detail = error instanceof Error ? error.message.trim() : String(error).trim();
  return detail.length > 0 ? { key: detailKey, values: { detail } } : { key: fallbackKey };
}

export function App() {
  const { t } = useI18n();
  const [library, setLibrary] = useState<TrackLibrary>(createEmptyLibrary);
  const libraryRef = useRef(library);
  const [activeSession, setActiveSession] = useState<ActiveTrackSession | null>(null);
  const [missingTrackId, setMissingTrackId] = useState<TrackId | null>(null);
  const [restoreStatus, setRestoreStatus] = useState<RestoreStatus>("loading");
  const [isSelectingFile, setIsSelectingFile] = useState(false);
  const [operationError, setOperationError] = useState<LocalizedError | null>(null);
  const [persistenceError, setPersistenceError] = useState<LocalizedError | null>(null);

  const commitLibrary = useCallback((nextLibrary: TrackLibrary) => {
    libraryRef.current = nextLibrary;
    setLibrary(nextLibrary);
  }, []);

  useEffect(() => {
    let isCurrent = true;

    const restore = async () => {
      try {
        const persistedLibrary = await loadTrackLibrary();
        if (!isCurrent) {
          return;
        }

        commitLibrary(persistedLibrary);
        const lastOpenedTrack =
          persistedLibrary.lastOpenedTrackId === null
            ? null
            : (persistedLibrary.tracksById[persistedLibrary.lastOpenedTrackId] ?? null);

        if (lastOpenedTrack === null) {
          return;
        }

        const sourceUrl = await resolveAudioFile(lastOpenedTrack.sourcePath);
        if (!isCurrent) {
          return;
        }

        if (sourceUrl === null) {
          setMissingTrackId(lastOpenedTrack.id);
          return;
        }

        setActiveSession({ sourceUrl, trackId: lastOpenedTrack.id });
      } catch (error: unknown) {
        if (isCurrent) {
          setOperationError(toLocalizedError(error, "error.restore", "error.restoreWithDetail"));
        }
      } finally {
        if (isCurrent) {
          setRestoreStatus("ready");
        }
      }
    };

    void restore();
    return () => {
      isCurrent = false;
    };
  }, [commitLibrary]);

  useEffect(() => {
    if (restoreStatus !== "ready") {
      return;
    }

    let isCurrent = true;
    void saveTrackLibrary(library)
      .then(() => {
        if (isCurrent) {
          setPersistenceError(null);
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setPersistenceError(
            toLocalizedError(error, "error.persistence", "error.persistenceWithDetail"),
          );
        }
      });

    return () => {
      isCurrent = false;
    };
  }, [library, restoreStatus]);

  const handleOpenFile = useCallback(async () => {
    setIsSelectingFile(true);
    setOperationError(null);

    try {
      const selectedFile = await selectAudioFile({
        filterName: t("fileDialog.audioFiles"),
        title: t("fileDialog.openTrack"),
      });
      if (selectedFile === null) {
        return;
      }

      const currentLibrary = libraryRef.current;
      const existingTrack = findTrackBySourcePath(currentLibrary, selectedFile.sourcePath);
      const track: Track = existingTrack ?? {
        displayName: selectedFile.displayName,
        id: crypto.randomUUID(),
        lastPlaybackPosition: 0,
        markers: [],
        sourcePath: selectedFile.sourcePath,
      };

      commitLibrary(upsertTrack(currentLibrary, track));
      setMissingTrackId(null);
      setActiveSession({ sourceUrl: selectedFile.sourceUrl, trackId: track.id });
    } catch (error: unknown) {
      setOperationError(
        error instanceof SelectedAudioFileUnavailableError
          ? { key: "error.selectedFileUnavailable" }
          : toLocalizedError(error, "error.fileOpen", "error.fileOpenWithDetail"),
      );
    } finally {
      setIsSelectingFile(false);
    }
  }, [commitLibrary, t]);

  const handleRelinkFile = useCallback(async () => {
    const trackId = missingTrackId;
    if (trackId === null) {
      return;
    }

    setIsSelectingFile(true);
    setOperationError(null);

    try {
      const selectedFile = await selectAudioFile({
        filterName: t("fileDialog.audioFiles"),
        title: t("fileDialog.openTrack"),
      });
      if (selectedFile === null) {
        return;
      }

      const currentLibrary = libraryRef.current;
      const missingTrack = currentLibrary.tracksById[trackId];
      if (missingTrack === undefined) {
        return;
      }

      const relinkedTrack: Track = {
        ...missingTrack,
        displayName: selectedFile.displayName,
        sourcePath: selectedFile.sourcePath,
      };
      commitLibrary(upsertTrack(currentLibrary, relinkedTrack));
      setMissingTrackId(null);
      setActiveSession({ sourceUrl: selectedFile.sourceUrl, trackId: relinkedTrack.id });
    } catch (error: unknown) {
      setOperationError(
        error instanceof SelectedAudioFileUnavailableError
          ? { key: "error.selectedFileUnavailable" }
          : toLocalizedError(error, "error.fileOpen", "error.fileOpenWithDetail"),
      );
    } finally {
      setIsSelectingFile(false);
    }
  }, [commitLibrary, missingTrackId, t]);

  const updateActiveTrack = useCallback(
    (update: (track: Track) => Track) => {
      const session = activeSession;
      if (session === null) {
        return;
      }

      const currentLibrary = libraryRef.current;
      const currentTrack = currentLibrary.tracksById[session.trackId];
      if (currentTrack === undefined) {
        return;
      }

      const nextTrack = update(currentTrack);
      if (nextTrack !== currentTrack) {
        commitLibrary(upsertTrack(currentLibrary, nextTrack));
      }
    },
    [activeSession, commitLibrary],
  );

  const handleMarkersChange = useCallback(
    (markers: Marker[]) => {
      updateActiveTrack((track) => ({ ...track, markers }));
    },
    [updateActiveTrack],
  );

  const handlePlaybackPositionChange = useCallback(
    (lastPlaybackPosition: number) => {
      updateActiveTrack((track) =>
        track.lastPlaybackPosition === lastPlaybackPosition
          ? track
          : { ...track, lastPlaybackPosition },
      );
    },
    [updateActiveTrack],
  );

  const activeTrack =
    activeSession === null ? null : (library.tracksById[activeSession.trackId] ?? null);
  const missingTrack =
    missingTrackId === null ? null : (library.tracksById[missingTrackId] ?? null);

  useEffect(() => {
    document.title =
      activeTrack === null ? "Audio Marker" : `${activeTrack.displayName} · Audio Marker`;
  }, [activeTrack]);

  const isRestoring = restoreStatus === "loading";
  const isBusy = isSelectingFile || isRestoring;
  const statusMessage = isRestoring
    ? t("status.restoring")
    : isSelectingFile
      ? t("status.selectingFile")
      : activeTrack !== null
        ? t("status.trackLoaded")
        : missingTrack !== null
          ? t("status.missingTrack")
          : t("status.ready");
  const visibleError = operationError ?? persistenceError;

  return (
    <AppShell
      errorMessage={visibleError === null ? null : t(visibleError.key, visibleError.values)}
      isSelectingFile={isBusy}
      onOpenFile={() => void handleOpenFile()}
      statusMessage={statusMessage}
    >
      {activeSession !== null && activeTrack !== null ? (
        <AudioPlayer
          key={activeTrack.id}
          onMarkersChange={handleMarkersChange}
          onPlaybackPositionChange={handlePlaybackPositionChange}
          sourceUrl={activeSession.sourceUrl}
          track={activeTrack}
        />
      ) : (
        <EmptyPlayer
          isSelectingFile={isBusy}
          missingDisplayName={missingTrack?.displayName}
          mode={isRestoring ? "restoring" : missingTrack === null ? "empty" : "missing"}
          onOpenFile={() => void (missingTrack === null ? handleOpenFile() : handleRelinkFile())}
        />
      )}
    </AppShell>
  );
}
