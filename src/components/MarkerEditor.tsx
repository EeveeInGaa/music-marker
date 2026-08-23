import { type CSSProperties, useEffect, useRef, useState } from "react";
import {
  MARKER_COLORS,
  type Marker,
  type MarkerColor,
  type MarkerPosition,
} from "../domain/marker";
import {
  clampTimeToCentiseconds,
  formatPrecisePlaybackTime,
  roundTimeToCentiseconds,
} from "../domain/time";
import { type TranslationKey, useI18n } from "../i18n/i18n";

export type MarkerEditorMode = "create" | "edit";

interface MarkerEditorProps {
  duration: number;
  initialMarker: Marker;
  mode: MarkerEditorMode;
  onClose: () => void;
  onDelete: (markerId: string) => void;
  onSave: (marker: Marker) => void;
}

interface PopoverToggleEvent extends Event {
  readonly newState: "closed" | "open";
}

interface MarkerEditorStyle extends CSSProperties {
  "--editor-marker-color": string;
}

const markerColorLabelKeys: Record<MarkerColor["name"], TranslationKey> = {
  blue: "markerColor.blue",
  green: "markerColor.green",
  pink: "markerColor.pink",
  slate: "markerColor.slate",
  teal: "markerColor.teal",
  violet: "markerColor.violet",
  yellow: "markerColor.yellow",
};

export function MarkerEditor({
  duration,
  initialMarker,
  mode,
  onClose,
  onDelete,
  onSave,
}: MarkerEditorProps) {
  const { t } = useI18n();
  const popoverRef = useRef<HTMLDivElement | null>(null);
  const descriptionRef = useRef<HTMLTextAreaElement | null>(null);
  const [draft, setDraft] = useState({
    ...initialMarker,
    time: clampTimeToCentiseconds(initialMarker.time, duration),
  });

  useEffect(() => {
    const popover = popoverRef.current;
    if (popover === null) {
      return;
    }

    const handleToggle = (event: Event) => {
      if ((event as PopoverToggleEvent).newState === "closed") {
        onClose();
      }
    };

    popover.addEventListener("toggle", handleToggle);

    if (typeof popover.showPopover === "function" && !popover.matches(":popover-open")) {
      popover.showPopover();
    }

    descriptionRef.current?.focus();

    return () => popover.removeEventListener("toggle", handleToggle);
  }, [onClose]);

  return (
    <div
      className="marker-popover"
      popover="auto"
      ref={popoverRef}
      style={{ "--editor-marker-color": draft.color } as MarkerEditorStyle}
    >
      <form
        className="marker-form"
        onSubmit={(event) => {
          event.preventDefault();
          onSave({ ...draft, time: clampTimeToCentiseconds(draft.time, duration) });
        }}
      >
        <header className="marker-form-heading">
          <div>
            <p className="eyebrow">
              {t(mode === "create" ? "markerEditor.newMarker" : "markerEditor.marker")}
            </p>
            <div className="marker-editor-time">
              <span className="marker-editor-color" aria-hidden="true" />
              <h2>{formatPrecisePlaybackTime(draft.time)}</h2>
            </div>
          </div>
          <button
            aria-label={t("markerEditor.close")}
            className="popover-close"
            onClick={onClose}
            type="button"
          >
            <span aria-hidden="true">×</span>
          </button>
        </header>

        {mode === "edit" ? (
          <p className="marker-editor-hint">{t("markerEditor.dragHint")}</p>
        ) : null}

        <div className="form-field">
          <label htmlFor="marker-description">{t("markerEditor.description")}</label>
          <textarea
            id="marker-description"
            maxLength={500}
            name="description"
            onChange={(event) => setDraft({ ...draft, description: event.currentTarget.value })}
            placeholder={t("markerEditor.descriptionPlaceholder")}
            ref={descriptionRef}
            rows={3}
            value={draft.description}
          />
        </div>

        <fieldset className="marker-fieldset">
          <legend>{t("markerEditor.color")}</legend>
          <div className="color-options">
            {MARKER_COLORS.map((color) => (
              <label className="color-option" key={color.value}>
                <input
                  checked={draft.color === color.value}
                  name="marker-color"
                  onChange={() => setDraft({ ...draft, color: color.value })}
                  type="radio"
                  value={color.value}
                />
                <span
                  aria-hidden="true"
                  className="color-swatch"
                  style={{ backgroundColor: color.value }}
                />
                <span className="visually-hidden">{t(markerColorLabelKeys[color.name])}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="marker-fieldset">
          <legend>{t("markerEditor.position")}</legend>
          <div className="position-options">
            {(["top", "bottom"] as const).map((position) => (
              <label className="position-option" key={position}>
                <input
                  checked={draft.position === position}
                  name="marker-position"
                  onChange={(event) =>
                    setDraft({
                      ...draft,
                      position: event.currentTarget.value as MarkerPosition,
                    })
                  }
                  type="radio"
                  value={position}
                />
                <span>{t(position === "top" ? "markerEditor.top" : "markerEditor.bottom")}</span>
              </label>
            ))}
          </div>
        </fieldset>

        <div className="form-field marker-time-field">
          <label htmlFor="marker-time">{t("markerEditor.time")}</label>
          <input
            id="marker-time"
            inputMode="decimal"
            max={duration}
            min={0}
            name="time"
            onChange={(event) => {
              const nextTime = event.currentTarget.valueAsNumber;
              setDraft({
                ...draft,
                time: Number.isFinite(nextTime) ? roundTimeToCentiseconds(nextTime) : 0,
              });
            }}
            step={0.01}
            type="number"
            value={draft.time}
          />
        </div>

        <footer className="marker-form-actions">
          {mode === "edit" ? (
            <button
              className="delete-marker-button"
              onClick={() => onDelete(initialMarker.id)}
              type="button"
            >
              {t("markerEditor.delete")}
            </button>
          ) : (
            <span />
          )}
          <div>
            <button className="secondary-button" onClick={onClose} type="button">
              {t("markerEditor.cancel")}
            </button>
            <button className="primary-button" type="submit">
              {t(mode === "create" ? "markerEditor.add" : "markerEditor.save")}
            </button>
          </div>
        </footer>
      </form>
    </div>
  );
}
