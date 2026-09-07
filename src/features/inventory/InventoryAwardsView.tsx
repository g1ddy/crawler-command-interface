import { Panel } from "../../shared/ui/Panel";
import type { AwardHistoryItem } from "./awardHistory";

export function InventoryAwardsView({
  awards,
}: {
  awards: AwardHistoryItem[];
}) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "minmax(0, 2fr) minmax(240px, 1fr)",
        gap: "18px",
      }}
    >
      <Panel title="AWARDS / BOXES">
        <p style={{ fontSize: "11px", color: "#9db3bd", marginTop: 0 }}>
          Historical record of earned awards and boxes.
        </p>
        {awards.length > 0 ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
              gap: "8px",
            }}
          >
            {awards.map((award) => (
              <article
                key={award.id}
                className={award.rarity}
                style={{
                  border: "1px solid #315462",
                  background: "#091721",
                  padding: "10px",
                  minHeight: "118px",
                }}
                aria-label={`${award.name} award`}
              >
                <i
                  aria-hidden="true"
                  style={{
                    display: "block",
                    color: "#f3cc52",
                    fontSize: "23px",
                    fontStyle: "normal",
                  }}
                >
                  ▣
                </i>
                <strong
                  style={{
                    display: "block",
                    color: "#e4f2f6",
                    fontSize: "11px",
                    marginTop: "6px",
                  }}
                >
                  {award.name}
                </strong>
                <small
                  style={{
                    display: "block",
                    color: "#f3cc52",
                    fontSize: "9px",
                    marginTop: "4px",
                  }}
                >
                  {award.openedAtSequence
                    ? "OPENED"
                    : award.isInInventory
                      ? "IN INVENTORY"
                      : "STATUS NOT SOURCED"}
                </small>
              </article>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "11px", color: "#8fa1aa" }}>
            No source-backed awards are available at this replay sequence.
          </p>
        )}
      </Panel>
      <Panel title="AWARD LEDGER">
        {awards.length > 0 ? (
          <div className="compact">
            {awards.map((award) => (
              <span key={award.id}>
                <strong>{award.name}</strong>
                <br />
                Awarded by {award.achievementTitle} · SEQ #
                {award.awardedAtSequence}
                <br />
                {award.openedAtSequence
                  ? `Opened at SEQ #${award.openedAtSequence}`
                  : award.isInInventory
                    ? "Present in selected inventory state"
                    : "Later status is not sourced"}
              </span>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "11px", color: "#8fa1aa" }}>
            Award history is unavailable until a replay-visible box acquisition
            is explicitly caused by an achievement unlock.
          </p>
        )}
      </Panel>
    </div>
  );
}
