import { useCallback, useEffect, useState } from "react";
import { AppShell } from "./components/AppShell";
import { AudioPlayer } from "./components/AudioPlayer";
import { EmptyPlayer } from "./components/EmptyPlayer";
import type { Marker } from "./domain/marker";
import type { Track } from "./domain/track";
import { selectAudioFile } from "./services/audioFiles";

interface ActiveTrackSession {
  sourceUrl: string;
  track: Track;
}

function toFileSelectionError(error: unknown): string {
  const detail = error instanceof Error ? error.message.trim() : String(error).trim();
  return detail.length > 0
    ? `Die Datei konnte nicht geöffnet werden: ${detail}`
    : "Die Datei konnte nicht geöffnet werden.";
}

export function App() {
  const [activeSession, setActiveSession] = useState<ActiveTrackSession | null>(null);
  const [isSelectingFile, setIsSelectingFile] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenFile = useCallback(async () => {
    setIsSelectingFile(true);
    setErrorMessage(null);

    try {
      const selectedFile = await selectAudioFile();
      if (selectedFile === null) {
        return;
      }

      setActiveSession({
        sourceUrl: selectedFile.sourceUrl,
        track: {
          displayName: selectedFile.displayName,
          id: crypto.randomUUID(),
          lastPlaybackPosition: 0,
          markers: [],
          sourcePath: selectedFile.sourcePath,
        },
      });
    } catch (error: unknown) {
      setErrorMessage(toFileSelectionError(error));
    } finally {
      setIsSelectingFile(false);
    }
  }, []);

  const handleMarkersChange = useCallback((markers: Marker[]) => {
    setActiveSession((session) =>
      session === null
        ? null
        : {
            ...session,
            track: { ...session.track, markers },
          },
    );
  }, []);

  useEffect(() => {
    document.title =
      activeSession === null ? "Audio Marker" : `${activeSession.track.displayName} · Audio Marker`;
  }, [activeSession]);

  const statusMessage = isSelectingFile
    ? "Dateiauswahl geöffnet"
    : activeSession === null
      ? "Bereit · alles bleibt lokal"
      : "Titel geladen · alles bleibt lokal";

  return (
    <AppShell
      errorMessage={errorMessage}
      isSelectingFile={isSelectingFile}
      onOpenFile={() => void handleOpenFile()}
      statusMessage={statusMessage}
    >
      {activeSession === null ? (
        <EmptyPlayer isSelectingFile={isSelectingFile} onOpenFile={() => void handleOpenFile()} />
      ) : (
        <AudioPlayer
          key={activeSession.track.id}
          onMarkersChange={handleMarkersChange}
          sourceUrl={activeSession.sourceUrl}
          track={activeSession.track}
        />
      )}
    </AppShell>
  );
}
