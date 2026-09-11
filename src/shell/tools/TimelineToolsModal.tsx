import type { HudPresentation } from "../hud/hud-presentation";
import styles from "./TimelineToolsModal.module.css";

export type PresentationChoice = HudPresentation;

const PRESENTATION_OPTIONS: { id: PresentationChoice; label: string }[] = [
  { id: "production", label: "Production" },
  { id: "authority", label: "Authority (HUD Preview)" },
  { id: "tactical", label: "Tactical (HUD Preview)" },
  { id: "theater", label: "Theater (HUD Preview)" },
];

export function TimelineToolsModal({
  jsonText,
  importError,
  presentationChoice,
  onJsonTextChange,
  onSelectPresentation,
  onImport,
  onExport,
  onReset,
  onClose,
}: {
  jsonText: string;
  importError: string | null;
  presentationChoice?: PresentationChoice;
  onJsonTextChange: (value: string) => void;
  onSelectPresentation?: (choice: PresentationChoice) => void;
  onImport: () => void;
  onExport: () => void;
  onReset: () => void;
  onClose: () => void;
}) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className={`modal-content panel ${styles.modalContent}`} onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">PORTABLE CRAWLER TIMELINE (V1/V2)</p>
            <h2>IMPORT / EXPORT CRAWLER TIMELINE</h2>
          </div>
          <button className="close-btn" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>

        <p className={styles.description}>
          Export current versioned crawler-timeline JSON document or import a validated timeline envelope.
        </p>
        <div className={styles.actionRow}>
          <button className={styles.actionButton} onClick={onExport}>DOWNLOAD TIMELINE JSON</button>
          <button className={`${styles.actionButton} ${styles.dangerButton}`} onClick={onReset}>
            RESET TO DEFAULT FIXTURE 🔄
          </button>
        </div>

        {onSelectPresentation && (
          <div className={styles.presentationSection}>
            <p className={`eyebrow ${styles.presentationSectionLabel}`}>
              PRESENTATION PREVIEW SELECTOR (LIVE SESSION SWITCH)
            </p>
            <div role="group" aria-label="Presentation choices" className={styles.presentationGroup}>
              {PRESENTATION_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  className={styles.presentationOption}
                  aria-pressed={presentationChoice === option.id}
                  onClick={() => onSelectPresentation(option.id)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}
        {importError && (
          <div className={`import-error-box ${styles.errorBox}`}>
            <strong>VALIDATION FAILED:</strong>
            {"\n" + importError}
          </div>
        )}
        <textarea
          rows={8}
          className={styles.jsonInput}
          placeholder="Paste crawler-timeline document JSON here to import..."
          value={jsonText}
          onChange={(event) => onJsonTextChange(event.target.value)}
        />
        <div className={`modal-footer ${styles.modalFooter}`}>
          <button className="outline" onClick={onImport}>
            IMPORT TIMELINE ENVELOPE
          </button>
          <button className="outline" onClick={onClose}>
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
