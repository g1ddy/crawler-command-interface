"use client";
import { useCallback, useMemo, useState } from "react";
import { LocalDeviceStorageAdapter } from "../app/domain/persistence";
import type { ActionResult } from "./application/crawler-action-contracts";
import { CrawlerWorkspace } from "./shell/adapters/CrawlerWorkspace";
import { useCrawlerSession } from "./shell/adapters/useCrawlerSession";
import type { HudPersistence, HudPresentation } from "./shell/hud/hud-presentation";

export interface CrawlerAppProps {
  hudPresentation?: HudPresentation;
  hudPersistence?: HudPersistence;
}

/** Bootstrap one session. Presentation switches never change persistence or remount it. */
export default function CrawlerApp({ hudPresentation = "production", hudPersistence = "normal" }: CrawlerAppProps = {}) {
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const onActionResult = useCallback((result: ActionResult) => {
    if (!result.ok) setToastMessage(`⚠️ ${result.error}`);
    else if (result.message) setToastMessage(`⚡ ${result.message}`);
  }, []);
  const storageAdapter = useMemo(
    () => hudPersistence === "normal" ? new LocalDeviceStorageAdapter() : null,
    [hudPersistence],
  );
  const session = useCrawlerSession({ storageAdapter, onActionResult });
  return <CrawlerWorkspace session={session} hudPresentation={hudPresentation}
    toastMessage={toastMessage} setToastMessage={setToastMessage} />;
}
