export type LanguageModule = {
  slug: string;
  number: string;
  japanese: string;
  title: string;
  description: string;
  accent: string;
  metrics: { value: string; label: string }[];
  focus: { title: string; detail: string; examples: string }[];
  steps: string[];
  review: { cue: string; answer: string; note: string }[];
  sources: string[];
};

export const languageModules: LanguageModule[] = [
  {
    slug: "q1",
    number: "問題 1",
    japanese: "漢字読み",
    title: "先识别词的类型，再判断读音",
    description:
      "真题并不偏爱冷僻词，而是反复更换“常见但容易读错”的汉语词、训读动词与状态词。",
    accent: "aqua",
    metrics: [
      { value: "149", label: "分析题目" },
      { value: "30回", label: "2010–2025" },
      { value: "≤2次", label: "同词通常复现" },
    ],
    focus: [
      { title: "汉语二字熟语", detail: "重点辨别长音、清浊音与促音。", examples: "治療・削除・豊富・討論・詳細" },
      { title: "训读动词", detail: "意思熟悉，但读音常被中文汉字感带偏。", examples: "備える・補う・争う・収まる" },
      { title: "抽象与社会词", detail: "常出现在说明文和新闻语境中。", examples: "損害・刺激・平等・実践・栽培" },
    ],
    steps: ["先看词性与送假名", "判断音读还是训读", "排除近音、漏长音和清浊音错误"],
    review: [
      { cue: "豊富", answer: "ほうふ", note: "不要被「ほうふう」一类多音节选项带走。" },
      { cue: "乏しい", answer: "とぼしい", note: "状态形容词是近年稳定考点。" },
      { cue: "備える", answer: "そなえる", note: "训读动词要连同常用搭配一起记。" },
    ],
    sources: ["JLPT_N2_Typst_Project/problem1_3.typ", "JLPT_N2_Typst_Project/source_md/JLPT_N2_問題1_問題3.md"],
  },
  {
    slug: "q2",
    number: "問題 2",
    japanese: "表記",
    title: "用语境锁定汉字，而不是只凭读音",
    description: "同音异字、近形字和近义汉字是核心；读音相同并不代表能放进同一个句子。",
    accent: "sky",
    metrics: [
      { value: "151", label: "分析题目" },
      { value: "3类", label: "主要陷阱" },
      { value: "语境", label: "最终判断依据" },
    ],
    focus: [
      { title: "同音异字", detail: "先辨认句中需要的意义。", examples: "保障・保証・補償" },
      { title: "近形汉字", detail: "看部首和词的固定写法。", examples: "管理／官理・福祉／副祉" },
      { title: "近义误选", detail: "词义相近时，回到搭配对象。", examples: "拡充・拡張・実施・実践" },
    ],
    steps: ["把平假名还原成你熟悉的词义", "检查部首与送假名", "代回原句确认搭配"],
    review: [
      { cue: "ほしょう（损失赔偿）", answer: "補償", note: "保証是担保，保障是保护权益。" },
      { cue: "ふくし", answer: "福祉", note: "注意「祉」的偏旁。" },
      { cue: "じっせん", answer: "実践", note: "强调实际去做，而不是仅仅实施制度。" },
    ],
    sources: ["JLPT_N2_Typst_Project/problem1_3.typ", "JLPT_N2_Part01/JLPT_N2_問題1_問題3.pdf"],
  },
  {
    slug: "q3",
    number: "問題 3",
    japanese: "語形成",
    title: "把接头、接尾和复合词当成积木",
    description: "問題3考的是构词搭配；先判断空格位置，再判断它和前后词能否组成自然词。",
    accent: "violet",
    metrics: [
      { value: "124", label: "分析题目" },
      { value: "5→3", label: "近年每回题数" },
      { value: "搭配", label: "核心能力" },
    ],
    focus: [
      { title: "接头辞", detail: "先看它对词义做了什么变化。", examples: "再〜・未〜・無〜・各〜" },
      { title: "接尾辞", detail: "判断词性和语义类别。", examples: "〜的・〜性・〜化・〜力" },
      { title: "复合词", detail: "中文看起来合理，不代表日语成立。", examples: "低価格・再利用・実用化" },
    ],
    steps: ["判断空格在词前还是词后", "绑定前后名词的固定组合", "排除只在中文里顺口的组合"],
    review: [
      { cue: "社会＋＿", answer: "社会的", note: "「的」把名词变成形容性质。" },
      { cue: "実用＋＿", answer: "実用化", note: "表示变得可实际使用。" },
      { cue: "＿利用", answer: "再利用", note: "「再」表示重新、再次。" },
    ],
    sources: ["JLPT_N2_Typst_Project/problem1_3.typ", "JLPT_N2_Typst_Project/glossary.typ"],
  },
  {
    slug: "q4",
    number: "問題 4",
    japanese: "文脈規定",
    title: "词义只是起点，搭配才决定答案",
    description: "184道题显示：动词、拟态词和生活场景最值得优先练，完全相同的词反而很少重复。",
    accent: "gold",
    metrics: [
      { value: "184", label: "分析题目" },
      { value: "33.2%", label: "动词/する动词" },
      { value: "20.1%", label: "副词/拟态词" },
    ],
    focus: [
      { title: "固定搭配", detail: "对象一换，意思相近的词也会变错。", examples: "成果を発揮・ストレスを解消" },
      { title: "拟态词", detail: "根据场景关键词建立快速反应。", examples: "かさかさ・べたべた・ぎっしり・くたくた" },
      { title: "复合动词", detail: "近年偏向具体动作与生活场景。", examples: "飛び散る・溶け込む・思い込む・裏づける" },
    ],
    steps: ["先看空格两侧的搭配对象", "判断词性和语气方向", "用整句自然度淘汰近义干扰"],
    review: [
      { cue: "練習の成果を＿", answer: "発揮する", note: "発生・発行・発明都不能和成果搭配。" },
      { cue: "箱に隙間なく＿", answer: "ぎっしり", note: "容器或空间塞满。" },
      { cue: "一日中歩いて＿", answer: "くたくた", note: "表示身体疲惫到极限。" },
    ],
    sources: ["JLPT_N2_Typst_Project/problem4.typ", "文法部分_相近词语汇总_拓展版.pdf"],
  },
  {
    slug: "q5",
    number: "問題 5",
    japanese: "言い換え類義",
    title: "把 N2 词换成更日常、更具体的表达",
    description: "不是找字典里所有近义词，而是选择在当前语境中最普通、最自然的改写。",
    accent: "rose",
    metrics: [
      { value: "150", label: "分析题目" },
      { value: "49.3%", label: "直接同义替换" },
      { value: "36.7%", label: "短语解释" },
    ],
    focus: [
      { title: "动作改写", detail: "动词是最大类别。", examples: "仕上げる→完成させる" },
      { title: "程度与频率", detail: "尤其注意相反方向的干扰。", examples: "たびたび→何度も・まれ→ほとんどない" },
      { title: "外来语转日语", detail: "考的是日常意义，不是直译。", examples: "テクニック→技術・ガイド→案内" },
    ],
    steps: ["先判断划线词的词性与方向", "不看选项先想一个简单说法", "代回句子检查程度和语体"],
    review: [
      { cue: "たちまち", answer: "すぐに", note: "不是次第に；一个是立刻，一个是渐渐。" },
      { cue: "ぶかぶか", answer: "大きすぎる", note: "常用来形容衣物过大。" },
      { cue: "油断する", answer: "気をつけていない", note: "强调放松警惕。" },
    ],
    sources: ["JLPT_N2_Typst_Project/problem5.typ", "JLPT_N2_Typst_Project/source_md/JLPT_N2_問題5.md"],
  },
  {
    slug: "q6",
    number: "問題 6",
    japanese: "用法",
    title: "检查这个词能不能自然地用在句子里",
    description: "問題6最爱考搭配对象、使用范围和自动词/他动词；认识汉字并不足以答对。",
    accent: "mint",
    metrics: [
      { value: "150", label: "分析题目" },
      { value: "50%", label: "名词/する名词" },
      { value: "41%", label: "错误源于搭配" },
    ],
    focus: [
      { title: "搭配对象", detail: "意义大致对，但对象不自然。", examples: "成果を発揮・制度を廃止" },
      { title: "范围限制", detail: "制度、服务、人或抽象概念各有边界。", examples: "廃止・愛着・妥当" },
      { title: "自动／他动", detail: "先检查助词和动作是否人为。", examples: "問題が生じる・計画を進める" },
    ],
    steps: ["确认词性", "确认搭配对象和助词", "确认方向性后逐句代入"],
    review: [
      { cue: "問題＿生じる", answer: "が", note: "生じる是自动词。" },
      { cue: "制度を＿", answer: "廃止する", note: "用于制度、服务等正式对象。" },
      { cue: "申し出を＿", answer: "快く引き受ける", note: "快く常和接受、答应搭配。" },
    ],
    sources: ["JLPT_N2_Typst_Project/problem6.typ", "JLPT_N2_Typst_Project/source_md/JLPT_N2_問題6.md"],
  },
  {
    slug: "q7",
    number: "問題 7",
    japanese: "文法形式の判断",
    title: "先识别逻辑关系，再选择语法形式",
    description: "360道题中，接续句型、固定表达和条件/逆接占据主体；近年越来越强调真实场景。",
    accent: "indigo",
    metrics: [
      { value: "360", label: "分析题目" },
      { value: "26.7%", label: "接续表现" },
      { value: "20%", label: "固定表达" },
    ],
    focus: [
      { title: "关系判断", detail: "对应、伴随、目的、限定与让步。", examples: "に応じて・にともなって・につれて" },
      { title: "固定表达", detail: "形式相近，语气与逻辑不同。", examples: "わけではない・ざるを得ない・にすぎない" },
      { title: "敬语与授受", detail: "判断动作主体和受益方向。", examples: "ていただく・てくださる・伺う" },
    ],
    steps: ["确认接续形式", "判断前后逻辑", "检查语气、主体与方向"],
    review: [
      { cue: "技术发展＿手段多样化", answer: "にともなって", note: "表示伴随变化。" },
      { cue: "并不是完全否定", answer: "わけではない", note: "避免和不能做的「わけにはいかない」混淆。" },
      { cue: "请对方为我做", answer: "ていただく", note: "受益方向指向说话人一方。" },
    ],
    sources: ["JLPT_N2_Typst_Project/problem7.typ", "JLPT_N2_問題7_全年度全月份再审视_2019补漏_2026大胆预测.md"],
  },
  {
    slug: "q8",
    number: "問題 8",
    japanese: "文の組み立て",
    title: "先绑定固定结构，再还原整句语序",
    description: "問題8主要考修饰关系、复合句和句尾预测；近年长修饰结构明显增加。",
    accent: "peach",
    metrics: [
      { value: "150", label: "分析题目" },
      { value: "28%", label: "修饰关系" },
      { value: "88%", label: "★位于第3空" },
    ],
    focus: [
      { title: "连体修饰", detail: "整段修饰语必须放在名词前。", examples: "おすすめしたい店・春を代表する魚" },
      { title: "固定绑定", detail: "先把不能拆开的表达组合起来。", examples: "〜のは〜からだ・〜ことを考えると" },
      { title: "句尾预测", detail: "先决定最后要落在判断、原因还是推测。", examples: "と思う・からだ・はずだ・てしまう" },
    ],
    steps: ["通读并抓大意", "绑定固定句型", "确定句尾，再放修饰语和助词"],
    review: [
      { cue: "喜欢芝士得不得了的人", answer: "チーズが好きでたまらないという人", note: "修饰内容整体放在人前。" },
      { cue: "迟到没有发生，是因为电话", answer: "遅刻をせずに済んだのは、電話に起こされたからだ", note: "先绑定「AのはBからだ」。" },
      { cue: "练习做到某处结束", answer: "解いたところまでで終わった", note: "先绑定「解いたところ」，再接まで。" },
    ],
    sources: ["JLPT_N2_Typst_Project/problem8.typ", "JLPT_N2_Typst_Project/source_md/JLPT_N2_問題8.md"],
  },
  {
    slug: "q9",
    number: "問題 9",
    japanese: "文章の文法",
    title: "答案必须符合整篇文章的流れ",
    description: "問題9不是单点语法题，要同时判断体裁、段落功能、逻辑、语气、指示词和时态。",
    accent: "berry",
    metrics: [
      { value: "7层", label: "判断框架" },
      { value: "3种", label: "常见文章骨架" },
      { value: "全文", label: "最终验证范围" },
    ],
    focus: [
      { title: "体裁与语气", detail: "作文、演讲、说明文、意见文结尾不同。", examples: "と思う・と言われている・ていきたい" },
      { title: "逻辑连接", detail: "不要把中文都像“所以/但是”的词混为一谈。", examples: "そのため・そこで・その結果" },
      { title: "照应与时间线", detail: "指示词必须有对象，时态必须符合变化过程。", examples: "この／その・てきた／ていく" },
    ],
    steps: ["先定文章体裁和段落功能", "只看空格前后确定局部逻辑", "回到全文检查语气、指代与时态"],
    review: [
      { cue: "发现问题后采取措施", answer: "そこで", note: "不是单纯的原因结果。" },
      { cue: "从过去积累到现在", answer: "〜てきた", note: "未来继续使用「〜ていく」。" },
      { cue: "留学生作文的最后一空", answer: "感想／愿望倾向", note: "不要只根据前一句选客观说明。" },
    ],
    sources: ["JLPT_N2_Part01/JLPT_N2_文章の文法_問題9.md"],
  },
];

