import { convertFileSrc } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

export interface SelectedAudioFile {
  displayName: string;
  sourcePath: string;
  sourceUrl: string;
}

function getDisplayName(sourcePath: string): string {
  return sourcePath.split(/[\\/]/).at(-1) ?? sourcePath;
}

export async function selectAudioFile(): Promise<SelectedAudioFile | null> {
  const sourcePath = await open({
    directory: false,
    filters: [
      {
        name: "Audiodateien",
        extensions: ["mp3", "m4a", "aac", "wav", "aiff", "aif", "flac", "ogg", "opus"],
      },
    ],
    multiple: false,
    title: "Audiotitel öffnen",
  });

  if (sourcePath === null) {
    return null;
  }

  return {
    displayName: getDisplayName(sourcePath),
    sourcePath,
    sourceUrl: convertFileSrc(sourcePath),
  };
}
