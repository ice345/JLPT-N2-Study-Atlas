import type { ProblemDefinition, StudyUnitDefinition } from "@/app/data/problem-definition";

type UnitInput = Omit<StudyUnitDefinition, "id" | "number" | "sourceRefs">;

function unit(problem: "problem-3" | "problem-5", index: number, input: UnitInput): StudyUnitDefinition {
  return {
    ...input,
    id: `${problem}-${input.slug}`,
    number: String(index + 1).padStart(2, "0"),
    sourceRefs: ["app/data/listening-content.ts"],
  };
}

const p3Inputs: UnitInput[] = [
  {
    slug: "summary-level", title: "主旨层级与一句话概括", japanese: "要点のレベル", estimatedMinutes: 7,
    objective: "把例子、背景和细节提升到共同主旨，不复述整段。",
    summary: ["先写谁在谈什么", "把例子归到同一上位概念", "用最后两句确认主张"],
    coverage: ["场景与话题", "细节／主旨层级", "一句话摘要", "末段校验"],
    noteInsight: "問題3的选项经常都在原文出现过；胜负不在听没听到，而在答案是否覆盖整段。",
    concepts: [
      { cue: "｜例《れい》が｜三《みっ》つ｜続《つづ》く", signal: "并列举例", direction: "不要分别记录，问三个例子共同说明什么。", example: "｜歯《は》は｜食事《しょくじ》だけでなく、｜発音《はつおん》や｜姿勢《しせい》にも｜関係《かんけい》します。", exampleMeaning: "牙齿不仅与进食有关，还与发音和姿势有关。", wrong: "选择其中最具体的一个作用。" },
      { cue: "つまり／｜要《よう》するに", signal: "总结信号", direction: "后面通常直接提升到主旨层级。", example: "つまり、｜移動《いどう》する｜過程《かてい》そのものが｜旅《たび》なのです。", exampleMeaning: "也就是说，移动的过程本身就是旅行。", wrong: "仍停留在前面的地点细节。" },
      { cue: "〜だけではない", signal: "扩大范围", direction: "作者正在把常见理解扩展到更高一层。", example: "｜技術《ぎじゅつ》だけではなく、｜何《なに》を｜表現《ひょうげん》するかが｜大切《たいせつ》です。", exampleMeaning: "重要的不只是技术，还在于表达什么。", wrong: "仍把技术高低当作主旨。" },
      { cue: "｜最後《さいご》の｜評価《ひょうか》", signal: "末段收束", direction: "最后的评价或建议优先于开场话题。", example: "｜大切《たいせつ》なのは、｜好《す》きな｜本《ほん》を｜繰《く》り｜返《かえ》し｜読《よ》むことです。", exampleMeaning: "重要的是反复阅读喜欢的书。", wrong: "选择开头提到的读书数量。" },
    ],
    traps: [{ title: "首句主题就是答案", contrast: "首句只是入口，主旨要等转折和末段。" }, { title: "具体细节更可信", contrast: "细节必须能被更上位的一句话共同覆盖。" }],
    drills: [
      { id: "p3-level-1", cue: "咀嚼、发音、姿势、表情都被提到。主旨最可能是？", choices: ["牙齿的多种作用", "正确刷牙时间", "牙医的工作", "发音方法"], answer: 0, reason: "多个并列例子共同说明牙齿具有多种作用。" },
      { id: "p3-level-2", cue: "『技術より、写真で何を伝えたいかが大切だ』。重点是？", choices: ["购买昂贵相机", "摄影技术", "表达意图", "旅行地点"], answer: 2, reason: "「より」之后给出说话人的更高优先级。" },
      { id: "p3-level-3", cue: "『遠くへ行くことだけが旅行ではない』。说话人如何重新定义旅行？", choices: ["距离越远越好", "移动过程也属于旅行", "不应旅行", "只去国外"], answer: 1, reason: "「だけではない」扩大了旅行的范围。" },
    ], relatedContentIds: ["listening-problem-3"],
  },
  {
    slug: "function-cause", title: "作用、原因与发生机制", japanese: "役割・原因・仕組み", estimatedMinutes: 8,
    objective: "区分“有什么作用”“为什么发生”和“怎样形成”三种主旨。",
    summary: ["作用题归纳多个功能", "原因题保留因果箭头", "机制题按过程收束"],
    coverage: ["作用／功能", "原因", "形成机制", "并列来源"],
    noteInsight: "当原文列出多个来源或功能时，答案往往是它们共同构成的机制，而不是其中一个来源。",
    concepts: [
      { cue: "｜役割《やくわり》／｜働《はたら》き", signal: "功能提问", direction: "把不同例子归为对象的整体作用。", example: "この｜膜《まく》には｜水分《すいぶん》を｜守《まも》る｜働《はたら》きがあります。", exampleMeaning: "这层膜具有保持水分的作用。", wrong: "选择制造材料等背景细节。" },
      { cue: "〜ため／〜ので", signal: "直接原因", direction: "确认前项是否真正解释后项，而非附带条件。", example: "｜野菜《やさい》が｜不足《ふそく》していたため、｜食生活《しょくせいかつ》を｜変《か》えました。", exampleMeaning: "因为蔬菜不足，所以改变了饮食。", wrong: "把改变后的行动当原因。" },
      { cue: "〜によってできる", signal: "形成机制", direction: "记录材料或条件如何组合成结果。", example: "｜雲《くも》は｜水蒸気《すいじょうき》が｜冷《ひ》えることによってできます。", exampleMeaning: "云是水蒸气冷却形成的。", wrong: "只记海或森林一个来源。" },
      { cue: "AもBもCも", signal: "多来源并列", direction: "答案要覆盖所有来源的共同结果。", example: "｜海《うみ》からも｜森《もり》からも｜水蒸気《すいじょうき》が｜生《う》まれます。", exampleMeaning: "海洋和森林都会产生水蒸气。", wrong: "把第一个来源说成唯一来源。" },
    ],
    traps: [{ title: "原因与措施倒置", contrast: "先画原因→结果，再标后续行动。" }, { title: "一个来源代替全部", contrast: "并列来源要上收为共同机制。" }],
    drills: [
      { id: "p3-cause-1", cue: "说话人依次说明咀嚼、发音、姿势。属于哪类主旨？", choices: ["契机", "作用", "价格", "顺序"], answer: 1, reason: "多个功能例子共同指向“作用”。" },
      { id: "p3-cause-2", cue: "『野菜が足りなかった。それで朝食を変えた』。原因是？", choices: ["蔬菜不足", "改变早餐", "开始运动", "工作太多"], answer: 0, reason: "不足是原因，改变早餐是后续行动。" },
      { id: "p3-cause-3", cue: "海、森林、烟都被列为云形成的来源。答案应概括什么？", choices: ["只有海水", "云的形成机制", "森林旅游", "烟的危害"], answer: 1, reason: "多来源共同服务于形成机制。" },
    ], relatedContentIds: ["listening-problem-3"],
  },
  {
    slug: "trigger-change", title: "契机、变化与趋势", japanese: "きっかけ・変化", estimatedMinutes: 8,
    objective: "在经历叙述中找到真正起点，并记录变化前后。",
    summary: ["过去状态写在左边", "契机画星号", "现在结果写在右边"],
    coverage: ["职业／兴趣契机", "过去→现在", "数量趋势", "态度变化"],
    noteInsight: "问题常会讲很长的背景，但真正的契机通常是一个具体事件；变化题则必须保留最终方向。",
    concepts: [
      { cue: "きっかけ", signal: "起点明示", direction: "后接开始职业、兴趣或行动的原因。", example: "｜一枚《いちまい》の｜写真《しゃしん》を｜見《み》たことがきっかけでした。", exampleMeaning: "契机是看到了一张照片。", wrong: "选择后来积累的经验。" },
      { cue: "それで｜初《はじ》めて", signal: "经历→开始", direction: "前面的具体事件触发第一次行动。", example: "それで｜初《はじ》めて｜山《やま》に｜登《のぼ》りました。", exampleMeaning: "于是第一次去爬了山。", wrong: "把当前职业当起点。" },
      { cue: "〜ようになった", signal: "状态变化", direction: "写清以前没有、现在出现的行为或能力。", example: "｜海外《かいがい》でも｜見《み》られるようになりました。", exampleMeaning: "在海外也变得可以看到了。", wrong: "仍描述过去范围。" },
      { cue: "｜増《ふ》えている／｜高《たか》まっている", signal: "趋势方向", direction: "多个数字是证据，答案写上升趋势。", example: "｜翻訳《ほんやく》される｜国《くに》が｜増《ふ》えています。", exampleMeaning: "被翻译发行的国家正在增加。", wrong: "只选择一个国家数字。" },
    ],
    traps: [{ title: "背景最长就是契机", contrast: "契机是让行动真正开始的具体瞬间。" }, { title: "过去事实覆盖现在", contrast: "变化题一定写出最终状态和方向。" }],
    drills: [
      { id: "p3-change-1", cue: "一张陌生花的照片让他第一次上山，后来成为摄影师。契机是？", choices: ["成为摄影师", "看到照片", "购买相机", "出版作品"], answer: 1, reason: "照片触发了第一次行动。" },
      { id: "p3-change-2", cue: "翻译国家和销量都持续增加。主旨方向是？", choices: ["海外人气上升", "成本增加", "国内减少", "翻译停止"], answer: 0, reason: "多个数据共同证明海外人气上升。" },
      { id: "p3-change-3", cue: "『以前は苦手だったが、今は楽しめるようになった』。最终状态是？", choices: ["仍然讨厌", "现在能享受", "尚未尝试", "以后可能停止"], answer: 1, reason: "ようになった标记当前变化结果。" },
    ], relatedContentIds: ["listening-problem-3"],
  },
  {
    slug: "method-viewpoint", title: "方法、主张与重新定义", japanese: "方法・主張・再定義", estimatedMinutes: 9,
    objective: "从困扰与常识铺垫中，听出说话人的解决方法和新观点。",
    summary: ["困扰只写一个词", "转折后标出方法", "最后用主张覆盖全文"],
    coverage: ["方法／工夫", "他人观点", "说话人主张", "重新定义", "综合陷阱"],
    noteInsight: "最有迷惑性的选项会完整复述问题或常识；正确答案通常来自说话人后来提出的方法或重新定义。",
    concepts: [
      { cue: "〜と｜思《おも》う｜人《ひと》もいるが", signal: "他论→转折", direction: "前半是常识或他人观点，等待说话人立场。", example: "｜遠《とお》くへ｜行《い》くことが｜旅《たび》だと｜思《おも》う｜人《ひと》もいますが…。", exampleMeaning: "有人认为去远方才算旅行，不过……", wrong: "把他人观点选作结论。" },
      { cue: "｜僕《ぼく》は／｜私《わたし》は", signal: "立场切换", direction: "后面往往是说话人的定义或评价。", example: "｜私《わたし》は｜移動《いどう》する｜時間《じかん》も｜旅《たび》だと｜思《おも》います。", exampleMeaning: "我认为移动的时间也属于旅行。", wrong: "仍跟随前面的常识。" },
      { cue: "｜優先順位《ゆうせんじゅんい》をつける", signal: "解决方法", direction: "从“时间不够”转向排序、取舍与执行。", example: "まず｜仕事《しごと》に｜優先順位《ゆうせんじゅんい》をつけます。", exampleMeaning: "首先给工作排优先级。", wrong: "只复述事情很多。" },
      { cue: "〜より〜が｜大切《たいせつ》", signal: "价值重排", direction: "答案选择后项的新评价标准。", example: "｜技術《ぎじゅつ》より、｜何《なに》を｜伝《つた》えるかが｜大切《たいせつ》です。", exampleMeaning: "比起技术，传达什么更重要。", wrong: "选择被降级的前项。" },
    ],
    traps: [{ title: "困扰说得最长", contrast: "问说话人想表达什么时，选择后来的方法而非问题。" }, { title: "常识比原文合理", contrast: "只保留说话人明确提出的新定义。" }, { title: "让步项被选走", contrast: "〜より、しかし、でも之后才是评价重心。" }],
    drills: [
      { id: "p3-method-1", cue: "艺人说工作很多，后来强调排序、取舍与执行。主旨是？", choices: ["工作数量", "时间管理方法", "职业选择", "休息地点"], answer: 1, reason: "困扰是背景，方法才是重点。" },
      { id: "p3-method-2", cue: "『技術より何を伝えるかが大切』。被提升的评价轴是？", choices: ["器材价格", "表达内容", "拍摄速度", "技术等级"], answer: 1, reason: "より之后是新的重点。" },
      { id: "p3-method-3", cue: "『遠くへ行くだけが旅ではない。移動する過程も旅だ』。结构是？", choices: ["原因说明", "重新定义", "价格比较", "顺序指示"], answer: 1, reason: "说话人扩大了“旅行”的定义。" },
    ], relatedContentIds: ["listening-problem-3"],
  },
];

