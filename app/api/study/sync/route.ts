import { and, asc, eq, gt, or } from "drizzle-orm";
import { apiUnauthorized, jsonError, requireApiUser } from "@/app/lib/api";
import type { StudyEvent } from "@/app/lib/study-store";
import { getDb } from "@/db";
import { studyEvents } from "@/db/schema";

const eventTypes = new Set([
  "lesson_started",
  "lesson_completed",
  "concept_review",
  "vocab_review",
  "listening_drill",
  "practice_answer",
  "diagnostic_answer",
]);
const contentTypes = new Set(["problem", "concept", "vocabulary", "reading", "listening"]);
const domains = new Set(["language", "reading", "listening"]);
const ratings = new Set(["again", "hard", "good"]);

function safeText(value: unknown, maximum: number) {
  return typeof value === "string" && value.length > 0 && value.length <= maximum;
}

function validEvent(value: unknown): value is StudyEvent {
  if (!value || typeof value !== "object" || Array.isArray(value)) return false;
  const event = value as Record<string, unknown>;
  if (!safeText(event.clientEventId, 180) || !safeText(event.deviceId, 180)) return false;
  if (!eventTypes.has(String(event.type))) return false;
  if (!contentTypes.has(String(event.contentType))) return false;
  if (!safeText(event.contentId, 240) || !domains.has(String(event.domain))) return false;
  if (event.skill !== undefined && !safeText(event.skill, 240)) return false;
  if (event.rating !== undefined && !ratings.has(String(event.rating))) return false;
  if (event.correct !== undefined && typeof event.correct !== "boolean") return false;
  if (
    event.durationSeconds !== undefined &&
    (!Number.isInteger(event.durationSeconds) || Number(event.durationSeconds) < 0 || Number(event.durationSeconds) > 86_400)
  ) return false;
  return safeText(event.createdAt, 40) && Number.isFinite(Date.parse(String(event.createdAt)));
}

function syncCursor(value: unknown) {
  if (typeof value !== "string") {
    return { raw: "", receivedAt: "1970-01-01T00:00:00.000Z", clientEventId: "" };
  }
  const separator = value.indexOf("|");
  const receivedAt = separator >= 0 ? value.slice(0, separator) : value;
  const clientEventId = separator >= 0 ? value.slice(separator + 1) : "";
  if (!Number.isFinite(Date.parse(receivedAt)) || clientEventId.length > 180) {
    return { raw: "", receivedAt: "1970-01-01T00:00:00.000Z", clientEventId: "" };
  }
  return { raw: value, receivedAt, clientEventId };
}

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return apiUnauthorized();

  const payload = await request.json().catch(() => null) as {
    events?: unknown;
    cursor?: unknown;
  } | null;
  const incoming = Array.isArray(payload?.events) ? payload.events : [];
  if (incoming.length > 500) return jsonError("单次同步最多接收 500 条学习记录。", 413);
  if (!incoming.every(validEvent)) return jsonError("学习记录格式无效。请刷新页面后重试同步。");

  const cursor = syncCursor(payload?.cursor);
  const receivedAt = new Date().toISOString();
  const db = getDb();

  for (const event of incoming) {
    await db
      .insert(studyEvents)
      .values({
        id: crypto.randomUUID(),
        clientEventId: event.clientEventId,
        userId: user.id,
        deviceId: event.deviceId,
        type: event.type,
        contentType: event.contentType,
        contentId: event.contentId,
        domain: event.domain,
        skill: event.skill ?? null,
        rating: event.rating ?? null,
        correct: event.correct ?? null,
        durationSeconds: event.durationSeconds ?? null,
        createdAt: event.createdAt,
        receivedAt,
      })
      .onConflictDoNothing({ target: [studyEvents.userId, studyEvents.clientEventId] });
  }

  const remote = await db
    .select()
    .from(studyEvents)
    .where(and(
      eq(studyEvents.userId, user.id),
      or(
        gt(studyEvents.receivedAt, cursor.receivedAt),
        and(
          eq(studyEvents.receivedAt, cursor.receivedAt),
          gt(studyEvents.clientEventId, cursor.clientEventId),
        ),
      ),
    ))
    .orderBy(asc(studyEvents.receivedAt), asc(studyEvents.clientEventId))
    .limit(1000);

  const lastRemote = remote.at(-1);
  const nextCursor = lastRemote
    ? `${lastRemote.receivedAt}|${lastRemote.clientEventId}`
    : cursor.raw;

  return Response.json({
    acceptedClientEventIds: incoming.map((event) => event.clientEventId),
    events: remote.map((event) => ({
      id: event.id,
      clientEventId: event.clientEventId,
      deviceId: event.deviceId,
      type: event.type,
      contentType: event.contentType,
      contentId: event.contentId,
      domain: event.domain,
      skill: event.skill ?? undefined,
      rating: event.rating ?? undefined,
      correct: event.correct ?? undefined,
      durationSeconds: event.durationSeconds ?? undefined,
      createdAt: event.createdAt,
      syncedAt: receivedAt,
    })),
    cursor: nextCursor,
    syncedAt: receivedAt,
    hasMore: remote.length === 1000,
  });
}
