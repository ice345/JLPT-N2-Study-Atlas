"use client";

import {
  getStudyStore,
  rebuildReviewStatesFromEvents,
  type StudyEvent,
} from "@/app/lib/study-store";

type SyncResponse = {
  acceptedClientEventIds: string[];
  events: StudyEvent[];
  cursor: string;
  syncedAt: string;
  hasMore: boolean;
};

let activeSync: Promise<{ pushed: number; pulled: number }> | null = null;

export function syncStudyStore() {
  if (activeSync) return activeSync;
  activeSync = runSync().finally(() => {
    activeSync = null;
  });
  return activeSync;
}

async function runSync() {
  const store = getStudyStore();
  let cursor = await store.getSyncCursor();
  let pushed = 0;
  let pulled = 0;
  for (let round = 0; round < 20; round += 1) {
    const localEvents = await store.getEvents({ unsyncedOnly: true });
    const batch = localEvents.slice(0, 500);
    const response = await fetch("/api/study/sync", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ events: batch, cursor }),
    });
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { error?: string } | null;
      throw new Error(body?.error ?? "跨设备同步暂时不可用，本地记录不受影响。");
    }
    const data = await response.json() as SyncResponse;
    await store.addEvents(data.events.map((event) => ({ ...event, syncedAt: data.syncedAt })));
    await store.markEventsSynced(data.acceptedClientEventIds, data.syncedAt);
    if (data.cursor) {
      cursor = data.cursor;
      await store.setSyncCursor(data.cursor);
    }
    pushed += data.acceptedClientEventIds.length;
    pulled += data.events.length;
    const hasLocalMore = localEvents.length > batch.length;
    if (!data.hasMore && !hasLocalMore) break;
  }
  await rebuildReviewStatesFromEvents();
  return { pushed, pulled };
}
