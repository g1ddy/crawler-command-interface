"use client";
import type { CSSProperties, ReactNode } from "react";
import { createElement } from "react";
import { Animator } from "@arwes/react-animator";
import { Animated } from "@arwes/react-animated";

export type AuthorityTransitionState =
  | "entering"
  | "entered"
  | "exiting"
  | "exited";

export type AuthorityMotionMode =
  | "enabled"
  | "reduced"
  | "deterministic";

export interface AuthorityTransitionProps {
  state?: AuthorityTransitionState;
  motionMode?: AuthorityMotionMode;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  "data-testid"?: string;
}

export function AuthorityTransition({
  state = "entered",
  motionMode = "enabled",
  children,
  className,
  style,
  "data-testid": testId,
}: AuthorityTransitionProps) {
  const isActive = state === "entering" || state === "entered";

  if (motionMode === "deterministic") {
    return createElement(
      "div",
      {
        className,
        style: {
          opacity: isActive ? 1 : 0,
          transform: "none",
          transition: "none",
          ...style,
        },
        "data-testid": testId,
        "data-transition-state": state,
        "data-motion-mode": "deterministic",
      },
      children
    );
  }

  const isReduced = motionMode === "reduced";

  return createElement(
    Animator,
    {
      active: isActive,
      duration: isReduced ? { enter: 0, exit: 0 } : { enter: 0.2, exit: 0.2 },
    },
    createElement(
      "div",
      {
        "data-testid": testId,
        "data-transition-state": state,
        "data-motion-mode": isReduced ? "reduced" : "enabled",
      },
      createElement(
        Animated,
        {
          className,
          style,
          animated: isReduced ? false : ["fade"],
        },
        children
      )
    )
  );
}