const p5Inputs: UnitInput[] = [
  {
    slug: "hard-conditions", title: "硬条件交集", japanese: "条件の共通部分", estimatedMinutes: 8,
    objective: "把时间、资格、费用、难度等硬条件分栏，先排除不可能项。",
    summary: ["每个条件单独一列", "不满足一项立即排除", "偏好只在剩余项中比较"],
    coverage: ["时间", "资格", "费用", "难度", "交流需求"],
    noteInsight: "問題5选项往往只满足大部分条件；只要漏掉一个硬条件，看起来再合适也不能保留。",
    concepts: [
      { cue: "〜しか｜参加《さんか》できない", signal: "时间限制", direction: "将可行时段先做硬排除。", example: "｜平日《へいじつ》の｜午前《ごぜん》しか｜参加《さんか》できません。", exampleMeaning: "只能在工作日上午参加。", wrong: "因为内容喜欢而忽略时间。" },
      { cue: "〜｜以上《いじょう》／〜｜向《む》け", signal: "资格难度", direction: "确认级别、年龄或经验门槛。", example: "N2｜以上《いじょう》の｜人向《ひとむ》けです。", exampleMeaning: "面向N2以上水平的人。", wrong: "把初级课程当作合格项。" },
      { cue: "｜無料《むりょう》／｜別途《べっと》", signal: "费用", direction: "区分全免、另收费和包含费用。", example: "｜参加費《さんかひ》は｜無料《むりょう》ですが、｜材料費《ざいりょうひ》は｜別途《べっと》です。", exampleMeaning: "参加免费，但材料费另付。", wrong: "看到無料就认为总费用为零。" },
      { cue: "〜たい／〜たくない", signal: "软偏好", direction: "硬条件通过后，再比较想做与不想做。", example: "できれば｜人《ひと》と｜交流《こうりゅう》したいです。", exampleMeaning: "如果可以，想与人交流。", wrong: "让软偏好覆盖资格限制。" },
    ],
    traps: [{ title: "只满足最显眼条件", contrast: "每个候选项都要逐列打勾。" }, { title: "软偏好压过硬条件", contrast: "时间、资格、费用先排除，再谈喜欢。" }],
    drills: [
      { id: "p5-cond-1", cue: "要求：周六、N2以上、免费。A周六初级免费；B周日N2收费；C周六N2免费。", choices: ["A", "B", "C", "都不行"], answer: 2, reason: "只有C同时满足三个硬条件。" },
      { id: "p5-cond-2", cue: "『参加費無料、材料費は別途』。正确理解是？", choices: ["完全免费", "仍需材料费", "只收参加费", "必须会员"], answer: 1, reason: "別途表示另外支付。" },
      { id: "p5-cond-3", cue: "时间不合但内容最喜欢的方案应如何处理？", choices: ["优先选择", "先排除", "忽略时间", "随机保留"], answer: 1, reason: "硬条件不满足就不能成为答案。" },
    ], relatedContentIds: ["listening-problem-5"],
  },
  {
    slug: "proposal-reversal", title: "提案、否定与最终决定", japanese: "提案から決定まで", estimatedMinutes: 9,
    objective: "记录每个方案被接受、否定还是暂时保留，只认最终确认。",
    summary: ["提案出现先写候选", "转折否定立即标×", "总结表达后才画○"],
    coverage: ["初始提案", "否定理由", "替代方案", "最终确认", "改主意"],
    noteInsight: "中途出现的合理方案不一定被采用；对话会用负担、既有措施或不可行条件逐个淘汰。",
    concepts: [
      { cue: "〜たらどう？", signal: "提出候选", direction: "先记为候选，不立即当答案。", example: "｜看板《かんばん》を｜増《ふ》やしたらどうですか。", exampleMeaning: "增加告示牌怎么样？", wrong: "提到即选。" },
      { cue: "でも／それはちょっと", signal: "否定或保留", direction: "立即给前一方案标×或△。", example: "でも、もう｜看板《かんばん》はたくさんあります。", exampleMeaning: "不过，已经有很多告示牌了。", wrong: "只记看板关键词。" },
      { cue: "それなら", signal: "根据限制提出替代", direction: "后面的新方案比前项更可能成为答案。", example: "それなら、｜長椅子《ながいす》をきれいにしましょう。", exampleMeaning: "那样的话，就把长椅整理漂亮吧。", wrong: "仍停留在被否定方案。" },
      { cue: "じゃ、それでいきましょう", signal: "最终确认", direction: "给最近方案画○，覆盖初始愿望。", example: "じゃ、その｜案《あん》でいきましょう。", exampleMeaning: "那就按这个方案办吧。", wrong: "选择最早建议。" },
    ],
    traps: [{ title: "初始愿望", contrast: "条件出现后，最终方案可能完全改变。" }, { title: "可行但未采用", contrast: "必须听到同意、决定或总结表达。" }, { title: "关键词出现过", contrast: "否定后的关键词仍会出现在错误选项中。" }],
    drills: [
      { id: "p5-proposal-1", cue: "A提议增加看板；B说已有很多；最后决定美化长椅。答案是？", choices: ["增加看板", "撤掉看板", "美化长椅", "停止活动"], answer: 2, reason: "最终确认覆盖了初始提案。" },
      { id: "p5-proposal-2", cue: "听到『それはちょっと…』时，前一方案应标什么？", choices: ["○", "×／△", "最终", "第一顺位"], answer: 1, reason: "这是婉拒或保留信号。" },
      { id: "p5-proposal-3", cue: "哪个表达最能确认最终决定？", choices: ["たとえば", "でも", "じゃ、それで", "まず"], answer: 2, reason: "「じゃ、それで」用于收束决定。" },
    ], relatedContentIds: ["listening-problem-5"],
  },
  {
    slug: "people-roles", title: "人物、能力与岗位分配", japanese: "人物・役割の対応", estimatedMinutes: 9,
    objective: "给每个人单独一行，避免把A的限制、B的能力与C的岗位串在一起。",
    summary: ["人物一人一行", "能力、偏好、不可行分三格", "最后逐人匹配岗位"],
    coverage: ["人物身份", "能力", "偏好", "不可行条件", "岗位匹配"],
    noteInsight: "人物题的错误选项常把每条信息都说对，只交换了执行者；名字或男女声切换时必须换行。",
    concepts: [
      { cue: "Aさんは〜", signal: "人物切换", direction: "立即换行，不把上一人的条件带过来。", example: "Aさんは｜英語《えいご》を｜使《つか》う｜仕事《しごと》がしたいそうです。", exampleMeaning: "A想做使用英语的工作。", wrong: "写到B的行里。" },
      { cue: "〜が｜得意《とくい》", signal: "能力", direction: "与岗位要求匹配，但仍需检查时间和偏好。", example: "｜子《こ》どもの｜対応《たいおう》が｜得意《とくい》です。", exampleMeaning: "擅长应对孩子。", wrong: "能力合适就忽略不可行条件。" },
      { cue: "〜はできない", signal: "不可行", direction: "该人物与对应岗位立即断开。", example: "｜午後《ごご》は｜参加《さんか》できません。", exampleMeaning: "下午无法参加。", wrong: "只记他想做。" },
      { cue: "やっぱり〜にする", signal: "本人最终选择", direction: "更新该人物的最终岗位。", example: "やっぱり｜受付《うけつけ》にします。", exampleMeaning: "还是选择接待工作。", wrong: "保留最初选择。" },
    ],
    traps: [{ title: "人物串线", contrast: "名字或声线切换就换行。" }, { title: "能力即答案", contrast: "能力、时间、偏好和最终确认必须同时成立。" }],
    drills: [
      { id: "p5-person-1", cue: "A会英语但下午不可；B想赛前完成且会接待。下午翻译岗位给谁？", choices: ["A", "B", "两人", "无人"], answer: 3, reason: "A时间不合，B的信息也不足以满足翻译要求。" },
      { id: "p5-person-2", cue: "人物切换时最安全的记录方式是？", choices: ["继续同一行", "每人单独一行", "只记岗位", "只记名字"], answer: 1, reason: "分行可防止能力和限制串线。" },
      { id: "p5-person-3", cue: "『やっぱり受付にする』表示？", choices: ["仍未决定", "最终改选接待", "拒绝接待", "接待不可行"], answer: 1, reason: "やっぱり〜にする确认最终改选。" },
    ], relatedContentIds: ["listening-problem-5"],
  },
  {
    slug: "route-final", title: "路线顺序与综合收束", japanese: "順番・最終判断", estimatedMinutes: 9,
    objective: "用箭头记录地点和动作顺序，并在否定与改选后更新最终路线。",
    summary: ["地点出现先列候选", "首先／接着／最后编号", "跳过与改选立即重画箭头"],
    coverage: ["路线顺序", "第一站／第二站", "跳过项目", "最后安排", "综合决策表"],
    noteInsight: "两个地点最终都会去，也不代表顺序无关；問題5经常专门问第一站、第二站或某人最终做什么。",
    concepts: [
      { cue: "まず", signal: "第一步", direction: "给紧随其后的地点或动作标①。", example: "まず、｜港《みなと》で｜海鮮《かいせん》を｜食《た》べましょう。", exampleMeaning: "首先在港口吃海鲜。", wrong: "按地图位置自行排序。" },
      { cue: "その｜後《あと》／それから", signal: "后续", direction: "沿当前路线继续画箭头。", example: "それから｜市場《いちば》へ｜行《い》きます。", exampleMeaning: "然后去市场。", wrong: "与最后一步互换。" },
      { cue: "〜はやめておく", signal: "跳过", direction: "从路线中删除该项目。", example: "｜釣《つ》りは｜初心者《しょしんしゃ》なのでやめておきます。", exampleMeaning: "因为是初学者，钓鱼就先不参加。", wrong: "因为关键词出现而保留。" },
      { cue: "｜最後《さいご》に", signal: "最终一步", direction: "放到箭头末端，不受之前提及顺序影响。", example: "｜買《か》い｜物《もの》は｜最後《さいご》にしましょう。", exampleMeaning: "购物放到最后吧。", wrong: "按第一次提到的位置排序。" },
    ],
    traps: [{ title: "两个地点都去所以顺序无关", contrast: "题目可能只问第一站或第二站，必须编号。" }, { title: "跳过项目仍保留", contrast: "やめる、必要ない、時間がない后立即删除。" }, { title: "初始路线未更新", contrast: "やっぱり、先に、最後に会重写路线。" }],
    drills: [
      { id: "p5-route-1", cue: "先吃海鲜，然后去市场，购物放最后。第一站是？", choices: ["市场", "购物中心", "港口吃海鲜", "钓鱼区"], answer: 2, reason: "まず之后是第一站。" },
      { id: "p5-route-2", cue: "『釣りはやめておく』应如何记录？", choices: ["①", "最后", "从路线删除", "暂定第一"], answer: 2, reason: "やめておく表示决定不做。" },
      { id: "p5-route-3", cue: "最初说先购物，后来改为『買い物は最後に』。最终顺序以什么为准？", choices: ["最初提及", "最终改选", "地图距离", "选项长度"], answer: 1, reason: "后来的明确决定覆盖最初计划。" },
    ], relatedContentIds: ["listening-problem-5"],
  },
];

