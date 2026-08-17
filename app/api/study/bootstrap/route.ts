import { and, desc, eq, isNull } from "drizzle-orm";
import { requireApiUser, apiUnauthorized } from "@/app/lib/api";
import { getDb } from "@/db";
import { aiStudyPlans, practiceAttempts, practiceSessions, studyProfiles } from "@/db/schema";

export async function GET() {
  const user = await requireApiUser();
  if (!user) return apiUnauthorized();
  const db = getDb();
  const [profile, attempts, plans, activeSessions] = await Promise.all([
    db.select().from(studyProfiles).where(eq(studyProfiles.userId, user.id)).limit(1),
    db.select().from(practiceAttempts).where(eq(practiceAttempts.userId, user.id)).orderBy(desc(practiceAttempts.createdAt)).limit(240),
    db.select().from(aiStudyPlans).where(eq(aiStudyPlans.userId, user.id)).orderBy(desc(aiStudyPlans.generatedAt)).limit(1),
    db.select().from(practiceSessions).where(and(eq(practiceSessions.userId, user.id), isNull(practiceSessions.completedAt))).orderBy(desc(practiceSessions.startedAt)).limit(1),
  ]);
  return Response.json({ profile: profile[0] ?? null, attempts, plan: plans[0] ? JSON.parse(plans[0].payload) : null, activeSession: activeSessions[0] ?? null });
}
