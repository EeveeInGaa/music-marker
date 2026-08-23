import { load } from "@tauri-apps/plugin-store";
import { parseTrackLibrary, type TrackLibrary } from "../domain/library";

const STORE_PATH = "audio-marker-state.json";
const LIBRARY_KEY = "track-library";

let storePromise: ReturnType<typeof load> | null = null;
let saveQueue = Promise.resolve();

function getStore() {
  storePromise ??= load(STORE_PATH, { autoSave: 300 });
  return storePromise;
}

export async function loadTrackLibrary(): Promise<TrackLibrary> {
  const store = await getStore();
  const persistedValue = await store.get<unknown>(LIBRARY_KEY);
  return parseTrackLibrary(persistedValue);
}

export function saveTrackLibrary(library: TrackLibrary): Promise<void> {
  saveQueue = saveQueue
    .catch(() => undefined)
    .then(async () => {
      const store = await getStore();
      await store.set(LIBRARY_KEY, library);
    });

  return saveQueue;
}
