import { practiceAreaNames, practiceQuestions, type PracticeArea } from "@/app/data/practice";

export type AttemptRecord = {
  questionId: string;
  area: PracticeArea;
  skill: string;
  correct: boolean;
  createdAt: string;
};

export type RulePlan = {
  focus: PracticeArea;
  dailyMinutes: number;
  scores: Record<PracticeArea, number | null>;
  focusSkills: string[];
  summary: string;
  dailyLoop: string[];
};

const areas = Object.keys(practiceAreaNames) as PracticeArea[];

export function makeRulePlan(attempts: AttemptRecord[], dailyMinutes = 25): RulePlan {
  const scores = {} as Record<PracticeArea, number | null>;
  for (const area of areas) {
    const entries = attempts.filter((item) => item.area === area);
    scores[area] = entries.length
      ? Math.round((entries.filter((item) => item.correct).length / entries.length) * 100)
      : null;
  }
  const focus = [...areas].sort((left, right) => (scores[left] ?? -1) - (scores[right] ?? -1))[0];
  const wrongBySkill = new Map<string, number>();
  attempts.filter((item) => !item.correct && item.area === focus).forEach((item) => {
    wrongBySkill.set(item.skill, (wrongBySkill.get(item.skill) ?? 0) + 1);
  });
  const focusSkills = [...wrongBySkill.entries()]
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3)
    .map(([skill]) => skill);
  const scoreLabel = scores[focus] === null ? "尚未形成足够作答记录" : `当前正确率 ${scores[focus]}%`;
  return {
    focus,
    dailyMinutes,
    scores,
    focusSkills,
    summary: `${practiceAreaNames[focus]} ${scoreLabel}，下一阶段先从这一部分开始。`,
    dailyLoop: [
      `先做 ${practiceAreaNames[focus]} 6–8 题短练习`,
      "逐题看错因，并打开对应学习页核对判断依据",
      "隔天重做错题，再用一组混合题确认是否掌握",
    ],
  };
}

export function getQuestions(ids: string[]) {
  return ids
    .map((id) => practiceQuestions.find((question) => question.id === id))
    .filter((question): question is (typeof practiceQuestions)[number] => Boolean(question));
}

export function isPracticeArea(value: unknown): value is PracticeArea {
  return value === "language" || value === "reading" || value === "listening";
}

export function safeDailyMinutes(value: unknown) {
  const parsed = typeof value === "number" ? value : Number.parseInt(String(value), 10);
  return Number.isFinite(parsed) ? Math.max(10, Math.min(180, parsed)) : 25;
}
