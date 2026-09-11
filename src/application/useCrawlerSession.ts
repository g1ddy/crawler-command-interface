"use client";

import { useEffect, useMemo, useState } from "react";
import type { ActionResult } from "./crawler-action-contracts";
import {
  CrawlerSessionController,
  type CreateCrawlerSessionOptions,
} from "./crawler-session-controller.ts";
import type { CrawlerSession } from "./crawler-session.ts";

export interface UseCrawlerSessionOptions extends CreateCrawlerSessionOptions {
  onActionResult?: (result: ActionResult) => void;
}

export function useCrawlerSession(
  options: UseCrawlerSessionOptions = {},
): CrawlerSession {
  const { timelineDoc, storageAdapter, onActionResult } = options;

  const controller = useMemo(
    () =>
      new CrawlerSessionController({
        timelineDoc,
        storageAdapter,
      }),
    [timelineDoc, storageAdapter],
  );

  const [, setTick] = useState(0);

  useEffect(() => {
    return controller.subscribe(() => setTick((t) => t + 1));
  }, [controller]);

  return controller.getSession(onActionResult);
}
