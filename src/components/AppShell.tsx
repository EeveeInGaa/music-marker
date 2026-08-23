import type { ReactNode } from "react";
import { FolderIcon } from "./icons";

interface AppShellProps {
  children: ReactNode;
  errorMessage: string | null;
  isSelectingFile: boolean;
  onOpenFile: () => void;
  statusMessage: string;
}

export function AppShell({
  children,
  errorMessage,
  isSelectingFile,
  onOpenFile,
  statusMessage,
}: AppShellProps) {
  return (
    <div className="app-shell">
      <header className="titlebar">
        <p className="app-name">Audio Marker</p>
        <button
          className="open-button open-button-compact"
          disabled={isSelectingFile}
          onClick={onOpenFile}
          type="button"
        >
          <FolderIcon />
          <span>{isSelectingFile ? "Wird geöffnet …" : "Audio öffnen"}</span>
        </button>
      </header>

      <main className="workspace">
        {errorMessage !== null ? (
          <p className="error-banner" role="alert">
            {errorMessage}
          </p>
        ) : null}
        {children}
      </main>

      <footer className="statusbar">
        <span className="status-dot" aria-hidden="true" />
        <span>{statusMessage}</span>
      </footer>
    </div>
  );
}
