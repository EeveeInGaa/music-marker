# Audio Marker — Agent Working Agreement

## Scope

This file applies to the entire repository. It documents the product goal, current implementation
status, architectural constraints, and expected workflow. Newer explicit user instructions take
precedence. Before making changes, always inspect the current code and Git status; this file is a
handoff document, not a substitute for the actual implementation.

## Product Goal

Audio Marker is a small, fully local macOS desktop app for playing exactly one active audio track
and annotating its waveform with colored markers.

The app should feel like a calm native macOS utility:

- minimalist, modern, and unobtrusive
- generous whitespace and clear hierarchy
- the waveform as the central visual element
- no DAW or audio-editor appearance
- Light and Dark Mode through `prefers-color-scheme`
- conceptually closer to QuickTime Player or Apple's audio preview than to Logic Pro

The app is explicitly not an audio editor. The following are out of scope:

- cutting or manipulating audio
- effects, mixing, or audio export
- multiple simultaneously loaded tracks
- accounts, cloud synchronization, or a backend
- a database such as SQLite without a demonstrated need

## Tech Stack

Keep the stack intentionally small:

- Tauri 2
- React
- TypeScript with strict configuration
- Vite
- pnpm without a workspace
- wavesurfer.js for playback and waveform rendering
- Biome as the only formatter and static-analysis tool

Do not introduce additional formatters or linters such as Prettier or ESLint. Do not add a state
library such as Redux while React state and composition remain sufficient. Add dependencies only
when they solve a concrete technical need.

Current commands:

```sh
pnpm dev           # develop the native Tauri app
pnpm dev:web       # run only the Vite frontend
pnpm format:check  # check formatting
pnpm format        # apply formatting
pnpm lint          # run static analysis
pnpm check         # run Biome formatting and analysis checks
pnpm test          # run domain tests
pnpm typecheck     # run strict TypeScript checks
pnpm build:web     # build the frontend
pnpm build         # build the native macOS app bundle
```

## Current Implementation Status

Stages 1 through 5 are complete. Several focused improvements have also been implemented. The app
currently supports:

- opening a local audio file through a native file picker
- loading MP3, M4A, AAC, WAV, AIFF, FLAC, OGG, and Opus files
- displaying a simplified waveform with a visible playhead
- playback, pause, and scrubbing through the waveform
- displaying current playback position and total duration
- toggling play/pause with Space unless an interactive form control is active
- creating a marker at the current playback position through the Marker button
- creating a marker at a waveform position through right-click or Control-click
- editing marker color, description, and `top` or `bottom` placement
- selecting, deleting, and horizontally dragging markers
- limiting marker times to two decimal places when creating, editing, and dragging
- displaying marker labels permanently
- automatically stacking overlapping marker labels into separate lanes
- automatically storing tracks, markers, and the last playback position locally
- restoring the last active track when the app starts
- handling a missing or moved audio file safely and allowing it to be relinked

Important later correction to the original plan:

- The visible ±5-second controls were removed at the user's request.
- The related `seekBy` interface was removed as well.
- Do not reintroduce ±5-second behavior or ArrowLeft/ArrowRight seeking without renewed explicit
  user approval.

## Not Yet Implemented

- loop range and looped playback
- persistence of a loop range
- Escape behavior for an active selection, popover, or loop mode
- a visible recently used tracks list
- switching between multiple stored tracks
- a library view
- colored annotation ranges/areas

Colored annotation areas have only been discussed at a feasibility level. Their implementation has
not been authorized. If requested later, model them as a separate domain type rather than as markers
with an optional `endTime`. A possible `AreaLayer` should be a separate layer between the waveform
and marker layer. Overlap behavior, dragging, resize handles, and separation from the loop range must
be defined deliberately before implementation.

## Architecture

Preserve the existing separation of concerns:

- `src/components`: small React components and thin interaction logic
- `src/domain`: UI-independent models and pure functions
- `src/services`: narrow adapters for Tauri file selection and persistence
- `src/styles`: global design tokens and app styling
- `src-tauri`: native shell, plugins, and narrowly scoped native file access

### App and Track State

`App.tsx` owns:

- the persistable `TrackLibrary`
- a transient active session containing a track ID and asset URL
- restore, file-selection, and error state

The active session does not duplicate track domain data. The active track is selected from the
library by ID. The UI continues to display exactly one track even though the persisted model can
already hold multiple track records.

### Data Model

The core marker model is:

```ts
type MarkerPosition = "top" | "bottom";

interface Marker {
  id: string;
  time: number;
  position: MarkerPosition;
  color: string;
  description: string;
}
```

A `Track` currently contains:

```ts
interface Track {
  id: string;
  sourcePath: string;
  displayName: string;
  markers: Marker[];
  lastPlaybackPosition: number;
}
```

The persisted `TrackLibrary` is versioned and contains:

```ts
interface TrackLibrary {
  schemaVersion: 1;
  tracksById: Record<string, Track>;
  lastOpenedTrackId: string | null;
}
```

