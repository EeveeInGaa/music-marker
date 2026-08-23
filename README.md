# Audio Marker

Audio Marker is a minimalist, fully local macOS app for playing a single audio track and placing
descriptive markers on its waveform. Local audio files can currently be opened, displayed as a simplified waveform, played back, and annotated
with colored, descriptive markers.

Markers can be created at the current playback position with the Marker button or directly at a
waveform position with a right-click. They can then be moved precisely along the timeline by
dragging the marker point. Marker times are limited to centiseconds. Short marker labels remain
visible and are automatically stacked above or below the waveform when nearby labels would overlap.
Space toggles playback and pause unless a form field or another interactive control is focused.
Tracks, markers, and the last playback position are stored automatically and restored the next time
the app starts.

It was created with the assistance of an AI Agent to test out some AI approaches and to quickly be able to use the app.

## Prerequisites

- Node.js 22 or newer
- pnpm 10 or newer
- Rust stable
- the [Tauri prerequisites for macOS](https://v2.tauri.app/start/prerequisites/)

## Installation

```sh
pnpm install
```

## Development

Start the native desktop app:

```sh
pnpm dev
```

Start only the web frontend in a browser:

```sh
pnpm dev:web
```

The native file picker and access to local audio files are available only in the Tauri app started
with `pnpm dev`.

## Build and Quality Checks

```sh
pnpm format:check  # check formatting
pnpm format        # apply formatting
pnpm lint          # run static analysis
pnpm check         # check formatting and static analysis together
pnpm test          # run domain tests with the Node.js test runner
pnpm typecheck     # run strict TypeScript checks
pnpm build:web     # build the frontend
pnpm build         # build the native Tauri app
```

## Architecture

- `src/components`: small React UI components
- `src/domain`: UI-independent, strictly typed track and marker models
- `src/services`: narrow adapters for native Tauri features such as file selection and persistence
- `src/styles`: global design tokens and app styling
- `src-tauri`: lightweight native Tauri shell

`AudioWaveform` encapsulates the WaveSurfer instance and exposes only a small, typed player
interface to the rest of the React code. The native dialog returns a local path, after which Tauri
makes the selected file available through a temporarily authorized asset URL.

Markers belong to a track as domain data. `MarkerLayer` draws them independently of WaveSurfer as a
thin overlay, while `MarkerEditor` handles editing in a native, non-modal popover. Free waveform
areas therefore remain available for scrubbing. During a drag, the overlay updates only the visual
position of the active marker; the exact, bounded time is committed to track state once when the
pointer is released.

The versioned persisted state stores tracks in an ID-based map and records the ID of the most
recently opened track. The interface still manages exactly one active track and does not display a
library. This allows a recent-tracks list to be added later without adapting the player or UI for
multiple simultaneously loaded tracks. On startup, a narrow native Tauri function verifies the
stored file path and authorizes only that specific audio file for the asset protocol. If the file is
missing, the app remains usable and offers relinking while preserving markers and playback
position.
