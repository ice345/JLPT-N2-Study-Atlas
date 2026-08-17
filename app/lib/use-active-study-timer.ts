"use client";

import { useEffect } from "react";
import { recordStudyEvent, type StudyContentType, type StudyDomain } from "@/app/lib/study-store";

type ActiveStudyTimerInput = {
  contentId: string;
  contentType: StudyContentType;
  domain: StudyDomain;
  problemId?: string;
  unitId?: string;
  skill?: string;
  enabled?: boolean;
};

const idleAfterMilliseconds = 90_000;
const flushAfterSeconds = 30;

export function useActiveStudyTimer(input: ActiveStudyTimerInput) {
  const { contentId, contentType, domain, problemId, unitId, skill, enabled } = input;
  useEffect(() => {
    if (enabled === false) return;
    let activeSeconds = 0;
    let lastInteractionAt = Date.now();
    let flushing = false;

    const noteInteraction = () => {
      lastInteractionAt = Date.now();
    };
    const flush = async () => {
      if (flushing || activeSeconds < 1) return;
      flushing = true;
      const durationSeconds = activeSeconds;
      activeSeconds = 0;
      try {
        await recordStudyEvent({
          type: "study_activity",
          contentType,
          contentId,
          problemId,
          unitId,
          domain,
          skill,
          durationSeconds,
        });
      } catch {
        activeSeconds += durationSeconds;
      } finally {
        flushing = false;
      }
    };
    const tick = () => {
      if (document.visibilityState !== "visible") return;
      if (Date.now() - lastInteractionAt > idleAfterMilliseconds) return;
      activeSeconds += 1;
      if (activeSeconds >= flushAfterSeconds) void flush();
    };
    const onVisibilityChange = () => {
      if (document.visibilityState === "hidden") void flush();
      else noteInteraction();
    };

    const interactions: (keyof WindowEventMap)[] = ["pointerdown", "keydown", "scroll", "touchstart"];
    interactions.forEach((eventName) => window.addEventListener(eventName, noteInteraction, { passive: true }));
    document.addEventListener("visibilitychange", onVisibilityChange);
    window.addEventListener("pagehide", flush);
    const timer = window.setInterval(tick, 1000);
    return () => {
      window.clearInterval(timer);
      interactions.forEach((eventName) => window.removeEventListener(eventName, noteInteraction));
      document.removeEventListener("visibilitychange", onVisibilityChange);
      window.removeEventListener("pagehide", flush);
      void flush();
    };
  }, [contentId, contentType, domain, enabled, problemId, skill, unitId]);
}
