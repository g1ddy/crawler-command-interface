import type { ReactNode } from "react";

export function Panel({ title, children, className = "", ariaLabel }: { title: string; children: ReactNode; className?: string; ariaLabel?: string }) {
  return (
    <section className={`panel ${className}`} aria-label={ariaLabel}>
      <h2>{title}</h2>
      {children}
    </section>
  );
}
