import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { getInitialLanguage, I18nProvider } from "./i18n/i18n";
import "./styles/global.css";

const rootElement = document.getElementById("root");

if (rootElement === null) {
  throw new Error("Root element was not found.");
}

const initialLanguage = getInitialLanguage();
document.documentElement.lang = initialLanguage;

createRoot(rootElement).render(
  <StrictMode>
    <I18nProvider initialLanguage={initialLanguage}>
      <App />
    </I18nProvider>
  </StrictMode>,
);
