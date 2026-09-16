import type { DerivedNotificationsPresentation } from "./public";
import { Panel } from "../../shared/ui/Panel";
import styles from "./NotificationsView.module.css";

export function NotificationsView({ presentation, onNavigateToSequence }: { presentation: DerivedNotificationsPresentation; onNavigateToSequence: (sequence: number) => void }) {
  const sequence = presentation.sequence;
  return (
    <section className={styles.viewContent}>
      <header className={styles.title}>
        <div><p className={styles.eyebrow}>SYSTEM NOTICES</p><h1>NOTIFICATIONS</h1></div>
        <b className={styles.countBadge}>{presentation.badgeLabel}</b>
      </header>
      {!presentation.hasNotifications ? (
        <Panel title="NO NOTIFICATIONS"><p className={styles.emptyText}>No system notifications have been delivered up to sequence #{sequence}.</p></Panel>
      ) : (
        <div className={styles.noticesList}>
          {presentation.notifications.map(item => (
            <div className={`${styles.noticeCard} ${item.isCurrentDelivery ? styles.currentDelivery : ""}`} key={item.id}>
              <span className={styles.noticeIcon} aria-hidden="true">{item.icon}</span>
              <div className={styles.noticeBody}>
                <p className={styles.eyebrow}>{item.kind.toUpperCase()} · {item.severity.toUpperCase()} ·{" "}
                  <button type="button" className={styles.sequenceLink} onClick={() => onNavigateToSequence(item.sequence)} aria-label={`Jump to sequence #${item.sequence}`}>SEQ #{item.sequence}</button>
                </p>
                <h1>{item.title}</h1><p>{item.message}</p>
                {item.formattedRewards && item.formattedRewards.length > 0 && <ul className={styles.rewardsList} aria-label="Achievement rewards">
                  {item.formattedRewards.map((reward, index) => <li key={`${reward.kind}-${index}`}><strong>{reward.kind}</strong>{reward.detail}</li>)}
                </ul>}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
