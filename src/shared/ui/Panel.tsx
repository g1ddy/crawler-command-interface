import type { ReactNode } from "react";
import styles from "./Panel.module.css";

export function Panel({
  title,
  action,
  children,
  className = "",
  ariaLabel,
}: {
  title: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <section className={`${styles.panel} ${className}`} aria-label={ariaLabel}>
      <div className={styles.header}>
        <h2>{title}</h2>
        {action && <div className={styles.action}>{action}</div>}
      </div>
      {children}
    </section>
  );
}
