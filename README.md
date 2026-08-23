# Audio Marker

Audio Marker ist eine minimalistische, vollständig lokale macOS-App zum Abspielen eines
Audiotitels und zum Setzen beschreibender Marker auf dessen Waveform. Das Projekt wird in klar
abgegrenzten Stages entwickelt. Aktuell können einzelne lokale Audiodateien geöffnet und über
eine vereinfachte Waveform wiedergegeben werden.

## Voraussetzungen

- Node.js 22 oder neuer
- pnpm 10 oder neuer
- Rust (stable)
- die [Tauri-Voraussetzungen für macOS](https://v2.tauri.app/start/prerequisites/)

## Installation

```sh
pnpm install
```

## Entwicklung

Die native Desktop-App starten:

```sh
pnpm dev
```

Nur das Web-Frontend im Browser starten:

```sh
pnpm dev:web
```

Der native Dateidialog und der Zugriff auf lokale Audiodateien stehen nur in der mit `pnpm dev`
gestarteten Tauri-App zur Verfügung.

## Build und Qualitätschecks

```sh
pnpm format:check  # Formatierung prüfen
pnpm format        # Formatierung anwenden
pnpm lint          # statische Analyse
pnpm check         # Formatierung und statische Analyse gemeinsam
pnpm test          # Domain-Tests mit dem Node-Test-Runner
pnpm typecheck     # strikter TypeScript-Check
pnpm build:web     # Frontend bauen
pnpm build         # native Tauri-App bauen
```

Biome ist die zentrale Lösung für Formatierung und statische Analyse. ESLint und Prettier werden
nicht parallel eingesetzt.

## Architektur

- `src/components`: kleine React-UI-Komponenten
- `src/domain`: UI-unabhängige, strikt typisierte Track- und später Marker-Modelle
- `src/services`: schmale Adapter für native Tauri-Funktionen wie die Dateiauswahl
- `src/styles`: globale Design-Tokens und App-Styling
- `src-tauri`: schlanke native Tauri-Hülle

`AudioWaveform` kapselt die WaveSurfer-Instanz und stellt dem restlichen React-Code nur eine kleine,
typisierte Player-Schnittstelle bereit. Der native Dialog liefert den lokalen Pfad; Tauri stellt
die ausgewählte Datei anschließend über einen temporär freigegebenen Asset-URL bereit.

Aktuell verwaltet die App genau einen aktiven Titel. Die Auswahl wird über eine Track-ID modelliert,
sodass später eine Liste zuletzt verwendeter Titel ergänzt werden kann, ohne Player oder UI auf
mehrere gleichzeitig geladene Tracks auszurichten. Marker und Persistenz folgen in späteren Stages.
