"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import styles from "./ModalBoundary.module.css";

const focusableSelector = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Accessibility boundary for existing modal contents; no product state or styling. */
export function ModalBoundary({ label, onClose, children }: {
  label: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const [host] = useState(() => typeof document === "undefined" ? null : document.createElement("div"));
  const close = useRef(onClose);
  useEffect(() => { close.current = onClose; }, [onClose]);
  useEffect(() => {
    if (!host) return;
    document.body.append(host);
    return () => host.remove();
  }, [host]);
  useEffect(() => {
    if (!host) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const siblings = Array.from(document.body.children)
      .filter((el): el is HTMLElement => el instanceof HTMLElement && el !== host);
    const previousInert = siblings.map(el => el.inert);
    siblings.forEach(el => { el.inert = true; });
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const targets = () => Array.from(host.querySelectorAll<HTMLElement>(focusableSelector))
      .filter(el => el.getClientRects().length > 0 && !el.closest("[inert]"));
    const dialog = host.querySelector<HTMLElement>('[role="dialog"]')!;
    (targets()[0] ?? dialog).focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (host.inert) return; // A child inspector owns the topmost focus boundary.
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopImmediatePropagation();
        close.current();
      } else if (event.key === "Tab") {
        const elements = targets();
        const first = elements[0] ?? dialog;
        const last = elements.at(-1) ?? dialog;
        if (!elements.length || (event.shiftKey && document.activeElement === first) ||
          (!event.shiftKey && document.activeElement === last) || !host.contains(document.activeElement)) {
          event.preventDefault();
          (event.shiftKey ? last : first).focus();
        }
      }
    };
    document.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("keydown", onKeyDown, true);
      siblings.forEach((el, index) => { el.inert = previousInert[index]; });
      document.body.style.overflow = overflow;
      if (previousFocus?.isConnected) previousFocus.focus();
    };
  }, [host]);
  return host ? createPortal(<div className={styles.boundary} role="dialog" aria-modal="true" aria-label={label} tabIndex={-1}>{children}</div>, host) : null;
}
