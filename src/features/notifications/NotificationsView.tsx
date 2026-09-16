import { useMemo } from "react";
import type { CrawlerEvent } from "../../../app/domain/types";
import { projectNotifications } from "./notification-presentation";
import styles from "./NotificationsView.module.css";

export function NotificationsView({ events, sequence, onNavigateToSequence }: { events: CrawlerEvent[]; sequence: number; onNavigateToSequence: (s: number) => void }) {
 const notifications = useMemo(() => projectNotifications(events, sequence), [events, sequence]);
 return <section className={styles.viewContent}><header className={styles.title}><div><p className={styles.eyebrow}>SYSTEM NOTICES</p><h1>NOTIFICATIONS</h1></div><b>{notifications.length} NOTICES</b></header><div className={styles.achievements}>{notifications.map(item => <div className={styles.achievement} key={item.id}><span>{item.kind === "achievement" ? "🏆" : item.kind === "progression" ? "⬆" : "🎁"}</span><div><p className={styles.eyebrow}>{item.kind.toUpperCase()} · {item.severity.toUpperCase()} · <button className={styles.link} onClick={() => onNavigateToSequence(item.sequence)}>SEQ #{item.sequence}</button></p><h1>{item.title}</h1><p>{item.message}</p>{item.rewards && <ul className={styles.achievementRewards} aria-label="Achievement rewards">{item.rewards.map((reward, index) => <li key={`${reward.kind}-${index}`}><strong>{reward.kind.toUpperCase()}</strong>{[reward.boxType, reward.rarity, reward.amount, reward.description].filter(value => value !== undefined).map(String).join(" · ") ? ` · ${[reward.boxType, reward.rarity, reward.amount, reward.description].filter(value => value !== undefined).map(String).join(" · ")}` : ""}</li>)}</ul>}</div></div>)}</div></section>;
}
