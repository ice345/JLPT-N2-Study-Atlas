import { and, desc, eq, inArray } from "drizzle-orm";
import { apiUnauthorized, jsonError, requireApiUser } from "@/app/lib/api";
import { decryptCredential } from "@/app/lib/ai/credentials";
import {
  buildDiagnosticEvidence,
  makeFallbackInterpretation,
  normaliseAiDiagnosticInterpretation,
  type AiDiagnosticInterpretation,
} from "@/app/lib/ai/diagnostic-interpretation";
import { requestResponsesApi, validateProviderInput, type ValidatedAiProvider } from "@/app/lib/ai/provider";
import { studyPlanJsonSchema, studyPlanSystemPrompt } from "@/app/lib/ai/prompts";
import { problemCatalog, unitCatalog } from "@/app/lib/learning-catalog";
import { makeRulePlan, type AttemptRecord } from "@/app/lib/study";
import { getDb, getRuntimeEnv } from "@/db";
import { aiCredentials, aiStudyPlans, practiceAttempts, studyEvents, studyProfiles } from "@/db/schema";

type NarrativePlan = {
  headline: string;
  analysis: string;
  weeklyPlan: string[];
  reviewRule: string;
  interpretation: AiDiagnosticInterpretation;
};

type PlanRequest = {
  provider?: unknown;
  local?: {
    attempts?: unknown;
    targetExamDate?: unknown;
    dailyMinutes?: unknown;
  };
};

function weeklyPlan(interpretation: AiDiagnosticInterpretation) {
  return interpretation.next7Days.map((day) => `第 ${day.day} 天：${day.tasks.map((task) => `${task.label} ${task.minutes} 分钟`).join("；")}`);
}

function fallbackPlan(rule: ReturnType<typeof makeRulePlan>, attempts: AttemptRecord[]): NarrativePlan {
  const interpretation = makeFallbackInterpretation(buildDiagnosticEvidence(attempts), rule.dailyMinutes);
  return {
    headline: `从${rule.focus === "language" ? "语言知识" : rule.focus === "reading" ? "阅读" : "听力"}开始，建立稳定得分点。`,
    analysis: interpretation.summary,
    weeklyPlan: weeklyPlan(interpretation),
    reviewRule: "分数与证据由站内确定性引擎计算；错题隔天重做，连续两次答对后进入混合复测。",
    interpretation,
  };
}

function siteProvider() {
  const runtime = getRuntimeEnv();
  if (!runtime?.OPENAI_API_KEY) return null;
  return validateProviderInput({
    provider: "openai",
    apiKey: runtime.OPENAI_API_KEY,
    model: runtime.OPENAI_MODEL || "gpt-5.6-luna",
  });
}

async function savedProvider(userId: string, credentialId: string) {
  const runtime = getRuntimeEnv();
  if (!runtime?.AI_CREDENTIAL_MASTER_KEY) throw new Error("Secure credentials are unavailable");
  const rows = await getDb().select().from(aiCredentials).where(and(
    eq(aiCredentials.id, credentialId),
    eq(aiCredentials.userId, userId),
  )).limit(1);
  const row = rows[0];
  if (!row) throw new Error("Saved credential was not found");
  const apiKey = await decryptCredential(row.ciphertext, row.iv, runtime.AI_CREDENTIAL_MASTER_KEY);
  const provider = validateProviderInput({ provider: row.provider, endpoint: row.endpoint, model: row.model, apiKey });
  if (!provider) throw new Error("Saved credential is invalid");
  return provider;
}

async function requestedProvider(value: unknown, userId?: string) {
  if (!value || typeof value !== "object") return null;
  const credentialId = (value as Record<string, unknown>).credentialId;
  if (typeof credentialId === "string" && credentialId) {
    if (!userId) throw new Error("Sign in to use a saved credential");
    return savedProvider(userId, credentialId);
  }
  const provider = validateProviderInput(value);
  if (!provider) throw new Error("Invalid personal provider");
  return provider;
}

function localAttempts(value: unknown): AttemptRecord[] {
  if (!Array.isArray(value)) return [];
  return value.slice(0, 500).flatMap((item): AttemptRecord[] => {
    if (!item || typeof item !== "object") return [];
    const candidate = item as Record<string, unknown>;
    if (!(["language", "reading", "listening"] as unknown[]).includes(candidate.area)
      || typeof candidate.questionId !== "string" || candidate.questionId.length > 180
      || typeof candidate.skill !== "string" || candidate.skill.length > 180
      || typeof candidate.correct !== "boolean"
      || typeof candidate.createdAt !== "string" || Number.isNaN(Date.parse(candidate.createdAt))) return [];
    return [{
      questionId: candidate.questionId,
      area: candidate.area as AttemptRecord["area"],
      skill: candidate.skill,
      correct: candidate.correct,
      createdAt: candidate.createdAt,
    }];
  });
}

