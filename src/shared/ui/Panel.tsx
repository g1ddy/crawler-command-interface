import type { ReactNode } from "react";
import styles from "./Panel.module.css";

export function Panel({ title, children, className = "", ariaLabel }: { title: string; children: ReactNode; className?: string; ariaLabel?: string }) {
  return (
    <section className={`${styles.panel} ${className}`} aria-label={ariaLabel}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
