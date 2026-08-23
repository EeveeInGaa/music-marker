import { type Language, useI18n } from "../i18n/i18n";

const languageOptions: readonly Language[] = ["en", "de"];

export function LanguageSwitcher() {
  const { language, setLanguage, t } = useI18n();

  return (
    <fieldset className="language-switcher">
      <legend className="visually-hidden">{t("language.switcherLabel")}</legend>
      {languageOptions.map((option) => {
        const isEnglish = option === "en";
        const fullLabel = t(isEnglish ? "language.english" : "language.german");

        return (
          <label key={option} title={fullLabel}>
            <input
              checked={language === option}
              name="app-language"
              onChange={() => setLanguage(option)}
              type="radio"
              value={option}
            />
            <span>{t(isEnglish ? "language.englishShort" : "language.germanShort")}</span>
          </label>
        );
      })}
    </fieldset>
  );
}
