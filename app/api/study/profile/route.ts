import { requireApiUser, apiUnauthorized, jsonError } from "@/app/lib/api";
import { safeDailyMinutes } from "@/app/lib/study";
import { getDb } from "@/db";
import { studyProfiles } from "@/db/schema";

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return apiUnauthorized();
  const payload = await request.json().catch(() => null) as { targetExamDate?: unknown; dailyMinutes?: unknown } | null;
  const targetExamDate = typeof payload?.targetExamDate === "string" ? payload.targetExamDate : "";
  if (!/^\d{4}-\d{2}-\d{2}$/u.test(targetExamDate)) return jsonError("请填写有效的目标考试日期。");
  const now = new Date().toISOString();
  const profile = { userId: user.id, targetExamDate, dailyMinutes: safeDailyMinutes(payload?.dailyMinutes), updatedAt: now };
  const db = getDb();
  await db.insert(studyProfiles).values(profile).onConflictDoUpdate({ target: studyProfiles.userId, set: profile });
  return Response.json({ profile });
}
