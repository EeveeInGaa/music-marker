import { convertFileSrc, invoke } from "@tauri-apps/api/core";
import { open } from "@tauri-apps/plugin-dialog";

export interface SelectedAudioFile {
  displayName: string;
  sourcePath: string;
  sourceUrl: string;
}

export interface AudioFileDialogLabels {
  filterName: string;
  title: string;
}

export class SelectedAudioFileUnavailableError extends Error {}

function getDisplayName(sourcePath: string): string {
  return sourcePath.split(/[\\/]/).at(-1) ?? sourcePath;
}

export async function resolveAudioFile(sourcePath: string): Promise<string | null> {
  const isAvailable = await invoke<boolean>("prepare_audio_file", { sourcePath });
  return isAvailable ? convertFileSrc(sourcePath) : null;
}

export async function selectAudioFile(
  labels: AudioFileDialogLabels,
): Promise<SelectedAudioFile | null> {
  const sourcePath = await open({
    directory: false,
    filters: [
      {
        name: labels.filterName,
        extensions: ["mp3", "m4a", "aac", "wav", "aiff", "aif", "flac", "ogg", "opus"],
      },
    ],
    multiple: false,
    title: labels.title,
  });

  if (sourcePath === null) {
    return null;
  }

  const sourceUrl = await resolveAudioFile(sourcePath);
  if (sourceUrl === null) {
    throw new SelectedAudioFileUnavailableError();
  }

  return {
    displayName: getDisplayName(sourcePath),
    sourcePath,
    sourceUrl,
  };
}
