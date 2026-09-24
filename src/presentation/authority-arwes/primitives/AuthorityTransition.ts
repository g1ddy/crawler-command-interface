"use client";
import type { CSSProperties, ReactNode } from "react";
import { createElement } from "react";
import { Animator } from "@arwes/react-animator";
import { Animated } from "@arwes/react-animated";
import type { PresentationMotionIntent } from "../../semantic/public.ts";

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
  motionIntent?: PresentationMotionIntent;
  motionMode?: AuthorityMotionMode;
  children?: ReactNode;
  className?: string;
  style?: CSSProperties;
  "data-testid"?: string;
}

export function AuthorityTransition({
  state = "entered",
  motionIntent,
  motionMode = "enabled",
  children,
  className,
  style,
  "data-testid": testId,
}: AuthorityTransitionProps) {
  const isActive = state === "entering" || state === "entered";

  if (!motionIntent || motionMode === "deterministic") {
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
        "data-motion-mode": motionMode,
        ...(motionIntent ? { "data-motion-intent": motionIntent } : {}),
      },
      children
    );
  }

  const isReduced = motionMode === "reduced";

  const animatedEffects: false | ("fade" | "flicker")[] = isReduced
    ? false
    : ["fade"];

  const animDuration = isReduced
    ? { enter: 0, exit: 0 }
    : motionIntent === "attention"
    ? { enter: 0.15, exit: 0.15 }
    : { enter: 0.2, exit: 0.2 };

  return createElement(
    Animator,
    {
      active: isActive,
      duration: animDuration,
    },
    createElement(
      "div",
      {
        "data-testid": testId,
        "data-transition-state": state,
        "data-motion-mode": isReduced ? "reduced" : "enabled",
        ...(motionIntent ? { "data-motion-intent": motionIntent } : {}),
      },
      createElement(
        Animated,
        {
          className,
          style,
          animated: animatedEffects,
        },
        children
      )
    )
  );
}
