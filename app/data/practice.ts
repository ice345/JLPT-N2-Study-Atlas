import { languageProblemDefinitions } from "@/app/data/language-course";
import { problemFourDefinition } from "@/app/data/problem-four-course";
import { problemOneTwoDefinitions } from "@/app/data/problem-one-two-course";
import { problemThreeFiveDefinitions } from "@/app/data/listening-three-five-course";
import type { ProblemDefinition } from "@/app/data/problem-definition";

export type PracticeArea = "language" | "reading" | "listening";

export type PracticeQuestion = {
  id: string;
  area: PracticeArea;
  title: string;
  prompt: string;
  context?: string;
  choices: string[];
  answer: number;
  explanation: string;
  skill: string;
  source: string;
  problem: string;
  relatedContentIds: string[];
  skillTags: string[];
  audioText?: string;
  choiceLayout?: "inline";
};

// Each item is either a short extracted question from the user's Markdown
// archive or a compact practice item derived from the study notes. Sources are
// kept on every card so the practice layer remains traceable to the atlas.
const legacyPracticeQuestions: Omit<PracticeQuestion, "problem" | "relatedContentIds" | "skillTags">[] = [
  {
    id: "lang-2010-12", area: "language", title: "文字・語彙 · 語形成", prompt: "一年前のテレビドラマが、来週から（　）放送される。", choices: ["改", "再", "更", "復"], answer: 1,
    explanation: "正确答案是「再」。\u300c再放送\u300d表示电视剧、节目等再次播出；「再」是这里的固定构词要素。", skill: "接头语与固定构词", source: "JLPT_N2_Part01/N2_2010_第一部分_问题1-8.md · 問題3-12", choiceLayout: "inline",
  },
  {
    id: "lang-2024-01", area: "language", title: "文字・語彙 · 読み方", prompt: "山本さんは＿＿優秀＿＿な社員だ。", choices: ["ゆしゅ", "ゆうしゅ", "ゆしゅう", "ゆうしゅう"], answer: 3,
    explanation: "優秀的正确读音是「ゆうしゅう」。注意「秀」是しゅう，不能漏掉长音。", skill: "汉字读音与长音", source: "JLPT_N2_Part01/N2_2024_12.md · 問題1-1",
  },
  {
    id: "lang-2024-02", area: "language", title: "文字・語彙 · 表記", prompt: "安全な場所に＿＿ひなん＿＿をしてください。", choices: ["被離", "避離", "被難", "避難"], answer: 3,
    explanation: "「避難」表示避难。先抓「避」的回避含义，再排除同音近形字。", skill: "同音近形字", source: "JLPT_N2_Part01/N2_2024_12.md · 問題2-7",
  },
  {
    id: "lang-2024-03", area: "language", title: "文字・語彙 · 構詞", prompt: "中村選手は日本を代表する（　）選手だ。", choices: ["高", "優", "名", "真"], answer: 2,
    explanation: "「名選手」是固定搭配，表示有名、优秀的选手。构词题优先识别固定名词组合。", skill: "固定搭配", source: "JLPT_N2_Part01/N2_2024_12.md · 問題3-11",
  },
  {
    id: "lang-2024-04", area: "language", title: "文字・語彙 · 文脈", prompt: "会員の登録が（　）したので、今からサービスを利用できます。", choices: ["決着", "完了", "終業", "到達"], answer: 1,
    explanation: "注册手续完成用「完了する」。先看对象：登録是手续，不是争议、工作时间或地点。", skill: "搭配对象", source: "JLPT_N2_Part01/N2_2024_12.md · 問題4-14",
  },
  {
    id: "lang-2024-05", area: "language", title: "文字・語彙 · 文脈", prompt: "会議時間が残り少なくなったので、資料の詳細な説明は（　）して、要点のみを説明した。", choices: ["減量", "休止", "節約", "省略"], answer: 3,
    explanation: "省去部分内容用「省略する」。时间不够是线索，动作对象是说明内容。", skill: "语境与动词搭配", source: "JLPT_N2_Part01/N2_2024_12.md · 問題4-16",
  },
  {
    id: "lang-grammar-01", area: "language", title: "文法 · 変化", prompt: "社会の発展に（　）、働き方も多様化してきた。", choices: ["応じて", "ともなって", "ついて", "対して"], answer: 1,
    explanation: "A的变化自然带来B的变化时用「〜にともなって」。「に応じて」更强调根据需要作调整。", skill: "伴随变化", source: "app/data/deep-content.ts · 問題7 高频语法整理",
  },
  {
    id: "lang-grammar-02", area: "language", title: "文法 · 限定", prompt: "日本料理が嫌いな（　）。ただ、毎日は食べない。", choices: ["わけではない", "わけにはいかない", "はずがない", "ことはない"], answer: 0,
    explanation: "「嫌いなわけではない」是部分否定：并非不喜欢。后句的ただ提示限制，而不是禁止。", skill: "部分否定", source: "app/data/deep-content.ts · 問題7 易错辨析",
  },
  {
    id: "lang-grammar-03", area: "language", title: "文法 · 敬语", prompt: "提出前に、先生にレポートを見て（　）。", choices: ["くださった", "いただいた", "さしあげた", "もらわせた"], answer: 1,
    explanation: "说话人得到老师检查这项好处，用「見ていただいた」。先判断动作人是老师、受益人是自己。", skill: "授受敬语方向", source: "app/data/deep-content.ts · 問題7 高频语法整理",
  },
  {
    id: "read-01", area: "reading", title: "読解 · 段落功能", context: "市は図書館の開館時間を延長した。しかし利用者数はすぐには増えなかった。そこで、駅前で利用方法を紹介する案内会を開いたところ、翌月から登録者が増えた。", prompt: "案内会を開いた直接の目的是什么？", choices: ["开馆时间を短くする", "利用方法を知らせ、利用者を増やす", "駅前に新しい図書館を建てる", "登録者を減らす"], answer: 1,
    explanation: "「そこで」后接针对前面问题采取的行动。问题是利用者未增加，案内会的目的是让人知道并使用服务。", skill: "问题→措施", source: "app/data/reading-content.ts · 問題14 情報検索模型",
  },
  {
    id: "read-02", area: "reading", title: "読解 · 主張", context: "便利な道具が増えるほど、人は考えなくなると言われる。しかし、道具は答えを決めてくれるものではない。何を調べ、どう使うかを選ぶ力が、以前より必要になっている。", prompt: "作者の主張として最も近いものはどれですか。", choices: ["便利な道具は使わないほうがよい", "道具があるから考える力は不要だ", "道具を選び使う判断力が重要だ", "答えは道具が決めるべきだ"], answer: 2,
    explanation: "前两句提出常见看法后，作者用「しかし」转向自己的结论：关键在选择和使用的判断力。", skill: "转折后的主张", source: "app/data/reading-content.ts · 問題13 主張理解模型",
  },
  {
    id: "read-03", area: "reading", title: "読解 · 条件检索", context: "A講座：土曜、初級向け、無料。B講座：日曜、N2以上、500円。C講座：土曜、N2以上、無料。", prompt: "土曜日に参加でき、N2学習者向けで、無料の講座はどれですか。", choices: ["A講座", "B講座", "C講座", "どれもない"], answer: 2,
    explanation: "三个硬条件必须同时满足：土曜、N2以上、無料。只有C。不要因A免费就忽略级别条件。", skill: "条件交集", source: "app/data/reading-content.ts · 問題14 情報検索模型",
  },
  {
    id: "read-04", area: "reading", title: "読解 · 统合理解", context: "Aさん：紙の本は書き込みやすく、読み返す場所が残る。Bさん：電子書籍は持ち運びやすく、必要な語句をすぐ検索できる。", prompt: "二人に共通する考えはどれですか。", choices: ["読書では便利さが大切だ", "紙の本だけを使うべきだ", "検索機能が最も重要だ", "書き込みは不要だ"], answer: 0,
    explanation: "两人支持的形式不同，但都从“阅读时的便利”说明理由。统合理解要找共同评价轴，不是找相同细节。", skill: "比较矩阵", source: "app/data/reading-content.ts · 問題12 統合理解模型",
  },
  {
    id: "listen-2025-01", area: "listening", title: "聴解 · 即時応答", prompt: "ねえ、今日の帰り、本屋行くついでにご飯でも食べない？", choices: ["じゃあ、本屋に行く日を変えるんだね。", "え？ 本屋は行かなくてよくなったの？", "うん、本屋の近くでいい店知ってる？"], answer: 2,
    explanation: "邀请是“去书店顺便吃饭”，自然回应应顺着计划确认吃饭地点。", skill: "邀请与自然回应", source: "JLPT_N2_听力问题四/2025.md · 2025年12月 問題4-1", audioText: "ねえ、今日の帰り、本屋行くついでにご飯でも食べない？",
  },
  {
    id: "listen-2025-02", area: "listening", title: "聴解 · 即時応答", prompt: "昨日のテニスの試合、負けちゃったけど、自分の力を出し切ったよ。", choices: ["そんなにがっかりしないで。", "納得できる試合だったんだね。", "思うように力が出せなかったんだね。"], answer: 1,
    explanation: "说话人承认失败，但强调“出し切った”。回应应肯定其满足感，不能把意思反过来。", skill: "让步后的评价", source: "JLPT_N2_听力问题四/2025.md · 2025年12月 問題4-3", audioText: "昨日のテニスの試合、負けちゃったけど、自分の力を出し切ったよ。",
  },
  {
    id: "listen-2025-03", area: "listening", title: "聴解 · 即時応答", prompt: "週末の旅行、バスが遅れて帰りの飛行機に乗り遅れるところでしたよ。", choices: ["間に合ってよかったですね。", "結局乗れなかったんですね。", "それで早く帰ってきたんですね。"], answer: 0,
    explanation: "「〜ところだった」表示差点发生、实际没有发生。因此是赶上了飞机。", skill: "差点发生", source: "JLPT_N2_听力问题四/2025.md · 2025年12月 問題4-5", audioText: "週末の旅行、バスが遅れて帰りの飛行機に乗り遅れるところでしたよ。",
  },
  {
    id: "listen-2025-04", area: "listening", title: "聴解 · 即時応答", prompt: "奨学金の申請、早く準備しないと期限が近いよ。", choices: ["まだ時間があって安心したよ。", "あ、ありがとう。急がなくちゃ。", "じゃあ、ゆっくり準備してもいいんだね。"], answer: 1,
    explanation: "期限临近是催促，应答要接受提醒并表示立刻行动。", skill: "提醒与行动", source: "JLPT_N2_听力问题四/2025.md · 2025年7月 問題4-6", audioText: "奨学金の申請、早く準備しないと期限が近いよ。",
  },
  {
    id: "listen-2025-05", area: "listening", title: "聴解 · 即時応答", prompt: "今度の市民マラソン大会、年齢を問わず参加できるそうですね。", choices: ["年齢に制限があるんですね。", "え、何歳でもいいんですか？", "じゃあ、親子では出られないんですね。"], answer: 1,
    explanation: "「年齢を問わず」就是不受年龄限制。正确回应是确认“任何年龄都可以”。", skill: "范围限定", source: "JLPT_N2_听力问题四/2025.md · 2025年12月 問題4-9", audioText: "今度の市民マラソン大会、年齢を問わず参加できるそうですね。",
  },
  {
    id: "listen-2025-06", area: "listening", title: "聴解 · 即時応答", prompt: "昨日は腹痛で、おかゆすら食べられなかったんだ。", choices: ["おかゆだけは食べられてよかったね。", "何も食べられなかったの？", "調子悪くても、おかゆなら食べられるからね。"], answer: 1,
    explanation: "「〜すら…ない」强调连最容易的东西也不能。正确回应应确认“什么也没吃”。", skill: "极端范围", source: "JLPT_N2_听力问题四/2025.md · 2025年7月 問題4-1", audioText: "昨日は腹痛で、おかゆすら食べられなかったんだ。",
  },
];

