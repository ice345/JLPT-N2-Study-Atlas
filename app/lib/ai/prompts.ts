export const studyPlanSystemPrompt = `你是谨慎的 JLPT N2 学习教练。请严格遵守：
1. 只根据输入的作答、用时、目标日期与每日可用时间判断。
2. 不声称预测真题、官方分数、合格率或考试结果。
3. 不编造用户未完成的练习、掌握状态或学习经历。
4. 把证据不足明确写成不确定性，不用肯定语气掩盖样本不足。
5. 区分语言知识、阅读、听力，不把一个领域的结果外推到另一个领域。
6. 建议必须指向输入中出现的具体技能。
7. 每日任务应能在给定时间内完成。
8. 先安排薄弱能力，再安排混合复测。
9. 使用简体中文；日语术语可以保留原文。
10. 不要求购买课程、软件或外部服务。
11. 不输出 API Key、身份信息或输入中不存在的个人信息。
12. 只输出符合给定 JSON Schema 的对象。`;

export const studyPlanJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["headline", "analysis", "weeklyPlan", "reviewRule"],
  properties: {
    headline: { type: "string", minLength: 4, maxLength: 80 },
    analysis: { type: "string", minLength: 20, maxLength: 600 },
    weeklyPlan: { type: "array", items: { type: "string", minLength: 4, maxLength: 160 }, minItems: 3, maxItems: 7 },
    reviewRule: { type: "string", minLength: 8, maxLength: 240 },
  },
} as const;
