"use client";
import type { CSSProperties } from "react";
import { createElement } from "react";
import { GridLines, Dots } from "@arwes/react-bgs";

export interface AuthorityBackgroundProps {
  variant?: "grid" | "dots";
  lineColor?: string;
  dotColor?: string;
  className?: string;
  style?: CSSProperties;
  "data-testid"?: string;
}

export function AuthorityBackground({
  variant = "grid",
  lineColor = "rgba(14, 165, 233, 0.15)",
  dotColor = "rgba(14, 165, 233, 0.25)",
  className,
  style,
  "data-testid": testId,
}: AuthorityBackgroundProps) {
  return createElement(
    "div",
    {
      className,
      style: {
        position: "absolute",
        inset: 0,
        pointerEvents: "none",
        overflow: "hidden",
        zIndex: 0,
        ...style,
      },
      "data-testid": testId,
      "data-variant": variant,
    },
    variant === "grid"
      ? createElement(GridLines, { lineColor })
      : createElement(Dots, { color: dotColor })
  );
}
