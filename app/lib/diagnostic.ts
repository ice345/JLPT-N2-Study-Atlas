import {
  diagnosticProblemKeys,
  practiceAreaNames,
  type PracticeArea,
  type PracticeQuestion,
} from "@/app/data/practice";

export type DiagnosticBand = "foundation" | "developing" | "approaching" | "ready" | "strong";
export type DiagnosticConfidence = "low" | "medium" | "high";

export type DiagnosticScore = {
  key: string;
  label: string;
  correct: number;
  total: number;
  percent: number;
};

export type DiagnosticReport = {
  correct: number;
  total: number;
  percent: number;
  averageSeconds: number;
  readiness: DiagnosticBand;
  readinessLabel: string;
  confidence: DiagnosticConfidence;
  confidenceLabel: string;
  coveredProblems: number;
  totalProblems: number;
  domainScores: DiagnosticScore[];
  problemScores: DiagnosticScore[];
  strongestSkills: DiagnosticScore[];
  weakestSkills: DiagnosticScore[];
};

const readinessLabels: Record<DiagnosticBand, string> = {
  foundation: "基础建立期",
  developing: "能力成长期",
  approaching: "接近 N2 要求",
  ready: "具备应试基础",
  strong: "稳定应试状态",
};

const confidenceLabels: Record<DiagnosticConfidence, string> = {
  low: "参考度较低",
  medium: "参考度中等",
  high: "参考度较高",
};

function percentage(correct: number, total: number) {
  return total ? Math.round((correct / total) * 100) : 0;
}

function scoreGroups(
  questions: PracticeQuestion[],
  answers: Record<string, number>,
  keyFor: (question: PracticeQuestion) => string,
  labelFor: (question: PracticeQuestion) => string,
) {
  const groups = new Map<string, { label: string; correct: number; total: number }>();
  for (const question of questions) {
    const key = keyFor(question);
    const current = groups.get(key) ?? { label: labelFor(question), correct: 0, total: 0 };
    current.total += 1;
    if (answers[question.id] === question.answer) current.correct += 1;
    groups.set(key, current);
  }
  return [...groups.entries()].map<DiagnosticScore>(([key, value]) => ({
    key,
    label: value.label,
    correct: value.correct,
    total: value.total,
    percent: percentage(value.correct, value.total),
  }));
}

export function analyzeDiagnostic(
  questions: PracticeQuestion[],
  answers: Record<string, number>,
  elapsedSeconds: number,
): DiagnosticReport {
  const correct = questions.filter((question) => answers[question.id] === question.answer).length;
  const percent = percentage(correct, questions.length);
  const readiness: DiagnosticBand = percent >= 85 ? "strong"
    : percent >= 72 ? "ready"
      : percent >= 58 ? "approaching"
        : percent >= 40 ? "developing"
          : "foundation";
  const coveredProblems = new Set(questions.map((question) => question.problem)).size;
  const confidence: DiagnosticConfidence = coveredProblems < diagnosticProblemKeys.length || questions.length < 30
    ? "low"
    : questions.length >= 50 ? "high" : "medium";

  const domainScores = scoreGroups(
    questions,
    answers,
    (question) => question.area,
    (question) => practiceAreaNames[question.area],
  ).sort((left, right) => ["language", "reading", "listening"].indexOf(left.key) - ["language", "reading", "listening"].indexOf(right.key));
  const problemScores = scoreGroups(
    questions,
    answers,
    (question) => question.problem,
    (question) => question.title,
  );
  const skillScores = scoreGroups(
    questions,
    answers,
    (question) => `${question.area}:${question.skill}`,
    (question) => question.skill,
  );
  const strongestSkills = [...skillScores]
    .sort((left, right) => right.percent - left.percent || right.total - left.total || left.label.localeCompare(right.label, "zh-CN"))
    .slice(0, 4);
  const weakestSkills = [...skillScores]
    .sort((left, right) => left.percent - right.percent || right.total - left.total || left.label.localeCompare(right.label, "zh-CN"))
    .slice(0, 4);

  return {
    correct,
    total: questions.length,
    percent,
    averageSeconds: questions.length ? Math.round(elapsedSeconds / questions.length) : 0,
    readiness,
    readinessLabel: readinessLabels[readiness],
    confidence,
    confidenceLabel: confidenceLabels[confidence],
    coveredProblems,
    totalProblems: diagnosticProblemKeys.length,
    domainScores,
    problemScores,
    strongestSkills,
    weakestSkills,
  };
}

export function nextDiagnosticStep(report: DiagnosticReport) {
  const weakestDomain = [...report.domainScores].sort((left, right) => left.percent - right.percent)[0];
  if (!weakestDomain) return "先完成一次诊断，再生成学习顺序。";
  const domain = weakestDomain.key as PracticeArea;
  const route = domain === "language" ? "/n2/language" : domain === "reading" ? "/n2/reading" : "/n2/listening";
  return { domain, route, label: `先学习${weakestDomain.label}中得分最低的题型，再做 8 题专项复测。` };
}
