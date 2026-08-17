import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  displayName: text("display_name"),
  email: text("email"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [index("users_email_idx").on(table.email)]);

export const authIdentities = sqliteTable("auth_identities", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(),
  providerUserId: text("provider_user_id").notNull(),
  email: text("email"),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("auth_identity_provider_user_unique").on(table.provider, table.providerUserId),
  index("auth_identity_user_idx").on(table.userId),
]);

export const studyEvents = sqliteTable("study_events", {
  id: text("id").primaryKey(),
  clientEventId: text("client_event_id").notNull(),
  userId: text("user_id").notNull().references(() => users.id),
  deviceId: text("device_id").notNull(),
  type: text("type").notNull(),
  contentType: text("content_type").notNull(),
  contentId: text("content_id").notNull(),
  problemId: text("problem_id"),
  unitId: text("unit_id"),
  domain: text("domain").notNull(),
  skill: text("skill"),
  rating: text("rating"),
  correct: integer("correct", { mode: "boolean" }),
  durationSeconds: integer("duration_seconds"),
  createdAt: text("created_at").notNull(),
  receivedAt: text("received_at").notNull(),
}, (table) => [
  uniqueIndex("study_events_user_client_event_unique").on(table.userId, table.clientEventId),
  index("study_events_user_created_idx").on(table.userId, table.createdAt),
  index("study_events_user_received_idx").on(table.userId, table.receivedAt),
  index("study_events_user_content_idx").on(table.userId, table.contentId),
  index("study_events_user_problem_idx").on(table.userId, table.problemId),
  index("study_events_user_unit_idx").on(table.userId, table.unitId),
]);

export const studyProfiles = sqliteTable("study_profiles", {
  userId: text("user_id").primaryKey(),
  targetExamDate: text("target_exam_date"),
  dailyMinutes: integer("daily_minutes").notNull().default(25),
  updatedAt: text("updated_at").notNull(),
});

export const practiceSessions = sqliteTable("practice_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  mode: text("mode").notNull(),
  area: text("area").notNull(),
  questionIds: text("question_ids").notNull(),
  seed: text("seed"),
  answers: text("answers").notNull().default("{}"),
  startedAt: text("started_at").notNull(),
  completedAt: text("completed_at"),
});

export const practiceAttempts = sqliteTable("practice_attempts", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  sessionId: text("session_id").notNull(),
  questionId: text("question_id").notNull(),
  area: text("area").notNull(),
  skill: text("skill").notNull(),
  selectedAnswer: integer("selected_answer").notNull(),
  correct: integer("correct", { mode: "boolean" }).notNull(),
  createdAt: text("created_at").notNull(),
});

export const aiStudyPlans = sqliteTable("ai_study_plans", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull(),
  kind: text("kind").notNull(),
  sourceAttemptCount: integer("source_attempt_count").notNull(),
  payload: text("payload").notNull(),
  generatedAt: text("generated_at").notNull(),
});

export const aiCredentials = sqliteTable("ai_credentials", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  provider: text("provider").notNull(),
  endpoint: text("endpoint").notNull(),
  model: text("model").notNull(),
  ciphertext: text("ciphertext").notNull(),
  iv: text("iv").notNull(),
  keyVersion: integer("key_version").notNull().default(1),
  lastFour: text("last_four").notNull(),
  createdAt: text("created_at").notNull(),
  updatedAt: text("updated_at").notNull(),
}, (table) => [
  uniqueIndex("ai_credentials_user_unique").on(table.userId),
  index("ai_credentials_user_idx").on(table.userId),
]);