const problemThreeUnits = p3Inputs.map((input, index) => unit("problem-3", index, input));
const problemFiveUnits = p5Inputs.map((input, index) => unit("problem-5", index, input));

function definition(
  number: string,
  slug: "problem-3" | "problem-5",
  japanese: string,
  title: string,
  heroTitle: string,
  description: string,
  quickSummary: string[],
  units: StudyUnitDefinition[],
): ProblemDefinition {
  return {
    id: `listening-${slug}`,
    slug, domain: "listening", number, title, japanese, heroTitle, description, quickSummary,
    sourceSummary: { documents: 3, sections: units.length, tables: number === "3" ? 15 : 7 },
    coverageGroups: units.map((item) => ({ title: item.title, japanese: item.japanese, items: item.coverage })),
    units,
    practice: { slug: "practice", title: `${title} · 混合训练`, description: "把不同场景与信号混在一起，练习从信息中选出最终主旨或决定。", cardCount: units.reduce((sum, item) => sum + item.drills.length, 0), estimatedMinutes: 14, reviewPrefix: `${slug}-card-` },
    examples: { slug: "examples", title: `${title} · 模型与场景`, description: "集中复习代表场景、信号和判断方向。", yearRange: "2019–2024" },
    deepNotes: { slug: "notes", title: `${title} · 场景扩展`, description: "需要查看更多跨年场景与完整判断过程时，从这里继续。" },
    sourceRefs: ["app/data/listening-content.ts"],
  };
}

export const problemThreeDefinition = definition("3", "problem-3", "問題3", "概要理解", "例子很多，答案只留说话人真正想说的一句。", "先判断主旨属于作用、契机、变化、原因、方法还是重新定义，再用转折与末段确认。", ["找话题对象", "等转折与立场", "把例子提升为一句主旨"], problemThreeUnits);
export const problemFiveDefinition = definition("5", "problem-5", "問題5", "統合理解", "把人、条件、方案分栏，最后决定才不会串线。", "不同任务使用不同记法：条件题做交集，人物题分行，路线题画箭头，提案题只认最终确认。", ["先识别任务类型", "记录硬条件与否定", "更新到最终决定"], problemFiveUnits);

export const problemThreeFiveDefinitions = [problemThreeDefinition, problemFiveDefinition];
