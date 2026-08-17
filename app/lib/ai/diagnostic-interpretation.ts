import { practiceQuestions } from "@/app/data/practice";
import {
  getProblemCatalogEntry,
  getUnitCatalogEntry,
  isCatalogHref,
  isCatalogProblemId,
  problemCatalog,
} from "@/app/lib/learning-catalog";
import type { AttemptRecord } from "@/app/lib/study";

export type DiagnosticEvidenceItem = {
  skillId: string;
  label: string;
  correct: number;
  total: number;
  percent: number;
  confidence: "insufficient" | "emerging" | "stable";
  evidence: string;
  problemId: string;
  unitId?: string;
  href: string;
};

export type AiDiagnosticInterpretation = {
  summary: string;
  strengths: { skillId: string; evidence: string; interpretation: string }[];
  risks: { skillId: string; evidence: string; interpretation: string }[];
  priorities: { problemId: string; unitId?: string; reason: string; action: string }[];
  needsMoreEvidence: { skillId: string; reason: string }[];
  next7Days: { day: number; tasks: { href: string; label: string; minutes: number }[] }[];
};

const questionsById = new Map(practiceQuestions.map((question) => [question.id, question]));

function percentage(correct: number, total: number) {
  return total ? Math.round((correct / total) * 100) : 0;
}

function confidenceFor(total: number): DiagnosticEvidenceItem["confidence"] {
  return total >= 3 ? "stable" : total >= 2 ? "emerging" : "insufficient";
}

function confidenceLabel(confidence: DiagnosticEvidenceItem["confidence"]) {
  return confidence === "stable" ? "样本较稳定" : confidence === "emerging" ? "仍需复测" : "证据不足";
}

export function buildDiagnosticEvidence(attempts: AttemptRecord[]) {
  const groups = new Map<string, Omit<DiagnosticEvidenceItem, "percent" | "confidence" | "evidence">>();
  for (const attempt of attempts) {
    const question = questionsById.get(attempt.questionId);
    if (!question) continue;
    const problem = getProblemCatalogEntry(question.problem);
    if (!problem) continue;
    const unit = question.relatedContentIds.map(getUnitCatalogEntry).find(Boolean);
    const skillId = `${question.problem}:${question.skill}`;
    const current = groups.get(skillId) ?? {
      skillId,
      label: question.skill,
      correct: 0,
      total: 0,
      problemId: question.problem,
      unitId: unit?.unitId,
      href: unit?.href ?? problem.href,
    };
    current.total += 1;
    if (attempt.correct) current.correct += 1;
    groups.set(skillId, current);
  }
  return [...groups.values()].map<DiagnosticEvidenceItem>((item) => {
    const percent = percentage(item.correct, item.total);
    const confidence = confidenceFor(item.total);
    return {
      ...item,
      percent,
      confidence,
      evidence: `${item.correct}/${item.total} 正确（${percent}%）· ${confidenceLabel(confidence)}`,
    };
  });
}

function text(value: unknown, min: number, max: number) {
  return typeof value === "string" && value.length >= min && value.length <= max ? value : null;
}

function normaliseSkillItems(
  value: unknown,
  evidenceById: Map<string, DiagnosticEvidenceItem>,
) {
  if (!Array.isArray(value) || value.length > 4) return null;
  const items = value.map((candidate) => {
    if (!candidate || typeof candidate !== "object") return null;
    const record = candidate as Record<string, unknown>;
    const skillId = text(record.skillId, 2, 240);
    const interpretation = text(record.interpretation, 8, 400);
    const lockedEvidence = skillId ? evidenceById.get(skillId) : undefined;
    return skillId && interpretation && lockedEvidence
      ? { skillId, evidence: lockedEvidence.evidence, interpretation }
      : null;
  });
  return items.every(Boolean) ? items as NonNullable<(typeof items)[number]>[] : null;
}