function diagnosticQuestionsFromCourse(definition: ProblemDefinition): PracticeQuestion[] {
  return definition.units.slice(0, 3).map((unit, index) => {
    const drill = unit.drills[index % unit.drills.length];
    return {
      id: `diagnostic-${definition.domain}-${definition.slug}-${index + 1}`,
      area: definition.domain,
      title: definition.japanese,
      prompt: drill.cue,
      choices: drill.choices,
      answer: drill.answer,
      explanation: drill.reason,
      skill: unit.title,
      source: `course:${definition.id}`,
      problem: definition.slug,
      relatedContentIds: [unit.id, unit.slug],
      skillTags: [unit.title, ...unit.coverage.slice(0, 2)],
      audioText: definition.domain === "listening" ? drill.cue.replace(/｜([^《》]+)《[^《》]+》/gu, "$1") : undefined,
    };
  });
}

const readingDiagnosticQuestions: PracticeQuestion[] = [
  {
    id: "diagnostic-reading-q10-1", area: "reading", problem: "q10", title: "内容理解・短文", skill: "邮件用件",
    context: "田中さんへ　先日お見せした新しいパンフレットについて、青い表紙の見本も送っていただけますか。部数は来週の会議で決め、改めて連絡します。",
    prompt: "このメールで、今、田中さんに頼んでいることは何ですか。",
    choices: ["パンフレットの部数を決めること", "青い表紙の見本を送ること", "来週の会議に参加すること", "新しいパンフレットを印刷すること"], answer: 1,
    explanation: "当前请求由「送っていただけますか」直接表达；部数只说以后再决定。", source: "reading:q10", relatedContentIds: ["q10"], skillTags: ["邮件用件", "现在与未来", "请求表达"],
  },
  {
    id: "diagnostic-reading-q10-2", area: "reading", problem: "q10", title: "内容理解・短文", skill: "通知边界",
    context: "システム点検のため、8月20日午前1時から4時まで予約の変更はできません。時刻表の閲覧と新規予約は通常どおり利用できます。",
    prompt: "点検中にできないことは何ですか。",
    choices: ["時刻表を見ること", "新しく予約すること", "予約内容を変更すること", "午前4時以降に利用すること"], answer: 2,
    explanation: "暂停的只有预约变更；浏览时刻表和新预约仍可使用。", source: "reading:q10", relatedContentIds: ["q10"], skillTags: ["通知公告", "可用与不可用", "范围"],
  },
  {
    id: "diagnostic-reading-q10-3", area: "reading", problem: "q10", title: "内容理解・短文", skill: "职责与期限",
    context: "各部の担当者は、参加者名簿を9月3日までに確認してください。修正がある場合は5日までに総務部へ知らせ、必要な資料の部数は7日までに申請してください。",
    prompt: "参加者名簿に誤りを見つけた担当者は、まず何をしますか。",
    choices: ["3日までに資料を申請する", "5日までに総務部へ知らせる", "7日までに名簿を確認する", "参加者へ直接連絡する"], answer: 1,
    explanation: "名簿修正的动作与期限是一组：5日までに総務部へ知らせる。", source: "reading:q10", relatedContentIds: ["q10"], skillTags: ["职责期限", "动作匹配", "先后顺序"],
  },
  {
    id: "diagnostic-reading-q11-1", area: "reading", problem: "q11", title: "内容理解・中文", skill: "指示照应",
    context: "店では客の好みに合わせて商品を勧めてくれる。しかし、勧められたものだけを選んでいると、自分で新しいものを探す機会が減る。このような便利さには注意も必要だ。",
    prompt: "「このような便利さ」とは、どのようなことですか。",
    choices: ["店に商品が少ないこと", "好みに合う商品を勧めてもらえること", "自分で新商品を作れること", "店員に注意されること"], answer: 1,
    explanation: "指示词承接前面的完整状态，而不是只指最近的「機会」。", source: "reading:q11", relatedContentIds: ["q11"], skillTags: ["指示词", "整句照应", "局部理解"],
  },
  {
    id: "diagnostic-reading-q11-2", area: "reading", problem: "q11", title: "内容理解・中文", skill: "理由定位",
    context: "予定を立てるとき、最も調子がよい日の作業量を基準にしてはいけない。体調や急な用事で予定どおり進まない日もあるからだ。少し余裕を残すほうが、長く続けやすい。",
    prompt: "筆者は、なぜ予定に余裕を残すほうがよいと考えていますか。",
    choices: ["毎日休んだほうがよいから", "予定は立てないほうがよいから", "いつも最高の状態で進められるとは限らないから", "作業量を毎日増やしたいから"], answer: 2,
    explanation: "「からだ」前的内容说明现实中会有状态和突发事项的波动。", source: "reading:q11", relatedContentIds: ["q11"], skillTags: ["理由说明", "因果", "段落功能"],
  },
  {
    id: "diagnostic-reading-q11-3", area: "reading", problem: "q11", title: "内容理解・中文", skill: "全文立场",
    context: "ネットの情報はすぐ調べられて便利だ。ただ、似た意見ばかりを読んでいると、自分の考えが唯一の答えだと思い込みやすい。便利な道具だからこそ、反対の意見も意識して探す必要がある。",
    prompt: "筆者が最も言いたいことは何ですか。",
    choices: ["ネットの情報は使うべきではない", "同じ意見だけを効率よく読むべきだ", "便利さを活用しつつ異なる意見も確認すべきだ", "自分の考えを持たないほうがよい"], answer: 2,
    explanation: "作者先承认便利，再用「ただ」「だからこそ」提出限制与建议。", source: "reading:q11", relatedContentIds: ["q11"], skillTags: ["全文主张", "让步转折", "建议"],
  },
  {
    id: "diagnostic-reading-q12-1", area: "reading", problem: "q12", title: "統合理解", skill: "共同点",
    context: "A：紙の辞書は、調べた語の周りにある言葉も自然に目に入る。B：電子辞書は、例文や発音をすぐ確認できる。どちらも、知らない語を理解するための助けになる。",
    prompt: "AとBに共通する考えは何ですか。",
    choices: ["紙だけを使うべきだ", "語の理解を助ける点に価値がある", "発音は調べなくてよい", "周りの言葉を見ることが最重要だ"], answer: 1,
    explanation: "两者说明的优点不同，但共同评价轴是帮助理解陌生词。", source: "reading:q12", relatedContentIds: ["q12"], skillTags: ["共同点", "语义交集", "比较轴"],
  },
  {
    id: "diagnostic-reading-q12-2", area: "reading", problem: "q12", title: "統合理解", skill: "差异配对",
    context: "A：寝る前はスマートフォンを置き、静かな時間を作るとよい。B：部屋の明るさや温度を調整し、自分に合う寝具を選ぶことが大切だ。",
    prompt: "AとBの提案の違いとして正しいものはどれですか。",
    choices: ["Aは寝室環境、Bは寝る前の行動を重視する", "Aは寝る前の行動、Bは寝室環境を重視する", "二人とも運動だけを重視する", "二人とも同じ寝具を勧める"], answer: 1,
    explanation: "A/B 分栏后配对：A是睡前行为，B是睡眠环境与寝具。", source: "reading:q12", relatedContentIds: ["q12"], skillTags: ["差异点", "人物配对", "比较矩阵"],
  },
  {
    id: "diagnostic-reading-q12-3", area: "reading", problem: "q12", title: "統合理解", skill: "立场强度",
    context: "A：地域の活動には、できれば若者も参加したほうがよい。B：活動を続けるには、若者の参加が欠かせない。",
    prompt: "若者の参加について、AとBはどう考えていますか。",
    choices: ["AもBも参加は不要だと考える", "Aは望ましいとし、Bは必要不可欠だとする", "Aは義務だとし、Bは可能だとする", "二人の考えは完全に同じ強さだ"], answer: 1,
    explanation: "「できれば〜ほうがよい」是建议；「欠かせない」是不可缺少，强度不同。", source: "reading:q12", relatedContentIds: ["q12"], skillTags: ["语气强度", "比较", "必要与建议"],
  },
  {
    id: "diagnostic-reading-q13-1", area: "reading", problem: "q13", title: "主張理解・長文", skill: "旧观点与转折",
    context: "以前の私は、上手な写真とは有名な場所を美しく撮ったものだと思っていた。しかし、毎日の道を撮り続けるうちに、他の人が気づかない変化を写すことにも価値があると分かった。",
    prompt: "筆者の考えはどのように変わりましたか。",
    choices: ["写真には有名な場所しか写せないと思うようになった", "美しく撮る技術には価値がないと思った", "身近な場所の独自の発見にも価値があると考えるようになった", "毎日同じ写真を撮るべきではないと思った"], answer: 2,
    explanation: "「以前」是旧观点，「しかし」之后是作者的新判断。", source: "reading:q13", relatedContentIds: ["q13"], skillTags: ["观点变化", "转折", "论证路线"],
  },
  {
    id: "diagnostic-reading-q13-2", area: "reading", problem: "q13", title: "主張理解・長文", skill: "论据作用",
    context: "読書では、文章に書かれていない場面まで想像することがある。同じ小説でも人によって思い浮かべる景色が違うのは、そのためだ。つまり、読者も作品の世界を作る一人なのである。",
    prompt: "人によって思い浮かべる景色が違うという例は、何を説明していますか。",
    choices: ["文章には景色を書くべきではないこと", "読者が想像によって作品世界に参加すること", "同じ小説を読んではいけないこと", "作者の想像は必要ないこと"], answer: 1,
    explanation: "例子支撑末句的抽象结论：读者通过想象参与创造作品世界。", source: "reading:q13", relatedContentIds: ["q13"], skillTags: ["例子与结论", "论据", "抽象化"],
  },
  {
    id: "diagnostic-reading-q13-3", area: "reading", problem: "q13", title: "主張理解・長文", skill: "带条件主张",
    context: "悩みを人に話しても、相手が答えを出してくれるとは限らない。それでも、自分の考えを言葉にするうちに、問題を別の角度から見られることがある。話すことの価値は、助言を得ることだけではない。",
    prompt: "筆者の考えに最も近いものはどれですか。",
    choices: ["悩みは必ず他人に解決してもらえる", "話す目的は正しい答えを教えてもらうことだけだ", "言葉にする過程が新しい見方につながる場合がある", "助言が得られない会話には価値がない"], answer: 2,
    explanation: "作者保留了「ことがある」这一条件，没有说必然解决问题。", source: "reading:q13", relatedContentIds: ["q13"], skillTags: ["最终主张", "条件范围", "过度概括"],
  },
  {
    id: "diagnostic-reading-q14-1", area: "reading", problem: "q14", title: "情報検索", skill: "资格交集",
    context: "動画コンテスト　応募条件：①高校生以上、②作品は3分以内、③テーマは「私の町」、④未発表作品。",
    prompt: "応募できるのはどの人ですか。",
    choices: ["中学生で、2分の未発表作品を作った人", "大学生で、4分の未発表作品を作った人", "高校生で、3分の「私の町」という未発表作品を作った人", "高校生で、以前発表した2分の作品を出す人"], answer: 2,
    explanation: "年龄、时长、主题、未发表四个硬条件必须同时满足。", source: "reading:q14", relatedContentIds: ["q14"], skillTags: ["资格", "条件交集", "硬条件"],
  },
  {
    id: "diagnostic-reading-q14-2", area: "reading", problem: "q14", title: "情報検索", skill: "双重截止日",
    context: "インターネット応募：9月10日までに参加登録を行い、登録後に表示されるページから9月15日までに作品を提出してください。",
    prompt: "インターネットで応募する人が正しく行うことは何ですか。",
    choices: ["15日までに登録だけをする", "10日までに作品を提出するだけでよい", "10日までに登録し、15日までに作品を提出する", "登録と提出をどちらも15日に行う"], answer: 2,
    explanation: "登记和提交是两个动作，也有两个不同截止日。", source: "reading:q14", relatedContentIds: ["q14"], skillTags: ["截止日", "步骤", "提交方式"],
  },
  {
    id: "diagnostic-reading-q14-3", area: "reading", problem: "q14", title: "情報検索", skill: "费用例外",
    context: "参加費は一人2,000円（昼食代を含む）。道具を借りる場合は、別に500円必要です。小学生は参加費が半額ですが、道具代の割引はありません。",
    prompt: "道具を借りる小学生一人が払う金額はいくらですか。",
    choices: ["500円", "1,000円", "1,500円", "2,500円"], answer: 2,
    explanation: "参加费半价为1000日元，工具费不打折另加500日元，共1500日元。", source: "reading:q14", relatedContentIds: ["q14"], skillTags: ["费用", "例外", "组合条件"],
  },
];

