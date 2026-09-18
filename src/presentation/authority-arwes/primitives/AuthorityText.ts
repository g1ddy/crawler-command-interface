"use client";
import type { ComponentType, CSSProperties, ElementType, ReactNode } from "react";
import { createElement } from "react";
import { Text } from "@arwes/react-text";
import type { AuthorityMotionMode } from "./AuthorityTransition.ts";

export interface AuthorityTextProps {
  delivery?: "instant" | "decoded";
  motionMode?: AuthorityMotionMode;
  as?: ElementType;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  "data-testid"?: string;
}

const TextComponent = Text as unknown as ComponentType<{ as?: ElementType }>;

export function AuthorityText({
  delivery = "instant",
  motionMode = "enabled",
  as: Component = "span",
  children,
  className,
  style,
  "data-testid": testId,
}: AuthorityTextProps) {
  const textContent = typeof children === "string" ? children : String(children ?? "");

  if (delivery === "instant" || motionMode === "deterministic" || motionMode === "reduced") {
    return createElement(
      Component,
      {
        className,
        style,
        "data-delivery": delivery,
        "data-motion-mode": motionMode,
        "data-testid": testId,
      },
      textContent
    );
  }

  return createElement(
    Component,
    {
      className,
      style,
      "data-delivery": delivery,
      "data-motion-mode": motionMode,
      "data-testid": testId,
    },
    createElement(TextComponent, { as: "span" }, textContent)
  );
}
