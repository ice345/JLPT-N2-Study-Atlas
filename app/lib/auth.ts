import { and, eq } from "drizzle-orm";
import { getChatGPTUser } from "@/app/chatgpt-auth";
import { getDb } from "@/db";
import {
  aiStudyPlans,
  authIdentities,
  practiceAttempts,
  practiceSessions,
  studyEvents,
  studyProfiles,
  users,
} from "@/db/schema";

export type AppUser = {
  id: string;
  displayName?: string;
  email?: string;
  provider: string;
};

export interface AuthProvider {
  currentUser(): Promise<AppUser | null>;
}

type ProviderIdentity = {
  provider: string;
  providerUserId: string;
  displayName?: string;
  email?: string;
};

async function migrateLegacyEmailRows(userId: string, email: string) {
  const db = getDb();
  await Promise.all([
    db.update(studyProfiles).set({ userId }).where(eq(studyProfiles.userId, email)),
    db.update(practiceSessions).set({ userId }).where(eq(practiceSessions.userId, email)),
    db.update(practiceAttempts).set({ userId }).where(eq(practiceAttempts.userId, email)),
    db.update(aiStudyPlans).set({ userId }).where(eq(aiStudyPlans.userId, email)),
  ]);

  const legacyAttempts = await db
    .select()
    .from(practiceAttempts)
    .where(eq(practiceAttempts.userId, userId))
    .limit(1000);
  for (const attempt of legacyAttempts) {
    await db
      .insert(studyEvents)
      .values({
        id: `legacy-attempt-${attempt.id}`,
        clientEventId: `legacy-attempt-${attempt.id}`,
        userId,
        deviceId: "legacy-cloud",
        type: "practice_answer",
        contentType:
          attempt.area === "reading"
            ? "reading"
            : attempt.area === "listening"
              ? "listening"
              : "problem",
        contentId: attempt.questionId,
        domain: attempt.area,
        skill: attempt.skill,
        correct: attempt.correct,
        createdAt: attempt.createdAt,
        receivedAt: new Date().toISOString(),
      })
      .onConflictDoNothing({ target: [studyEvents.userId, studyEvents.clientEventId] });
  }
}

async function resolveAppUser(identity: ProviderIdentity): Promise<AppUser> {
  const db = getDb();
  const matches = await db
    .select()
    .from(authIdentities)
    .where(
      and(
        eq(authIdentities.provider, identity.provider),
        eq(authIdentities.providerUserId, identity.providerUserId),
      ),
    )
    .limit(1);
  const match = matches[0];
  const now = new Date().toISOString();

  if (match) {
    await Promise.all([
      db
        .update(authIdentities)
        .set({ email: identity.email ?? null, updatedAt: now })
        .where(eq(authIdentities.id, match.id)),
      db
        .update(users)
        .set({
          displayName: identity.displayName ?? null,
          email: identity.email ?? null,
          updatedAt: now,
        })
        .where(eq(users.id, match.userId)),
    ]);
    return {
      id: match.userId,
      displayName: identity.displayName,
      email: identity.email,
      provider: identity.provider,
    };
  }

  const userId = crypto.randomUUID();
  const identityId = crypto.randomUUID();
  try {
    await db.insert(users).values({
      id: userId,
      displayName: identity.displayName ?? null,
      email: identity.email ?? null,
      createdAt: now,
      updatedAt: now,
    });
    await db.insert(authIdentities).values({
      id: identityId,
      userId,
      provider: identity.provider,
      providerUserId: identity.providerUserId,
      email: identity.email ?? null,
      createdAt: now,
      updatedAt: now,
    });
  } catch (error) {
    const concurrent = await db
      .select()
      .from(authIdentities)
      .where(
        and(
          eq(authIdentities.provider, identity.provider),
          eq(authIdentities.providerUserId, identity.providerUserId),
        ),
      )
      .limit(1);
    if (!concurrent[0]) throw error;
    return {
      id: concurrent[0].userId,
      displayName: identity.displayName,
      email: identity.email,
      provider: identity.provider,
    };
  }

  if (identity.email) await migrateLegacyEmailRows(userId, identity.email);
  return {
    id: userId,
    displayName: identity.displayName,
    email: identity.email,
    provider: identity.provider,
  };
}

export class ChatGPTAuthProvider implements AuthProvider {
  async currentUser() {
    const user = await getChatGPTUser();
    if (!user) return null;
    return resolveAppUser({
      provider: "chatgpt",
      providerUserId: user.providerUserId,
      displayName: user.displayName,
      email: user.email,
    });
  }
}

const defaultAuthProvider: AuthProvider = new ChatGPTAuthProvider();

export function getCurrentAppUser() {
  return defaultAuthProvider.currentUser();
}
