# Audio Marker

Audio Marker ist eine minimalistische, vollständig lokale macOS-App zum Abspielen eines
Audiotitels und zum Setzen beschreibender Marker auf dessen Waveform. Das Projekt wird in klar
abgegrenzten Stages entwickelt. Aktuell können einzelne lokale Audiodateien geöffnet und über
eine vereinfachte Waveform wiedergegeben sowie mit farbigen, beschreibenden Markern versehen
werden.

Marker können über den Marker-Button an der Wiedergabeposition oder per Rechtsklick direkt auf der
Waveform angelegt und anschließend am Markerpunkt präzise entlang der Timeline verschoben werden.
Die Leertaste schaltet Wiedergabe und Pause um, solange kein Formularfeld oder anderer interaktiver
Control fokussiert ist. Titel, Marker und die letzte Wiedergabeposition werden automatisch lokal
gespeichert und beim nächsten App-Start wiederhergestellt.

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
- `src/domain`: UI-unabhängige, strikt typisierte Track- und Marker-Modelle
- `src/services`: schmale Adapter für native Tauri-Funktionen wie Dateiauswahl und Persistenz
- `src/styles`: globale Design-Tokens und App-Styling
- `src-tauri`: schlanke native Tauri-Hülle

`AudioWaveform` kapselt die WaveSurfer-Instanz und stellt dem restlichen React-Code nur eine kleine,
typisierte Player-Schnittstelle bereit. Der native Dialog liefert den lokalen Pfad; Tauri stellt
die ausgewählte Datei anschließend über einen temporär freigegebenen Asset-URL bereit.

Marker gehören als Domain-Daten zum Track. `MarkerLayer` zeichnet sie unabhängig von WaveSurfer als
schmales Overlay, während `MarkerEditor` die Bearbeitung in einem nativen, nicht-modalen Popover
kapselt. Freie Bereiche der Waveform bleiben dadurch für Scrubbing erreichbar. Während eines Drags
aktualisiert das Overlay nur die Darstellung des aktiven Markers; der Track-State wird erst beim
Loslassen einmalig mit dem exakten, begrenzten Zeitpunkt aktualisiert.

Der persistierte, versionierte Zustand speichert Tracks in einer ID-basierten Map und merkt sich die
ID des zuletzt geöffneten Titels. Die Oberfläche verwaltet weiterhin genau einen aktiven Titel und
zeigt keine Bibliothek. So kann später eine Liste zuletzt verwendeter Titel ergänzt werden, ohne
Player oder UI auf mehrere gleichzeitig geladene Tracks auszurichten. Beim Start prüft eine schmale
native Tauri-Funktion den gespeicherten Dateipfad und gibt nur die konkrete Audiodatei erneut für das
Asset-Protokoll frei. Fehlt sie, bleibt die App bedienbar und bietet eine Neuzuordnung an, bei der
Marker und Wiedergabeposition erhalten bleiben.