async function createNarrative(
  rule: ReturnType<typeof makeRulePlan>,
  targetExamDate: string | null,
  attempts: AttemptRecord[],
  provider: ValidatedAiProvider | null,
) {
  const evidence = buildDiagnosticEvidence(attempts);
  const fallback = fallbackPlan(rule, attempts);
  const selectedProvider = provider ?? siteProvider();
  if (!selectedProvider) return { narrative: fallback, source: "rule" as const };
  const summary = {
    targetExamDate,
    dailyMinutes: rule.dailyMinutes,
    focus: rule.focus,
    scores: rule.scores,
    lockedEvidence: evidence,
    allowedTargets: [...problemCatalog, ...unitCatalog].map((entry) => ({
      problemId: entry.problemId,
      unitId: entry.unitId ?? null,
      href: entry.href,
      label: entry.title,
    })),
  };
  try {
    const outputText = await requestResponsesApi(selectedProvider, {
      model: selectedProvider.model,
      input: [
        { role: "system", content: [{ type: "input_text", text: studyPlanSystemPrompt }] },
        { role: "user", content: [{ type: "input_text", text: JSON.stringify(summary) }] },
      ],
      text: { format: { type: "json_schema", name: "study_diagnostic_interpretation", strict: true, schema: studyPlanJsonSchema } },
    });
    const interpretation = normaliseAiDiagnosticInterpretation(JSON.parse(outputText), evidence, rule.dailyMinutes);
    if (!interpretation) return { narrative: fallback, source: "rule" as const };
    return {
      narrative: {
        headline: `从${rule.focus === "language" ? "语言知识" : rule.focus === "reading" ? "阅读" : "听力"}开始，按证据安排下一步。`,
        analysis: interpretation.summary,
        weeklyPlan: weeklyPlan(interpretation),
        reviewRule: "AI 只解释站内锁定证据；分数、置信度与课程链接不会交给 AI 重算。",
        interpretation,
      },
      source: "ai" as const,
    };
  } catch {
    return { narrative: fallback, source: "rule" as const };
  }
}

export async function POST(request: Request) {
  let body: PlanRequest = {};
  try {
    body = await request.json() as PlanRequest;
  } catch {
    // Empty input is valid for a signed-in learner using the site's optional provider.
  }
  const user = await requireApiUser();
  let provider: ValidatedAiProvider | null = null;
  if (body.provider !== undefined) {
    try {
      provider = await requestedProvider(body.provider, user?.id);
    } catch {
      return jsonError("个人 AI 配置无效，或保存的配置当前不可用。", 400);
    }
  }

  if (!user) {
    if (!provider) return apiUnauthorized();
    const attempts = localAttempts(body.local?.attempts);
    if (!attempts.length) return jsonError("请先完成练习，再生成 AI 学习计划。", 400);
    const dailyMinutes = typeof body.local?.dailyMinutes === "number"
      ? Math.min(180, Math.max(10, Math.round(body.local.dailyMinutes))) : 25;
    const targetExamDate = typeof body.local?.targetExamDate === "string" && /^\d{4}-\d{2}-\d{2}$/u.test(body.local.targetExamDate)
      ? body.local.targetExamDate : null;
    const rule = makeRulePlan(attempts, dailyMinutes);
    const generated = await createNarrative(rule, targetExamDate, attempts, provider);
    return Response.json({
      plan: { ...rule, ...generated.narrative, source: generated.source, generatedAt: new Date().toISOString(), targetExamDate },
      updated: true,
    });
  }

  const db = getDb();
  const [legacyAttemptRows, eventRows, profileRows, previousRows] = await Promise.all([
    db.select().from(practiceAttempts).where(eq(practiceAttempts.userId, user.id)).orderBy(desc(practiceAttempts.createdAt)).limit(240),
    db.select().from(studyEvents).where(and(
      eq(studyEvents.userId, user.id),
      inArray(studyEvents.type, ["practice_answer", "diagnostic_answer"]),
    )).orderBy(desc(studyEvents.createdAt)).limit(500),
    db.select().from(studyProfiles).where(eq(studyProfiles.userId, user.id)).limit(1),
    db.select().from(aiStudyPlans).where(eq(aiStudyPlans.userId, user.id)).orderBy(desc(aiStudyPlans.generatedAt)).limit(1),
  ]);
  const cloudEvents = eventRows.filter((event) => typeof event.correct === "boolean");
  const attemptRows = [
    ...cloudEvents.map((event) => ({
      questionId: event.contentId,
      area: event.domain,
      skill: event.skill ?? "综合判断",
      correct: Boolean(event.correct),
      createdAt: event.createdAt,
    })),
    ...legacyAttemptRows,
  ].filter((attempt, index, list) => list.findIndex((candidate) =>
    candidate.questionId === attempt.questionId && candidate.createdAt === attempt.createdAt
  ) === index).sort((left, right) => right.createdAt.localeCompare(left.createdAt)).slice(0, 500);
  const previous = previousRows[0];
  const newAttemptCount = previous ? attemptRows.filter((attempt) => attempt.createdAt > previous.generatedAt).length : attemptRows.length;
  const elapsedDays = previous ? (Date.now() - Date.parse(previous.generatedAt)) / 86_400_000 : Infinity;
  if (!provider && previous && (elapsedDays < 7 || newAttemptCount < 12)) {
    return Response.json({
      plan: JSON.parse(previous.payload),
      updated: false,
      nextUpdate: { days: Math.max(0, Math.ceil(7 - elapsedDays)), attempts: Math.max(0, 12 - newAttemptCount) },
    });
  }
  const attempts: AttemptRecord[] = attemptRows.map((attempt) => ({
    questionId: attempt.questionId,
    area: attempt.area as AttemptRecord["area"],
    skill: attempt.skill,
    correct: attempt.correct,
    createdAt: attempt.createdAt,
  }));
  const profile = profileRows[0];
  const rule = makeRulePlan(attempts, profile?.dailyMinutes ?? 25);
  const generated = await createNarrative(rule, profile?.targetExamDate ?? null, attempts, provider);
  const plan = {
    ...rule,
    ...generated.narrative,
    source: generated.source,
    generatedAt: new Date().toISOString(),
    targetExamDate: profile?.targetExamDate ?? null,
  };
  await db.insert(aiStudyPlans).values({
    id: crypto.randomUUID(),
    userId: user.id,
    kind: "weekly",
    sourceAttemptCount: attemptRows.length,
    payload: JSON.stringify(plan),
    generatedAt: plan.generatedAt,
  });
  return Response.json({ plan, updated: true });
}