export const similarWordGroups = [
  {
    title: "しっかり系",
    hint: "字形相似，功能完全不同",
    items: [
      ["しっかり", "牢固／认真", "意見をしっかり持つ"],
      ["すっかり", "完全／彻底", "約束をすっかり忘れる"],
      ["うっかり", "不小心", "財布をうっかり忘れる"],
      ["はっきり", "清楚／明确", "考えをはっきり言う"],
      ["きっぱり", "断然／干脆", "誘いをきっぱり断る"],
    ],
  },
  {
    title: "动作速度与变化",
    hint: "快、慢、渐变与瞬间发生",
    items: [
      ["徐々に／次第に", "渐渐", "仕事に徐々に慣れる"],
      ["たちまち", "转眼间", "ニュースがたちまち広まる"],
      ["いきなり", "突然", "いきなり話しかける"],
      ["とっさに", "情急之下", "とっさに手を引く"],
    ],
  },
  {
    title: "视线与观察",
    hint: "看人的方式决定用哪个词",
    items: [
      ["じろじろ", "盯着看", "人の顔をじろじろ見る"],
      ["きょろきょろ", "东张西望", "道に迷ってきょろきょろする"],
      ["ちらちら", "时不时看", "時計をちらちら見る"],
      ["じっと", "凝视／不动", "こちらをじっと見る"],
    ],
  },
  {
    title: "身体与心理状态",
    hint: "睡眠、紧张、放心与失落",
    items: [
      ["うとうと", "打瞌睡", "電車の中でうとうとする"],
      ["ぐっすり", "熟睡", "ぐっすり眠る"],
      ["どきどき", "心跳紧张", "面接の前にどきどきする"],
      ["ほっと", "放心", "知らせを聞いてほっとする"],
      ["がっかり", "失望", "試合に負けてがっかりする"],
    ],
  },
  {
    title: "表面触感",
    hint: "用对象快速建立条件反射",
    items: [
      ["かさかさ", "干燥粗糙", "肌がかさかさする"],
      ["べたべた", "黏糊糊", "汗で手がべたべたする"],
      ["さらさら", "干爽顺滑", "髪がさらさらしている"],
      ["ざらざら", "表面粗糙", "紙の表面がざらざらする"],
      ["つるつる", "光滑", "雨で道がつるつるする"],
    ],
  },
];

