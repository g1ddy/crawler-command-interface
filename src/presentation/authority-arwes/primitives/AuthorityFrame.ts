"use client";
import type { CSSProperties, ReactNode } from "react";
import { createElement } from "react";
import { FrameCorners, FrameLines, FrameHeader } from "@arwes/react-frames";

export type AuthoritySignificance =
  | "ambient"
  | "informational"
  | "active"
  | "important"
  | "critical"
  | "system-interruption";

export interface AuthorityFrameProps {
  significance?: AuthoritySignificance;
  variant?: "corners" | "lines" | "header";
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  "data-testid"?: string;
}

const COLOR_MAP: Record<AuthoritySignificance, string> = {
  ambient: "#1e3a8a",
  informational: "#0284c7",
  active: "#0ea5e9",
  important: "#eab308",
  critical: "#ef4444",
  "system-interruption": "#f43f5e",
};

export function AuthorityFrame({
  significance = "informational",
  variant = "corners",
  children,
  className,
  style,
  "data-testid": testId,
}: AuthorityFrameProps) {
  const stroke = COLOR_MAP[significance] ?? COLOR_MAP.informational;

  const frameComponent =
    variant === "lines"
      ? FrameLines
      : variant === "header"
      ? FrameHeader
      : FrameCorners;

  return createElement(
    "div",
    {
      className,
      style: {
        position: "relative",
        padding: "1rem",
        color: "#f8fafc",
        ...style,
      },
      "data-significance": significance,
      "data-testid": testId,
    },
    createElement(
      "div",
      { style: { position: "absolute", inset: 0, pointerEvents: "none", color: stroke } },
      createElement(frameComponent, { style: { color: stroke } })
    ),
    createElement("div", { style: { position: "relative", zIndex: 1 } }, children)
  );
}
