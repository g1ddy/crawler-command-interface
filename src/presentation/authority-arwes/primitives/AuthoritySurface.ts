"use client";
import type { CSSProperties, ReactNode } from "react";
import { createElement } from "react";

export interface AuthoritySurfaceProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  "data-testid"?: string;
}

export function AuthoritySurface({
  children,
  className,
  style,
  "data-testid": testId,
}: AuthoritySurfaceProps) {
  return createElement(
    "div",
    {
      className,
      style: {
        position: "relative",
        padding: "1rem",
        boxSizing: "border-box",
        ...style,
      },
      "data-testid": testId,
    },
    children
  );
}
