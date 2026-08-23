import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import de from "./translations/de.json";
import en from "./translations/en.json";

export type Language = "de" | "en";
type NestedTranslationKey<T> = {
  [Key in keyof T & string]: T[Key] extends string
    ? Key
    : T[Key] extends object
      ? `${Key}.${NestedTranslationKey<T[Key]>}`
      : never;
}[keyof T & string];

export type TranslationKey = NestedTranslationKey<typeof en>;
export type Translator = (
  key: TranslationKey,
  values?: Readonly<Record<string, number | string>>,
) => string;

interface I18nContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: Translator;
}

interface I18nProviderProps {
  children: ReactNode;
  initialLanguage: Language;
}

const LANGUAGE_STORAGE_KEY = "audio-marker-language";
const dictionaries = { de, en } satisfies Record<Language, typeof en>;
const I18nContext = createContext<I18nContextValue | null>(null);

function getTranslation(dictionary: typeof en, key: TranslationKey): string {
  let value: unknown = dictionary;

  for (const segment of key.split(".")) {
    if (typeof value !== "object" || value === null) {
      throw new Error(`Missing translation: ${key}`);
    }

    value = (value as Record<string, unknown>)[segment];
  }

  if (typeof value !== "string") {
    throw new Error(`Missing translation: ${key}`);
  }

  return value;
}

function interpolate(
  template: string,
  values: Readonly<Record<string, number | string>> | undefined,
): string {
  return template.replaceAll(/\{([A-Za-z]+)\}/g, (placeholder, name: string) => {
    const value = values?.[name];
    return value === undefined ? placeholder : String(value);
  });
}

export function getInitialLanguage(): Language {
  try {
    const storedLanguage = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
    return storedLanguage === "de" || storedLanguage === "en" ? storedLanguage : "en";
  } catch {
    return "en";
  }
}

export function I18nProvider({ children, initialLanguage }: I18nProviderProps) {
  const [language, setLanguage] = useState<Language>(initialLanguage);
  const t = useCallback<Translator>(
    (key, values) => interpolate(getTranslation(dictionaries[language], key), values),
    [language],
  );

  useEffect(() => {
    document.documentElement.lang = language;
    try {
      window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    } catch {
      // The language still changes for this session if storage is unavailable.
    }
  }, [language]);

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const value = useContext(I18nContext);
  if (value === null) {
    throw new Error("useI18n must be used inside I18nProvider.");
  }

  return value;
}
