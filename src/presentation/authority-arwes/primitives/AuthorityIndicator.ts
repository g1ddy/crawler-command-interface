"use client";

import type { CSSProperties } from "react";
import { createElement } from "react";

export interface AuthorityIndicatorProps {
  marker: string;
  label: string;
  onActivate?: () => void;
  testId?: string;
  style?: CSSProperties;
}

export function AuthorityIndicator({
  marker,
  label,
  onActivate,
  testId,
  style,
}: AuthorityIndicatorProps) {
  if (onActivate) {
    return createElement(
      "button",
      {
        type: "button",
        "aria-label": label,
        title: label,
        "data-testid": testId,
        onClick: onActivate,
        style: {
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          width: "44px",
          height: "44px",
          minWidth: "44px",
          minHeight: "44px",
          padding: 0,
          margin: 0,
          backgroundColor: "transparent",
          border: "none",
          color: "#7dd3fc",
          cursor: "pointer",
          fontFamily: "monospace",
          fontSize: "1rem",
          fontWeight: 700,
          lineHeight: 1,
          borderRadius: "3px",
          flexShrink: 0,
          ...style,
        },
      },
      createElement(
        "span",
        {
          style: {
            fontSize: "1rem",
            fontWeight: 700,
            lineHeight: 1,
            pointerEvents: "none",
          },
        },
        marker
      )
    );
  }

  return createElement(
    "span",
    {
      role: "img",
      "aria-label": label,
      "data-testid": testId,
      style: {
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        width: "24px",
        height: "24px",
        minWidth: "24px",
        minHeight: "24px",
        padding: 0,
        margin: 0,
        color: "#64748b",
        fontFamily: "monospace",
        fontSize: "1rem",
        fontWeight: 700,
        lineHeight: 1,
        flexShrink: 0,
        ...style,
      },
    },
    marker
  );
}