Treat persisted JSON as `unknown` and validate it at runtime in `src/domain/library.ts`. Future model
changes must include either a backward-compatible migration or a deliberate schema-version change.
Never silently discard existing user data.

### Audio and Waveform

`AudioWaveform` encapsulates the WaveSurfer instance. Other components must not depend directly on
the WaveSurfer API. Extend the wrapper interface only with operations that are actually required.

The waveform manages exactly one active audio source. Scrubbing on free waveform space must remain
available. Marker interactions, or future area interactions, must not unnecessarily block normal
scrubbing.

### Markers

`MarkerLayer` is a custom overlay above WaveSurfer. During dragging, it updates CSS imperatively via
`requestAnimationFrame` and commits to track state only once when the pointer is released. Preserve
this performance behavior.

Marker labels are permanently visible. `assignMarkerLabelLanes` calculates separate lanes for top
and bottom markers. `MarkerLayer` measures the actual label widths and responds to layout changes
with `ResizeObserver`. Colliding top labels move upward; colliding bottom labels move downward. This
calculation must not produce a sequence of React renders during marker dragging.

Marker times are limited to centiseconds through pure functions in `src/domain/time.ts`. This limit
applies to stored values and dragging, not only to formatted display text.

The right-click interaction is intentionally implemented with a specific event sequence:

- secondary `pointerdown` blocks WaveSurfer scrubbing and native text selection
- the marker editor opens only on the matching `pointerup`
- `contextmenu` only suppresses the native context menu

Do not open the editor during `pointerdown`. On macOS, the following pointer-up can otherwise be
interpreted as light-dismiss outside the newly opened popover, causing it to close immediately.

### Persistence and Tauri

Persistence uses `@tauri-apps/plugin-store` with a versioned JSON structure in the local app data
directory. Changes are saved automatically and serially; there is no Save button.

During restoration, the Rust command `prepare_audio_file` verifies that the file exists and has a
supported audio extension. Only that specific file is then reauthorized for the Tauri asset
protocol. Do not add a broadly authorized filesystem plugin while this narrow solution remains
sufficient.

If a file is missing:

- do not crash
- display a clear state
- allow the user to select a different track normally
- support relinking while preserving markers and playback position

## React and TypeScript Rules

- Never use `any`; use `unknown` and type guards for external or persisted values.
- Keep components small and keep domain logic out of JSX.
- Separate UI state from persistable domain data.
- Do not create unnecessary context providers, generic repository layers, or service abstractions.
- Prefer composition and local state.
- Keep callback identities around `AudioWaveform` stable so normal track updates do not recreate
  WaveSurfer.
- Throttle or handle high-frequency audio and pointer events imperatively.
- Cover pure time, marker, sorting, layout, and future loop functions with domain tests.

## UI and Accessibility Rules

- Prefer native semantic elements.
- Every button needs a clear accessible name.
- Focus states must remain visible.
- Marker color must never be the only source of information.
- Long file names and marker descriptions must not break the layout.
- Inputs and textareas must prevent global shortcuts from firing during text entry.
- The playhead, markers, and future loop or area visuals must remain visually distinguishable.
- Do not place permanently large description text above the waveform. Short labels may remain
  visible; full editing belongs in the marker popover.
- Maintain Light and Dark Mode together.

## Planned Next Work

Never start a new stage without explicit user approval.

The originally planned Stage 6 covers loop behavior and keyboard shortcuts. Because of later user
decisions, a future implementation should follow these updated requirements:

- implement a simple loop mode with start, end, visual highlighting, and repeated playback
- optionally persist the loop range per track
- Space for play/pause already exists
- Escape behavior for an active selection, popover, or loop mode remains open
- ArrowLeft/ArrowRight and ±5-second seeking are no longer automatic requirements

Stage 7 remains a review and polish stage only:

- visual calm and consistent spacing
- hover, focus, and selected states
- keyboard operation and ARIA
- error and empty states
- long file names and many tightly spaced markers
- very short and long audio files
- Light and Dark Mode
- performance and unnecessary renders
- removal of unnecessary code and dependencies
- no new features without a request

## Workflow and Quality Gates

For staged work:

1. Work only on the explicitly approved stage or focused improvement.
2. Respect existing user changes and a potentially dirty worktree.
3. Do not create commits unless the user explicitly asks for one.
4. Update the README when behavior, architecture, or setup changes.
5. After implementation, run at minimum:

```sh
pnpm check
pnpm typecheck
pnpm test
```

For frontend or integration changes, also run:

```sh
pnpm build:web
```

For Rust or Tauri changes, also run:

```sh
cargo fmt --manifest-path src-tauri/Cargo.toml -- --check
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets --all-features -- -D warnings
pnpm build
```

When relevant, verify native interactions such as the file picker, restoration, waveform pointer
behavior, and popovers in the built macOS app. Do not leave test data in the user's persisted app
state.

After every stage or completed focused improvement:

- briefly summarize what was implemented
- mention relevant architectural decisions
- list the checks that were run
- suggest an appropriate Conventional Commit message
- stop and wait for approval

