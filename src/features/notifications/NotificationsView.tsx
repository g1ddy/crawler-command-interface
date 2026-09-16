import type { CrawlerNotification } from "./public";
import styles from "./NotificationsView.module.css";

export function NotificationsView({ notifications, onNavigateToSequence }: { notifications: CrawlerNotification[]; onNavigateToSequence: (sequence: number) => void }) {
  return <section className={styles.viewContent}>
    <header className={styles.title}>
      <div><p className={styles.eyebrow}>SYSTEM NOTICES</p><h1>NOTIFICATIONS</h1></div>
      <b>{notifications.length} NOTICES</b>
    </header>
    <div className={styles.achievements}>
      {notifications.map(item => <div className={styles.achievement} key={item.id}>
        <span>{item.kind === "achievement" ? "🏆" : item.kind === "progression" ? "⬆" : "🎁"}</span>
        <div>
          <p className={styles.eyebrow}>{item.kind.toUpperCase()} · {item.severity.toUpperCase()} · <button className={styles.link} onClick={() => onNavigateToSequence(item.sequence)}>SEQ #{item.sequence}</button></p>
          <h1>{item.title}</h1>
          <p>{item.message}</p>
          {item.rewards && <ul className={styles.achievementRewards} aria-label="Achievement rewards">
            {item.rewards.map((reward, index) => {
              const details = [reward.boxType, reward.rarity, reward.amount, reward.description].filter(value => value !== undefined).map(String).join(" · ");
              return <li key={`${reward.kind}-${index}`}><strong>{reward.kind.toUpperCase()}</strong>{details ? ` · ${details}` : ""}</li>;
            })}
          </ul>}
        </div>
      </div>)}
    </div>
  </section>;
}