const languageDiagnosticQuestions = languageProblemDefinitions.flatMap(diagnosticQuestionsFromCourse);
const listeningDiagnosticQuestions = [
  ...problemOneTwoDefinitions,
  problemThreeFiveDefinitions[0],
  problemFourDefinition,
  problemThreeFiveDefinitions[1],
].flatMap(diagnosticQuestionsFromCourse);

export const diagnosticQuestions: PracticeQuestion[] = [
  ...languageDiagnosticQuestions,
  ...readingDiagnosticQuestions,
  ...listeningDiagnosticQuestions,
];

const legacyQuestions: PracticeQuestion[] = legacyPracticeQuestions.map((question) => {
  const problem = question.area === "reading"
    ? question.skill === "比较矩阵" ? "q12" : question.skill === "转折后的主张" ? "q13" : question.skill === "条件交集" ? "q14" : "q10"
    : question.area === "listening" ? "problem-4"
      : question.skill.includes("敬语") || question.skill.includes("否定") || question.skill.includes("变化") ? "q7"
        : question.skill.includes("读音") ? "q1" : question.skill.includes("近形") ? "q2" : question.skill.includes("构词") || question.skill.includes("搭配") ? "q3" : "q4";
  return {
    ...question,
    problem,
    relatedContentIds: [problem],
    skillTags: [question.skill],
  };
});

