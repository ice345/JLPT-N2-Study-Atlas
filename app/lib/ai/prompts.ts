export const studyPlanSystemPrompt = `你是谨慎的 JLPT N2 学习诊断解释器。请严格遵守：
1. 输入中的 scores、lockedEvidence、confidence 与 allowedTargets 已由确定性引擎计算；不得重新计算、修正或预测分数。
2. 不声称预测真题、官方分数、合格率或考试结果。
3. 不编造用户未完成的练习、掌握状态或学习经历。
4. 把证据不足明确写成不确定性，不用肯定语气掩盖样本不足。
5. 区分语言知识、阅读、听力，不把一个领域的结果外推到另一个领域。
6. strengths、risks 与 needsMoreEvidence 的 skillId 只能从 lockedEvidence 选择；evidence 字段必须原样复制相应 lockedEvidence.evidence。
7. priorities 和 next7Days 只能使用 allowedTargets 中完全一致的 problemId、unitId 与 href；不得编造课程或链接。
8. 每日任务总时长不得超过 dailyMinutes。
9. 先安排有充分证据的薄弱能力；只有 1 个样本的能力放入 needsMoreEvidence，不作肯定强弱判断。
10. 使用简体中文；日语术语可以保留原文。
11. 不要求购买课程、软件或外部服务。
12. 不输出 API Key、身份信息或输入中不存在的个人信息。
13. 只输出符合给定 JSON Schema 的对象。`;

export const studyPlanJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["summary", "strengths", "risks", "priorities", "needsMoreEvidence", "next7Days"],
  properties: {
    summary: { type: "string", minLength: 20, maxLength: 600 },
    strengths: {
      type: "array", maxItems: 4,
      items: { type: "object", additionalProperties: false, required: ["skillId", "evidence", "interpretation"], properties: {
        skillId: { type: "string", minLength: 2, maxLength: 240 },
        evidence: { type: "string", minLength: 4, maxLength: 200 },
        interpretation: { type: "string", minLength: 8, maxLength: 400 },
      } },
    },
    risks: {
      type: "array", maxItems: 4,
      items: { type: "object", additionalProperties: false, required: ["skillId", "evidence", "interpretation"], properties: {
        skillId: { type: "string", minLength: 2, maxLength: 240 },
        evidence: { type: "string", minLength: 4, maxLength: 200 },
        interpretation: { type: "string", minLength: 8, maxLength: 400 },
      } },
    },
    priorities: {
      type: "array", maxItems: 4,
      items: { type: "object", additionalProperties: false, required: ["problemId", "unitId", "reason", "action"], properties: {
        problemId: { type: "string", minLength: 2, maxLength: 100 },
        unitId: { type: ["string", "null"], minLength: 2, maxLength: 140 },
        reason: { type: "string", minLength: 8, maxLength: 300 },
        action: { type: "string", minLength: 4, maxLength: 180 },
      } },
    },
    needsMoreEvidence: {
      type: "array", maxItems: 8,
      items: { type: "object", additionalProperties: false, required: ["skillId", "reason"], properties: {
        skillId: { type: "string", minLength: 2, maxLength: 240 },
        reason: { type: "string", minLength: 8, maxLength: 300 },
      } },
    },
    next7Days: {
      type: "array", minItems: 7, maxItems: 7,
      items: { type: "object", additionalProperties: false, required: ["day", "tasks"], properties: {
        day: { type: "integer", minimum: 1, maximum: 7 },
        tasks: { type: "array", minItems: 1, maxItems: 3, items: { type: "object", additionalProperties: false, required: ["href", "label", "minutes"], properties: {
          href: { type: "string", minLength: 2, maxLength: 240 },
          label: { type: "string", minLength: 2, maxLength: 100 },
          minutes: { type: "integer", minimum: 5, maximum: 180 },
        } } },
      } },
    },
  },
} as const;
