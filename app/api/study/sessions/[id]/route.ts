import { and, eq } from "drizzle-orm";
import { requireApiUser, apiUnauthorized, jsonError } from "@/app/lib/api";
import { getQuestions } from "@/app/lib/study";
import { getDb } from "@/db";
import { practiceAttempts, practiceSessions } from "@/db/schema";

function validAnswers(value: unknown, ids: string[]) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {} as Record<string, number>;
  return Object.fromEntries(Object.entries(value).filter(([id, answer]) => ids.includes(id) && Number.isInteger(answer) && Number(answer) >= 0 && Number(answer) < 4)) as Record<string, number>;
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const user = await requireApiUser();
  if (!user) return apiUnauthorized();
  const { id } = await params;
  const db = getDb();
  const existing = await db.select().from(practiceSessions).where(and(eq(practiceSessions.id, id), eq(practiceSessions.userId, user.id))).limit(1);
  const session = existing[0];
  if (!session) return jsonError("未找到这轮练习。", 404);
  if (session.completedAt) return jsonError("这轮练习已经交卷。", 409);
  const payload = await request.json().catch(() => null) as { answers?: unknown; complete?: unknown } | null;
  const questionIds = JSON.parse(session.questionIds) as string[];
  const answers = validAnswers(payload?.answers, questionIds);
  const complete = payload?.complete === true;
  if (complete && Object.keys(answers).length !== questionIds.length) return jsonError("请完成所有题目后再交卷。");
  const completedAt = complete ? new Date().toISOString() : null;
  await db.update(practiceSessions).set({ answers: JSON.stringify(answers), completedAt }).where(eq(practiceSessions.id, id));
  if (!complete) return Response.json({ saved: true });
  const questions = getQuestions(questionIds);
  const attempts = questions.map((question) => ({
    id: crypto.randomUUID(), userId: user.id, sessionId: id, questionId: question.id,
    area: question.area, skill: question.skill, selectedAnswer: answers[question.id],
    correct: answers[question.id] === question.answer, createdAt: completedAt!,
  }));
  await Promise.all(attempts.map((attempt) => db.insert(practiceAttempts).values(attempt)));
  const correct = attempts.filter((attempt) => attempt.correct).length;
  return Response.json({ completedAt, correct, total: attempts.length, attempts: attempts.map(({ questionId, correct: isCorrect }) => ({ questionId, correct: isCorrect })) });
}
