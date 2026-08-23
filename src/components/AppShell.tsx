import type { CSSProperties } from "react";

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

export function AppShell() {
  return (
    <div className="app-shell">
      <header className="titlebar">
        <p className="app-name">Audio Marker</p>
        <span className="stage-badge">Grundlage</span>
      </header>

      <main className="workspace">
        <section className="empty-player" aria-labelledby="empty-player-title">
          <div className="track-heading">
            <p className="eyebrow">Lokaler Audioplayer</p>
            <h1 id="empty-player-title">Kein Titel geöffnet</h1>
            <p className="empty-copy">
              Hier entsteht eine ruhige Arbeitsfläche für Audio und präzise Marker.
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
            <span>−5</span>
            <span className="play-preview">
              <svg aria-hidden="true" viewBox="0 0 16 16" focusable="false">
                <path d="M4.75 3.1v9.8L12.5 8 4.75 3.1Z" />
              </svg>
            </span>
            <span>+5</span>
          </div>

          <p className="stage-note">Audio öffnen und wiedergeben folgt in Stage 2.</p>
        </section>
      </main>

      <footer className="statusbar">
        <span className="status-dot" aria-hidden="true" />
        <span>Bereit · alles bleibt lokal</span>
      </footer>
    </div>
  );
}
