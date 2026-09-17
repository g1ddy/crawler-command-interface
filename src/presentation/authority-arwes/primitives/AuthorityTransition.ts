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
  const isDeterministic = motionMode === "deterministic" || motionMode === "reduced";
  const isActive = state === "entering" || state === "entered";

  const animatedStyles: CSSProperties = isDeterministic
    ? {
        opacity: isActive ? 1 : 0,
        transform: "none",
        ...style,
      }
    : (style ?? {});

  return createElement(
    Animator,
    {
      active: isActive,
      duration: { enter: isDeterministic ? 0 : 0.2, exit: isDeterministic ? 0 : 0.2 },
    },
    createElement(
      "div",
      {
        "data-testid": testId,
        "data-transition-state": state,
        "data-motion-mode": motionMode,
      },
      createElement(
        Animated,
        {
          className,
          style: animatedStyles,
          animated: isDeterministic ? false : ["fade"],
        },
        children
      )
    )
  );
}
