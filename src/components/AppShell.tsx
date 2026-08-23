import type { ReactNode } from "react";
import { useI18n } from "../i18n/i18n";
import { FolderIcon } from "./icons";
import { LanguageSwitcher } from "./LanguageSwitcher";

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
  const { t } = useI18n();

  return (
    <div className="app-shell">
      <header className="titlebar">
        <p className="app-name">Audio Marker</p>
        <div className="titlebar-actions">
          <LanguageSwitcher />
          <button
            className="open-button open-button-compact"
            disabled={isSelectingFile}
            onClick={onOpenFile}
            type="button"
          >
            <FolderIcon />
            <span>{t(isSelectingFile ? "header.opening" : "header.openAudio")}</span>
          </button>
        </div>
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
