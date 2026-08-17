export type ReadingModule = {
  slug: string;
  number: string;
  japanese: string;
  title: string;
  lead: string;
  metrics: { value: string; label: string }[];
  flow: string[];
  models: { title: string; signal: string; action: string }[];
  evidence: { case: string; question: string; takeaway: string }[];
  traps: { title: string; wrong: string; correct: string }[];
  checklist: string[];
  sources: string[];
};

export const readingModules: ReadingModule[] = [
  {
    slug: "q10",
    number: "10",
    japanese: "内容理解・短文",
    title: "一篇只做一件事：锁定设问需要的那一层",
    lead: "短文题并不等于简单题。通知、邮件、说明与意见文会混在一起，关键是先判断文本功能，再找一条能够完整支持答案的依据。",
    metrics: [
      { value: "5篇", label: "每篇一问" },
      { value: "5类", label: "常见文本功能" },
      { value: "1句", label: "核心依据" },
      { value: "零扩写", label: "答案边界" },
    ],
    flow: ["先读设问，圈出人物／时间／目的", "判断是通知、邮件、说明还是意见", "回原文找到直接依据句", "逐项检查有没有偷换范围"],
    models: [
      { title: "作者观点", signal: "筆者の考え・必要なこと", action: "找评价词和结论句，不选只在开头出现的背景。" },
      { title: "通知公告", signal: "お知らせ・期間・利用できない", action: "把时间、可用功能、不可用功能分三栏。" },
      { title: "说明过程", signal: "どのように・なぜ・仕組み", action: "按发生顺序复述，检查主语有没有换掉。" },
      { title: "邮件用件", signal: "送ってほしい・確認したい", action: "区分“现在请求”与“以后计划”。" },
      { title: "职责期限", signal: "担当者・までに・必要", action: "同时核对谁做、做什么、何时完成。" },
    ],
    evidence: [
      { case: "2024.07／铁路系统点检通知", question: "维护期间真正不能使用的功能", takeaway: "不要把“仍可浏览”的时刻表误选成暂停项目。" },
      { case: "2024.07／文具样品邮件", question: "邮件当前的用件", takeaway: "请求新色样品；未来订购数量只是补充计划。" },
      { case: "2024.07／昆虫育幼说明", question: "卵、叶片与幼虫的关系", takeaway: "动作顺序和动作主体必须同时一致。" },
      { case: "2020.12／公司内部传阅", question: "各部门负责人必须完成的动作", takeaway: "名单确认、修改通知与数量申报有不同截止日。" },
      { case: "2020.12／生活方式短论", question: "作者认可的核心观点", takeaway: "举例很多，结论仍是人生选择并非只有一种。" },
    ],
    traps: [
      { title: "把例子当结论", wrong: "选文中最具体、最好记的一句", correct: "例子要能被最后的总括句覆盖" },
      { title: "把未来当现在", wrong: "邮件里提到的计划就是本次请求", correct: "先找请求表达，再判断附带信息" },
      { title: "扩大范围", wrong: "一部分、某期间被改成全部、一直", correct: "数量、时间、对象一个都不能放大" },
      { title: "主语交换", wrong: "动作对了，所以答案就对", correct: "谁做、对谁做必须和原文一致" },
    ],
    checklist: ["设问关键词已圈出", "文本功能已确定", "答案有直接依据句", "时间／人物／范围全部一致", "没有加入原文未说的因果"],
    sources: ["JLPT_N2_真题/【2】2024年07月N2 真题.pdf", "JLPT_N2_听力原文/【3】2020年12月N2答案解析+听力原文+译文.pdf"],
  },
  {
    slug: "q11",
    number: "11",
    japanese: "内容理解・中文",
    title: "先给段落贴标签，再追作者怎样走到结论",
    lead: "中文理解通常一篇多问。第一问常考指代、理由或局部内容，后一问再考全文立场；只记细节会在最后一题失去方向。",
    metrics: [
      { value: "3篇", label: "中等长度" },
      { value: "2–3问", label: "局部到整体" },
      { value: "4功能", label: "段落标签" },
      { value: "先局部", label: "再全文" },
    ],
    flow: ["读问题，判断局部题还是全文题", "每段只写背景／问题／转折／主张", "指示词向前找最近且语义完整的对象", "用最后主张反查前面的例子"],
    models: [
      { title: "指示词", signal: "このような・それ・その点", action: "向前找完整动作或状态，不只取最近名词。" },
      { title: "理由说明", signal: "なぜ・理由・ため", action: "区分作者的原因和文中他人的解释。" },
      { title: "建议主张", signal: "必要だ・〜といい・べきだ", action: "把建议对象与做法绑在一起。" },
      { title: "态度变化", signal: "しかし・ただ・ところが", action: "转折前是铺垫，转折后才是作者真正限制。" },
      { title: "全文一致", signal: "筆者の考えに合う", action: "选能覆盖所有段落、但不过度概括的表述。" },
      { title: "抽象与例子", signal: "たとえば・つまり", action: "例子验证抽象句，不独立生成新观点。" },
    ],
    evidence: [
      { case: "2024.07／网络信息与偏见", question: "推荐机制的含义与作者的最终警告", takeaway: "便利是让步，偏向与思考固化才是主张焦点。" },
      { case: "2024.07／工作效率的波动", question: "排计划时的注意点", takeaway: "不能以最佳状态作为普通基准。" },
      { case: "2024.07／摄影中的个人视角", question: "怎样才算有内容的照片", takeaway: "反复出现的“自分だけ”把细节收束为作者立场。" },
      { case: "2020.12／孩子与讨厌的食物", question: "营养理由、教育意义与长期影响", takeaway: "三道题分别落在三层，不能用同一句包办。" },
      { case: "2020.12／压力的正面作用", question: "无压力状态与适度压力的价值", takeaway: "先辨反面假设，再回到作者正面结论。" },
      { case: "2020.12／摄影师的二次发现", question: "选择照片为何也属于拍摄", takeaway: "“拍时未觉察、选时发现”是推理桥梁。" },
    ],
    traps: [
      { title: "最近名词陷阱", wrong: "指示词一定指前一个名词", correct: "检查它能否替换成前一整句或整段" },
      { title: "让步误读", wrong: "作者承认优点＝作者支持", correct: "看しかし／ただ之后加了什么限制" },
      { title: "正确但没回答", wrong: "内容在文中出现就可以选", correct: "答案必须回应设问角度" },
      { title: "总结过大", wrong: "把局部建议扩大成人生原则", correct: "保留原文对象与适用条件" },
    ],
    checklist: ["每段已有四字以内标签", "局部题只看对应段落", "指示对象能完整代回", "转折后的限制已记录", "全文答案能覆盖末段主张"],
    sources: ["JLPT_N2_真题/【2】2024年07月N2 真题.pdf", "JLPT_N2_听力原文/【3】2020年12月N2答案解析+听力原文+译文.pdf"],
  },
  {
    slug: "q12",
    number: "12",
    japanese: "統合理解",
    title: "不要在脑中混合 A 与 B，把它们并排比较",
    lead: "統合理解不是两篇分别做完，而是先建立同一组比较轴。共同点、差异点、评价对象与建议必须放在对应栏里。",
    metrics: [
      { value: "A＋B", label: "两篇材料" },
      { value: "2问", label: "共同与差异" },
      { value: "4栏", label: "比较矩阵" },
      { value: "同轴", label: "才可比较" },
    ],
    flow: ["先读两道设问，确定比较轴", "只读 A，填 A 的原因／评价／建议", "只读 B，用完全相同的轴填表", "共同题取交集，差异题保留各自限定"],
    models: [
      { title: "共同原因", signal: "AとBが共通して", action: "找语义交集，不要求用词完全相同。" },
      { title: "不同建议", signal: "Aは〜、Bは〜", action: "人物与建议不能交叉配对。" },
      { title: "评价对象", signal: "どのように考えているか", action: "先确认两篇是在评价同一事物还是相邻概念。" },
      { title: "立场强度", signal: "必要・望ましい・可能", action: "区分必须、推荐、可能三种语气。" },
    ],
    evidence: [
      { case: "2020.12／睡眠不足 A・B", question: "共同原因", takeaway: "两篇都指向睡眠质量，而非单纯睡眠时长。" },
      { case: "2020.12／睡眠不足 A・B", question: "各自建议", takeaway: "A强调睡前行为与放松，B强调环境与寝具。" },
      { case: "2010–2024／历年比較题", question: "同一主题下的不同解决办法", takeaway: "先统一比较轴，可以避免把 A 的理由配给 B。" },
      { case: "2010–2024／历年比較题", question: "共同评价与各自限定", takeaway: "共同点取最小交集，不能把一方独有条件带进去。" },
    ],
    traps: [
      { title: "交叉配对", wrong: "A 的主张＋B 的理由", correct: "每一格都标 A 或 B 后再组合" },
      { title: "词面不同就判不同", wrong: "用词不同，所以没有共同点", correct: "先把两句话各自改写成中文核心" },
      { title: "只读一篇", wrong: "A 说得更清楚，所以用 A 推测 B", correct: "答案必须在两篇都找到证据" },
      { title: "强度升级", wrong: "“较好”被改成“必须”", correct: "保留原文语气强度" },
    ],
    checklist: ["比较轴来自设问", "A/B 分开记录", "共同点是语义交集", "差异点没有交换人物", "语气强度保持一致"],
    sources: ["JLPT_N2_听力原文/【3】2020年12月N2答案解析+听力原文+译文.pdf", "JLPT_N2_真题/【2】2024年07月N2 真题.pdf", "JLPT_N2_真题/【2】2019年12月N2 真题.pdf"],
  },
  {
    slug: "q13",
    number: "13",
    japanese: "主張理解・長文",
    title: "追踪论证路线，不被某一段的漂亮句子截走",
    lead: "长文通常用经历、反例或他人观点逐步推进。真正要记的不是每个细节，而是作者从问题出发，经过什么转折，最后得到什么判断。",
    metrics: [
      { value: "1篇", label: "长文" },
      { value: "3问", label: "局部到主张" },
      { value: "5节点", label: "论证地图" },
      { value: "末段", label: "最终校验" },
    ],
    flow: ["先读三道题，标局部题与主旨题", "给每段写问题／旧观点／转折／新观点／结论", "局部题回到对应节点", "主旨题沿整条路线验证，最后用末段校验"],
    models: [
      { title: "问题提出", signal: "〜ことがある・ではないか", action: "写清作者要解决的矛盾。" },
      { title: "旧观点", signal: "一般に・〜と思われる", action: "先标“他人／过去”，不要当作者结论。" },
      { title: "反例转向", signal: "しかし・ところが・実は", action: "记录旧观点在哪一点失效。" },
      { title: "机制解释", signal: "なぜなら・というのは", action: "把原因连回前一主张。" },
      { title: "最终主张", signal: "つまり・〜のではないか", action: "选择能覆盖论证过程的答案。" },
    ],
    evidence: [
      { case: "2024.07／阅读是一种创造", question: "具体行为、无聊书的意义、全文看法", takeaway: "从想象参与到读者创造，三问共享同一条论证线。" },
      { case: "2020.12／倾诉为何带来新视角", question: "最初需求、说话方式、最终作用", takeaway: "答案不是听者直接给建议，而是表达过程改变了思考框架。" },
      { case: "2010–2024／主张理解", question: "作者最终想说什么", takeaway: "正确项会保留对象、条件与方向，且能解释前文例子。" },
      { case: "2010–2024／划线与指示", question: "局部表达为何成立", takeaway: "局部题定位后仍需向前补原因、向后看结论。" },
    ],
    traps: [
      { title: "第一段定势", wrong: "开头提出的问题就是作者答案", correct: "开头通常只是论证起点" },
      { title: "金句截取", wrong: "选最像名言、最抽象的一项", correct: "检查它能否解释文中反例与结论" },
      { title: "他人观点", wrong: "文中出现次数多就是作者支持", correct: "标明说话者与态度变化" },
      { title: "条件丢失", wrong: "去掉“在某情况下”后扩大结论", correct: "把适用范围一起记进答案" },
    ],
    checklist: ["三题已分局部／全文", "每段只留一个功能", "他人观点与作者观点分开", "转折前后方向清楚", "主旨能解释全文例子"],
    sources: ["JLPT_N2_真题/【2】2024年07月N2 真题.pdf", "JLPT_N2_听力原文/【3】2020年12月N2答案解析+听力原文+译文.pdf"],
  },
  {
    slug: "q14",
    number: "14",
    japanese: "情報検索",
    title: "先把人物条件改写成清单，再去资料里做交集",
    lead: "情報検索的难点不是日语长句，而是多个条件散落在不同栏目。把资格、内容、时间、费用、申请方式分开，答案会从阅读题变成筛选题。",
    metrics: [
      { value: "1份", label: "公告／指南" },
      { value: "2问", label: "条件检索" },
      { value: "4–6项", label: "常见条件" },
      { value: "交集", label: "唯一答案" },
    ],
    flow: ["只读题干，把人物需求列成条件", "看资料标题和栏目，不从第一行通读", "按资格→内容→时间→方式逐项排除", "最后检查例外、截止日与不同提交渠道"],
    models: [
      { title: "资格", signal: "応募資格・対象・〜以上", action: "年龄、身份、居住地先做硬排除。" },
      { title: "作品／项目条件", signal: "未発表・一人一作品・部門", action: "内容、时长、发表史必须同时满足。" },
      { title: "时间", signal: "まで・必着・期間内", action: "区分信息登记日、寄出日与到达日。" },
      { title: "方式", signal: "郵送・インターネット・窓口", action: "同一活动的不同渠道可能有不同期限。" },
      { title: "费用／优惠", signal: "無料・別途・含む", action: "确认费用是否包含材料、邮费或同行者。" },
      { title: "组合条件", signal: "場合・方に限る・ただし", action: "例外项必须和主规则一起读。" },
    ],
    evidence: [
      { case: "2024.07／视频比赛候选人表", question: "谁满足现阶段全部応募条件", takeaway: "年龄、主题、时长、未发表四列缺一不可。" },
      { case: "2024.07／视频比赛提交方式", question: "网络提交要完成哪些步骤", takeaway: "先登记，再在另一截止日前上传；两个日期不可合并。" },
      { case: "2010–2024／活动与设施指南", question: "某人的时间与需求适合哪一项", takeaway: "先用硬条件排除，再比较软偏好。" },
      { case: "2010–2024／报名与费用说明", question: "最终需要做什么／支付多少", takeaway: "“包含”与“另付”决定最终金额。" },
    ],
    traps: [
      { title: "只满足最显眼条件", wrong: "主题合适就立刻选择", correct: "每个候选人逐列打勾" },
      { title: "日期合并", wrong: "登记与提交共用一个截止日", correct: "每个动作单独记录期限" },
      { title: "忽略例外", wrong: "只看主规则，不读ただし", correct: "例外会覆盖一般规则" },
      { title: "先通读资料", wrong: "从第一行慢慢读到最后", correct: "由题干条件决定扫描栏目" },
    ],
    checklist: ["人物需求已拆成清单", "硬条件先于偏好", "每个候选逐栏核对", "不同动作的日期分开", "ただし／場合已经检查"],
    sources: ["JLPT_N2_真题/【2】2024年07月N2 真题.pdf", "JLPT_N2_真题/【2】2019年07月N2 真题.pdf", "JLPT_N2_真题/【2】2018年12月N2 真题.pdf"],
  },
];

export function getReadingModule(slug: string) {
  return readingModules.find((module) => module.slug === slug);
}
