import type { HudPresentation } from "../hud/hud-presentation";

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
      <div className="modal-content panel" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">PORTABLE CRAWLER TIMELINE (V1/V2)</p>
            <h2>IMPORT / EXPORT CRAWLER TIMELINE</h2>
          </div>
          <button className="close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {onSelectPresentation && (
          <div style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #1f3e4d" }}>
            <p className="eyebrow" style={{ color: "#749bb0", marginBottom: "6px" }}>
              PRESENTATION PREVIEW SELECTOR (LIVE SESSION SWITCH)
            </p>
            <div role="group" aria-label="Presentation choices" style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {PRESENTATION_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  className={presentationChoice === option.id ? "" : "outline"}
                  aria-pressed={presentationChoice === option.id}
                  onClick={() => onSelectPresentation(option.id)}
                  style={{
                    fontSize: "11px",
                    padding: "4px 8px",
                    borderColor: presentationChoice === option.id ? "var(--cyan, #00d2ff)" : undefined,
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        )}

        <p style={{ fontSize: "11px", color: "#a4b7bf" }}>
          Export current versioned crawler-timeline JSON document or import a validated timeline envelope.
        </p>
        <div className="actions" style={{ marginBottom: "12px", display: "flex", gap: "8px", flexWrap: "wrap" }}>
          <button onClick={onExport}>DOWNLOAD TIMELINE JSON</button>
          <button style={{ background: "#2a1518", borderColor: "#7a2a30", color: "#ff8a90" }} onClick={onReset}>
            RESET TO DEFAULT FIXTURE 🔄
          </button>
        </div>
        {importError && (
          <div
            className="import-error-box"
            style={{
              background: "#2a0808",
              border: "1px solid #e53935",
              color: "#ff8a80",
              padding: "8px 12px",
              borderRadius: "4px",
              fontSize: "10px",
              fontFamily: "monospace",
              whiteSpace: "pre-wrap",
              marginBottom: "12px",
              maxHeight: "120px",
              overflowY: "auto",
            }}
          >
            <strong>VALIDATION FAILED:</strong>
            {"\n" + importError}
          </div>
        )}
        <textarea
          rows={8}
          style={{
            width: "100%",
            background: "#060e15",
            color: "#9be2f3",
            border: "1px solid #1f3e4d",
            fontSize: "10px",
            padding: "8px",
            fontFamily: "monospace",
          }}
          placeholder="Paste crawler-timeline document JSON here to import..."
          value={jsonText}
          onChange={(event) => onJsonTextChange(event.target.value)}
        />
        <div className="modal-footer" style={{ marginTop: "12px", display: "flex", gap: "8px" }}>
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