export function normaliseAiDiagnosticInterpretation(
  value: unknown,
  evidence: DiagnosticEvidenceItem[],
  dailyMinutes: number,
): AiDiagnosticInterpretation | null {
  if (!value || typeof value !== "object") return null;
  const record = value as Record<string, unknown>;
  const summary = text(record.summary, 20, 600);
  const evidenceById = new Map(evidence.map((item) => [item.skillId, item]));
  const strengths = normaliseSkillItems(record.strengths, evidenceById);
  const risks = normaliseSkillItems(record.risks, evidenceById);
  if (!summary || !strengths || !risks || !Array.isArray(record.priorities) || record.priorities.length > 4
    || !Array.isArray(record.needsMoreEvidence) || record.needsMoreEvidence.length > 8
    || !Array.isArray(record.next7Days) || record.next7Days.length !== 7) return null;

  const priorities = record.priorities.map((candidate) => {
    if (!candidate || typeof candidate !== "object") return null;
    const item = candidate as Record<string, unknown>;
    const problemId = text(item.problemId, 2, 100);
    const unitId = item.unitId === null || item.unitId === undefined ? undefined : text(item.unitId, 2, 140) ?? undefined;
    const reason = text(item.reason, 8, 300);
    const action = text(item.action, 4, 180);
    if (!problemId || !isCatalogProblemId(problemId) || !reason || !action) return null;
    if (unitId && getUnitCatalogEntry(unitId)?.problemId !== problemId) return null;
    return { problemId, unitId, reason, action };
  });
  if (!priorities.every(Boolean)) return null;

  const needsMoreEvidence = record.needsMoreEvidence.map((candidate) => {
    if (!candidate || typeof candidate !== "object") return null;
    const item = candidate as Record<string, unknown>;
    const skillId = text(item.skillId, 2, 240);
    const reason = text(item.reason, 8, 300);
    return skillId && reason && evidenceById.has(skillId) ? { skillId, reason } : null;
  });
  if (!needsMoreEvidence.every(Boolean)) return null;

  const safeDailyMinutes = Math.min(180, Math.max(10, Math.round(dailyMinutes)));
  const next7Days = record.next7Days.map((candidate) => {
    if (!candidate || typeof candidate !== "object") return null;
    const item = candidate as Record<string, unknown>;
    if (!Number.isInteger(item.day) || Number(item.day) < 1 || Number(item.day) > 7 || !Array.isArray(item.tasks) || !item.tasks.length || item.tasks.length > 3) return null;
    const tasks = item.tasks.map((candidateTask) => {
      if (!candidateTask || typeof candidateTask !== "object") return null;
      const task = candidateTask as Record<string, unknown>;
      const href = text(task.href, 2, 240);
      const label = text(task.label, 2, 100);
      const minutes = Number(task.minutes);
      return href && isCatalogHref(href) && label && Number.isInteger(minutes) && minutes >= 5 && minutes <= safeDailyMinutes
        ? { href, label, minutes }
        : null;
    });
    if (!tasks.every(Boolean) || tasks.reduce((sum, task) => sum + (task?.minutes ?? 0), 0) > safeDailyMinutes) return null;
    return { day: Number(item.day), tasks: tasks as NonNullable<(typeof tasks)[number]>[] };
  });
  if (!next7Days.every(Boolean) || new Set(next7Days.map((item) => item?.day)).size !== 7) return null;

  return {
    summary,
    strengths,
    risks,
    priorities: priorities as NonNullable<(typeof priorities)[number]>[],
    needsMoreEvidence: needsMoreEvidence as NonNullable<(typeof needsMoreEvidence)[number]>[],
    next7Days: (next7Days as NonNullable<(typeof next7Days)[number]>[]).sort((left, right) => left.day - right.day),
  };
}

export function makeFallbackInterpretation(
  evidence: DiagnosticEvidenceItem[],
  dailyMinutes: number,
): AiDiagnosticInterpretation {
  const sufficient = evidence.filter((item) => item.total >= 2);
  const strengths = [...sufficient].sort((left, right) => right.percent - left.percent || right.total - left.total).slice(0, 3);
  const risks = [...sufficient].sort((left, right) => left.percent - right.percent || right.total - left.total).slice(0, 3);
  const priorities = risks.length ? risks : [...evidence].sort((left, right) => left.percent - right.percent).slice(0, 3);
  const fallbackTarget = problemCatalog[0];
  const minutes = Math.min(25, Math.max(10, Math.round(dailyMinutes)));
  return {
    summary: evidence.length
      ? `系统只依据 ${evidence.reduce((sum, item) => sum + item.total, 0)} 条站内作答安排学习顺序；样本较少的能力不会被直接判定为优势或弱项。`
      : "当前还没有足够的站内作答证据；先完成标准诊断，再根据题型样本安排学习顺序。",
    strengths: strengths.map((item) => ({ skillId: item.skillId, evidence: item.evidence, interpretation: "当前表现相对稳定，仍应在混合题中复测。" })),
    risks: risks.map((item) => ({ skillId: item.skillId, evidence: item.evidence, interpretation: "该能力在现有样本中更需要优先核对判断依据。" })),
    priorities: priorities.map((item) => ({ problemId: item.problemId, unitId: item.unitId, reason: item.evidence, action: `学习“${item.label}”对应内容后完成短练习。` })),
    needsMoreEvidence: evidence.filter((item) => item.confidence === "insufficient").slice(0, 8).map((item) => ({ skillId: item.skillId, reason: "当前只有 1 个样本，不能据此稳定判断强弱。" })),
    next7Days: Array.from({ length: 7 }, (_, index) => {
      const target = priorities[index % Math.max(1, priorities.length)];
      return {
        day: index + 1,
        tasks: [{
          href: target?.href ?? fallbackTarget.href,
          label: target ? `复习：${target.label}` : `学习：${fallbackTarget.title}`,
          minutes,
        }],
      };
    }),
  };
}
