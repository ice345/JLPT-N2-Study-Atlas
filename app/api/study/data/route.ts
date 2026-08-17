import { eq } from "drizzle-orm";
import { apiUnauthorized, requireApiUser } from "@/app/lib/api";
import { getDb } from "@/db";
import {
  aiCredentials,
  aiStudyPlans,
  practiceAttempts,
  practiceSessions,
  studyEvents,
  studyProfiles,
} from "@/db/schema";

export async function DELETE() {
  const user = await requireApiUser();
  if (!user) return apiUnauthorized();
  const db = getDb();
  await db.delete(aiCredentials).where(eq(aiCredentials.userId, user.id));
  await db.delete(aiStudyPlans).where(eq(aiStudyPlans.userId, user.id));
  await db.delete(practiceAttempts).where(eq(practiceAttempts.userId, user.id));
  await db.delete(practiceSessions).where(eq(practiceSessions.userId, user.id));
  await db.delete(studyEvents).where(eq(studyEvents.userId, user.id));
  await db.delete(studyProfiles).where(eq(studyProfiles.userId, user.id));
  return Response.json({ deleted: true });
}
