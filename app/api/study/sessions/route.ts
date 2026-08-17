import { requireApiUser, apiUnauthorized, jsonError } from "@/app/lib/api";
import { getQuestions, isPracticeArea } from "@/app/lib/study";
import { getDb } from "@/db";
import { practiceSessions } from "@/db/schema";

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return apiUnauthorized();
  const payload = await request.json().catch(() => null) as { mode?: unknown; area?: unknown; questionIds?: unknown } | null;
  const questionIds = Array.isArray(payload?.questionIds) ? payload.questionIds.filter((value): value is string => typeof value === "string") : [];
  const questions = getQuestions(questionIds);
  if (!questionIds.length || questionIds.length !== questions.length || new Set(questionIds).size !== questionIds.length) return jsonError("练习题目无效，请返回练习台重新开始。");
  if (payload?.mode !== "diagnostic" && payload?.mode !== "practice") return jsonError("练习模式无效。");
  if (payload?.area !== "all" && !isPracticeArea(payload?.area)) return jsonError("练习类别无效。");
  const session = {
    id: crypto.randomUUID(), userId: user.id, mode: payload.mode, area: payload.area,
    questionIds: JSON.stringify(questionIds), answers: "{}", startedAt: new Date().toISOString(), completedAt: null,
  };
  await getDb().insert(practiceSessions).values(session);
  return Response.json({ session });
}