export const listeningTriggers = [
  { group: "功能判断", tag: "催促／确认", cue: "言っといたよね？", meaning: "对方认为你本来应该知道或完成", response: "すみません、すぐ確認します。", trap: "不要反问已经给出的信息" },
  { group: "功能判断", tag: "进度确认", cue: "頼んでた件、何とかなりそう？", meaning: "被询问能否按时完成", response: "はい、とにかく間に合わせます。", trap: "不要把问题听成是否已经完成" },
  { group: "功能判断", tag: "传闻引用", cue: "田中さん、来ないって言ってたよ。", meaning: "重点是被转述的信息", response: "そうなんだ。じゃ、先に始めよう。", trap: "不要误判为说话人拒绝" },
  { group: "功能判断", tag: "条件启动", cue: "結果が出次第、連絡してください。", meaning: "一有结果就立刻行动", response: "分かりました。すぐお知らせします。", trap: "次第不是“按照顺序”" },
  { group: "现实状态", tag: "差点发生", cue: "もう少しで遅れるところだった。", meaning: "坏结果最终没有发生", response: "間に合ってよかったね。", trap: "不要当成已经迟到" },
  { group: "现实状态", tag: "保持现状", cue: "電気、つけといて。", meaning: "让当前状态继续", response: "うん、そのままにしておく。", trap: "不要把灯关掉" },
  { group: "现实状态", tag: "避免坏结果", cue: "入院せずに済むそうです。", meaning: "原本担心的住院最终不用发生", response: "入院しなくていいんですね。", trap: "不是“不能住院”" },
  { group: "现实状态", tag: "做到一半", cue: "作業、まだやりかけなんだ。", meaning: "任务尚未完成", response: "じゃ、そのままにしておくね。", trap: "不要回应成已经全部结束" },
  { group: "情绪评价", tag: "情绪低落", cue: "今日は本当についてないよ。", meaning: "需要先接住情绪", response: "どうしたの？", trap: "不要马上讲道理" },
  { group: "情绪评价", tag: "评价不满", cue: "期待したほどじゃなかった。", meaning: "评价低于期待", response: "ちょっと残念だったね。", trap: "不要回应成强烈称赞" },
  { group: "情绪评价", tag: "完全不懂", cue: "話が難しくて、さっぱり分からなかった。", meaning: "几乎完全没听懂", response: "私もついていけなかったよ。", trap: "さっぱり在此不是清爽" },
  { group: "情绪评价", tag: "无可挑剔", cue: "この条件なら、言うことなしだね。", meaning: "评价非常高", response: "本当、これ以上ないね。", trap: "不要理解成“没有可说的内容”" },
  { group: "程度数量", tag: "强烈愿望", cue: "また行きたくてたまらないんだ。", meaning: "非常想再次去", response: "そんなに気に入ったの？", trap: "不是“无法去”" },
  { group: "程度数量", tag: "密度很高", cue: "今週は予定がぎっしりなんだ。", meaning: "日程排得很满", response: "忙しそう。無理しないでね。", trap: "ぎっしり不是杂乱无章" },
  { group: "程度数量", tag: "负面大量", cue: "この資料、間違いだらけだよ。", meaning: "资料里错误很多", response: "そんなにあったの？", trap: "だらけ多带负面评价" },
  { group: "程度数量", tag: "唯一条件", cue: "ここの数字さえ直せば問題ないよ。", meaning: "只需修正一个点", response: "すぐに訂正します。", trap: "不要误解为完全没有问题" },
  { group: "计划变化", tag: "打消念头", cue: "会社を辞めるのを思いとどまったんだって。", meaning: "本来想辞职，最后没有辞", response: "誰かに引き留められたのかな。", trap: "不要听成已经辞职" },
  { group: "计划变化", tag: "下决心实行", cue: "迷ったけど、留学に踏み切ったよ。", meaning: "犹豫后最终决定去做", response: "やることにしたんだね。", trap: "踏み切る不是取消" },
  { group: "计划变化", tag: "暂缓采用", cue: "新しい案は、今回は見送ることになった。", meaning: "这次不采用或暂缓", response: "何が問題だったんでしょうか。", trap: "見送る在此不是目送" },
  { group: "计划变化", tag: "准备完成", cue: "準備は済んで、あとは結果を待つだけです。", meaning: "必要行动已经完成", response: "いい結果が出るといいですね。", trap: "不要再建议重复准备" },
  { group: "场景应答", tag: "许可请求", cue: "こちら、拝見してもよろしいですか。", meaning: "礼貌请求查看", response: "はい、どうぞ。", trap: "注意动作主体和敬语方向" },
  { group: "场景应答", tag: "主动承担", cue: "この荷物、私が運びましょうか。", meaning: "对方提出帮忙", response: "ありがとうございます。お願いします。", trap: "不要误当成命令" },
  { group: "场景应答", tag: "电话转达", cue: "戻りましたら、こちらからお電話します。", meaning: "对方回来后会回电", response: "では、そのようにお伝えください。", trap: "不要要求现在立即接电话" },
  { group: "场景应答", tag: "作业中止", cue: "今日の作業はこの辺で切り上げましょう。", meaning: "今天先做到这里", response: "分かりました。続きは明日ですね。", trap: "不是已经全部完成" },
];
