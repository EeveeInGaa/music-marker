import { useI18n } from "../i18n/i18n";
import { TruncatedLinesIcon, WrappedLinesIcon } from "./icons";

export type MarkerLabelDisplayMode = "show-all" | "truncate";

interface MarkerLabelDisplaySwitcherProps {
  mode: MarkerLabelDisplayMode;
  onChange: (mode: MarkerLabelDisplayMode) => void;
}

const displayOptions: readonly MarkerLabelDisplayMode[] = ["truncate", "show-all"];

export function MarkerLabelDisplaySwitcher({ mode, onChange }: MarkerLabelDisplaySwitcherProps) {
  const { t } = useI18n();

  return (
    <fieldset className="compact-switcher marker-label-display-switcher">
      <legend className="visually-hidden">{t("markerLabelDisplay.switcherLabel")}</legend>
      {displayOptions.map((option) => {
        const showsAll = option === "show-all";
        const fullLabel = t(
          showsAll ? "markerLabelDisplay.showAll" : "markerLabelDisplay.truncate",
        );

        return (
          <label key={option} title={fullLabel}>
            <input
              checked={mode === option}
              name="marker-label-display"
              onChange={() => onChange(option)}
              type="radio"
              value={option}
            />
            <span>
              {showsAll ? <WrappedLinesIcon /> : <TruncatedLinesIcon />}
              <span className="visually-hidden">{fullLabel}</span>
            </span>
          </label>
        );
      })}
    </fieldset>
  );
}
