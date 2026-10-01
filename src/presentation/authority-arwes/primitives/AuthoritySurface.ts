"use client";
import type { CSSProperties, ReactNode } from "react";
import { createElement } from "react";

export interface AuthoritySurfaceProps {
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  "data-testid"?: string;
  [key: `data-${string}`]: unknown;
}

export function AuthoritySurface({
  children,
  className,
  style,
  "data-testid": testId,
  ...rest
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
      ...rest,
    },
    children
  );
}