export const practiceQuestions: PracticeQuestion[] = [...diagnosticQuestions, ...legacyQuestions];

export const diagnosticProblemKeys = [
  "q1", "q10", "problem-1",
  "q2", "q11", "problem-2",
  "q3", "q12", "problem-3",
  "q4", "q13", "problem-4",
  "q5", "q14", "problem-5",
  "q6", "q7", "q8", "q9",
];

export function diagnosticQuestionsFor(count: number) {
  const safeCount = Math.min(57, Math.max(30, Math.round(count)));
  const grouped = new Map<string, PracticeQuestion[]>();
  for (const key of diagnosticProblemKeys) grouped.set(key, []);
  for (const question of diagnosticQuestions) grouped.get(question.problem)?.push(question);

  const result: PracticeQuestion[] = [];
  for (let round = 0; round < 3 && result.length < safeCount; round += 1) {
    for (const problem of diagnosticProblemKeys) {
      const question = grouped.get(problem)?.[round];
      if (question && result.length < safeCount) result.push(question);
    }
  }
  return result;
}

export const practiceAreaNames: Record<PracticeArea, string> = {
  language: "语言知识",
  reading: "阅读",
  listening: "听力",
};

export function questionsFor(area: PracticeArea | "all") {
  return area === "all" ? practiceQuestions : practiceQuestions.filter((item) => item.area === area);
}
