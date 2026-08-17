"use client";

import { useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { Block, RichText, type CompleteDocument, type NoteBlock } from "./complete-notes";

type AtlasKind = "language" | "listening";

type SourceSection = {
  id: string;
  title: string;
  source: string;
  blocks: NoteBlock[];
};

type LearningUnit = {
  id: string;
  title: string;
  category: string;
  intro: string;
  highlights: string[][];
  blocks: NoteBlock[];
  variants: SourceSection[];
};

type AtlasMatch = { id: string; unitId: string; blockIndex: number; title: string; excerpt: string; kind: "content" };
type Choice = { number: number; text: string };

const answerKey: Array<{ includes: string; answer: number; explanation: string }> = [
  { includes: "彼は医学", answer: 1, explanation: "「医学界」表示医学这一领域、学界。「界」接在学科或行业名后，构成“……界”。" },
  { includes: "決勝戦で負けて", answer: 2, explanation: "「準優勝」表示获得第二名、亚军。决赛失利后，结果是準優勝。" },
  { includes: "段階では詳細", answer: 1, explanation: "「現段階」表示当前阶段。后面的「詳細は決まっていない」说明的是现阶段的情况。" },
  { includes: "テレビドラマが、来週から", answer: 2, explanation: "「再放送」表示节目再次播出、重播。「再」是这里表示“再次”的固定构词要素。" },
];

function choicesFromText(text: string): Choice[] | null {
  const matches = [...text.matchAll(/(?:^|\s)([1-4])[.、)]?\s*([^\s]+)/gu)];
  if (matches.length !== 4 || new Set(matches.map((match) => match[1])).size !== 4) return null;
  return matches.map((match) => ({ number: Number(match[1]), text: match[2] }));
}

function answerFor(prompt: string) {
  return answerKey.find((item) => prompt.includes(item.includes));
}

function PastQuestionCard({ prompt, choices, targetId }: { prompt: string; choices: Choice[]; targetId?: string }) {
  const answer = answerFor(prompt);
  const label = (number: number) => String.fromCodePoint(0x2460 + number - 1);
  return <article className="past-question-card" id={targetId} tabIndex={targetId ? -1 : undefined}>
    <span>PAST QUESTION · 語形成</span>
    <h4><RichText text={prompt} /></h4>
    <ol className="past-question-choices">{choices.map((choice) => <li className={answer?.answer === choice.number ? "correct" : ""} key={choice.number}><b>{label(choice.number)}</b><RichText text={choice.text} /></li>)}</ol>
    {answer ? <div className="past-question-answer"><strong>答案：{label(answer.answer)} {choices[answer.answer - 1]?.text}</strong><p>{answer.explanation}</p></div> : <div className="past-question-answer pending"><strong>答案待补充</strong><p>官方答案核对完成后，这里会显示正确选项和解析；现在可以先用它练习定位考点。</p></div>}
  </article>;
}

function renderStudyBlocks(blocks: NoteBlock[], unitId: string, startIndex: number) {
  const output: ReactNode[] = [];
  for (let index = 0; index < blocks.length; index += 1) {
    const current = blocks[index];
    const next = blocks[index + 1];
    const choicesFirst = current.type === "paragraph" ? choicesFromText(current.text) : null;
    if (choicesFirst && next?.type === "list" && next.items.length === 1) {
      output.push(<div id={`atlas-block-${unitId}-${startIndex + index}`} key={`${unitId}-${startIndex + index}`} tabIndex={-1}><PastQuestionCard choices={choicesFirst} prompt={next.items[0]} targetId={`atlas-block-${unitId}-${startIndex + index + 1}`} /></div>);
      index += 1;
      continue;
    }
    const choicesSecond = next?.type === "list" ? choicesFromText(next.items.join(" ")) : null;
    if (current.type === "paragraph" && choicesSecond) {
      output.push(<div id={`atlas-block-${unitId}-${startIndex + index}`} key={`${unitId}-${startIndex + index}`} tabIndex={-1}><PastQuestionCard choices={choicesSecond} prompt={current.text} targetId={`atlas-block-${unitId}-${startIndex + index + 1}`} /></div>);
      index += 1;
      continue;
    }
    output.push(<div id={`atlas-block-${unitId}-${startIndex + index}`} key={`${unitId}-${startIndex + index}`} tabIndex={-1}><Block block={current} /></div>);
  }
  return output;
}

function plain(text: string) {
  return text
    .replace(/\{\{ruby:([^|{}]+)\|([^{}]+)\}\}/gu, "$1")
    .replace(/[「」『』【】\[\]（）()]/gu, "")
    .trim();
}

function normalizedTitle(title: string) {
  return plain(title)
    .replace(/^(第[一二三四五六七八九十百]+部分[:：]|[一二三四五六七八九十百]+[、.．]|\d+[.、：:]?)/u, "")
    .replace(/[：:・·—\-\s]/gu, "")
    .toLowerCase();
}

type Topic = { key: string; title?: string; category?: string };

function isAnnualSource(source: string) {
  const filename = source.split("/").pop() ?? source;
  return /^20\d{2}(?:年|_|-|\.)/u.test(filename);
}

function topicFor(title: string, kind: AtlasKind, scope: string | undefined, source: string): Topic {
  const value = plain(title);
  const compact = normalizedTitle(title);

  // These files are annual transcription notes without Markdown headings. The
  // extractor correctly keeps their questions, but their artificial heading
  // must not become eleven fake "导言" results in the study index.
  if (isAnnualSource(source)) {
    return { key: "annual-examples", title: "历年真题例句库", category: "真题例句" };
  }

  if (kind === "listening" && scope === "p4") {
    const topics: Array<[RegExp, Topic]> = [
      [/本质|做题公式|做题流程|使用方式|最终判断|高分最[终終]版|精简记忆表|最终考试公式|最终查漏|總覽|总览/u, { key: "p4-core", title: "问题4的判断框架", category: "考场执行" }],
      [/句尾|催促|追责|进度确认|进度|顺利|能不能赶上|责任归属|功能句/u, { key: "p4-status", title: "句尾功能与进度责任", category: "功能判断" }],
      [/引用|传闻|转述|信息来源/u, { key: "p4-source", title: "引用、传闻与信息来源", category: "功能判断" }],
      [/条件启动|必须立刻行动|条件承诺|半接受|指示执行|准备完成|次第|からでないと|たうえで/u, { key: "p4-condition", title: "条件启动与必须行动", category: "功能判断" }],
      [/现实状态|结果反转|差点|做到一半|状态判断|唯一条件|时隔|持续误解|做不了|没办法做/u, { key: "p4-state", title: "现实状态与结果反转", category: "状态判断" }],
      [/情绪|失误|忘记|找不到|しまった|緊張/u, { key: "p4-emotion", title: "情绪、失误与补救", category: "场景反应" }],
      [/评价|程度|愿望|强烈|高评价|无可挑剔|原因推测|效果评价/u, { key: "p4-evaluation", title: "评价、程度与愿望", category: "场景反应" }],
      [/范围|限定|数量|密度|限り|以外|に限らず/u, { key: "p4-scope", title: "范围、限定与数量", category: "场景反应" }],
      [/场景常识|店员|顾客|公司上下级|朋友同士|电话|转达|自然回应/u, { key: "p4-scene", title: "场景常识与自然回应", category: "场景反应" }],
      [/请求|许可|主动承担|邀请|拜托|帮忙|拒绝|劝阻|没必要|感谢|回应感谢/u, { key: "p4-request", title: "请求、许可与承诺", category: "功能判断" }],
      [/计划变化|取消|下决心|原本无意|不得已|只能|打消念头|中止|过去遗憾|反事实|ざるを得/u, { key: "p4-plan", title: "计划变化与不得已", category: "功能判断" }],
      [/敬语|身份|礼貌|称赞|责备|确认|是否知道|时间|日程/u, { key: "p4-politeness", title: "敬语、身份与礼貌回应", category: "场景反应" }],
      [/陷阱|易错|反向|防错|排除/u, { key: "p4-traps", title: "干扰项与反向判断", category: "预测与防错" }],
      [/预测|押题|考前|冲刺|补漏/u, { key: "p4-forecast", title: "预测与考前取舍", category: "预测与防错" }],
      [/训练|背诵|秒反应|练习/u, { key: "p4-practice", title: "训练方法与秒反应", category: "考场执行" }],
    ];
    const match = topics.find(([pattern]) => pattern.test(value));
    if (match) return match[1];
    if (/时态|主体|褒贬|条件反|未发生|常见陷阱|反向判断/u.test(value)) {
      return { key: "p4-traps", title: "干扰项与反向判断", category: "预测与防错" };
    }
    if (/唯一条件|小修正/u.test(value)) {
      return { key: "p4-scope", title: "范围、限定与数量", category: "场景反应" };
    }
    if (/时隔|久违|持续误解|现实判断/u.test(value)) {
      return { key: "p4-state", title: "现实状态与结果反转", category: "状态判断" };
    }
    if (/抽選|当選|好消息/u.test(value)) {
      return { key: "p4-evaluation", title: "评价、程度与愿望", category: "场景反应" };
    }
    if (/负面大量|数量密度/u.test(value)) {
      return { key: "p4-scope", title: "范围、限定与数量", category: "场景反应" };
    }
    if (/第一优先|第二优先|最值得押|按频率|换词防漏|最终备考策略/u.test(value)) {
      return { key: "p4-forecast", title: "预测与考前取舍", category: "预测与防错" };
    }
    if (/逐月覆盖索引|原题索引/u.test(value)) {
      return { key: "annual-examples", title: "历年真题例句库", category: "真题例句" };
    }
    if (/必背|最终应答模板|委婉拒绝|最终使用建议|真正要练|反应模型|训练方式/u.test(value)) {
      return { key: "p4-practice", title: "训练方法与秒反应", category: "考场执行" };
    }
    if (value === "例") {
      return { key: "p4-request", title: "请求、许可与承诺", category: "功能判断" };
    }
  }

  if (kind === "listening" && scope === "p12") {
    if (/本质|总模型|三步法|考场算法|核心判断|总规律|总结论|应考生视角|出题人视角/u.test(value)) {
      return { key: "p12-core", title: "问题1・2的听取框架", category: "考场执行" };
    }
    if (/問題1.*(?:模式|类型|排序|任务|行动|补救|优先级|手续|数量|责任)|类型一.*补救|类型二.*优先|类型三.*条件|类型四.*手续|类型五.*数量|类型六.*责任/u.test(value)) {
      return { key: "p12-q1", title: "问题1：任务、顺序与下一步", category: "问题模型" };
    }
    if (/問題2.*(?:模式|类型|理由|评价|重点|反转)|类型一.*理由|类型二.*重点|类型三.*评价|类型四.*状态|类型五.*范围|类型六.*观点/u.test(value)) {
      return { key: "p12-q2", title: "问题2：真正理由与评价重点", category: "问题模型" };
    }
    if (/副词|拟态词|形态网络|词汇|搭配网络|句式频率|功能句式/u.test(value)) {
      return { key: "p12-language", title: "听力触发词与功能表达", category: "例句与表达" };
    }
    if (/陷阱|错误选项|避坑|反转|缺失题|风险矩阵/u.test(value)) {
      return { key: "p12-traps", title: "问题1・2干扰项与避坑", category: "预测与防错" };
    }
    if (/预测|2026|大胆|高风险|最高风险|考前/u.test(value)) {
      return { key: "p12-forecast", title: "问题1・2预测与考前优先级", category: "预测与防错" };
    }
    if (/训练|每天|复盘|秒反应|口诀|最后一句/u.test(value)) {
      return { key: "p12-practice", title: "问题1・2训练与复盘", category: "考场执行" };
    }
  }

  // Problem 3 had several versions of the same explanation under different
  // headings. Merge only its clearly shared layers; leave individual word
  // groups separate so the detailed examples remain discoverable.
  if (kind === "language" && scope === "q3") {
    if (/命题逻辑|問題3到底考|总规律|总体|最终高分结论|最终判断/u.test(value)) {
      return { key: "q3-core", title: "问题3的判断框架", category: "出题规律" };
    }
    if (/预测|押题|高概率|考点/u.test(value)) {
      return { key: "q3-forecast", title: "问题3预测与优先级", category: "预测与防错" };
    }
    if (/专项突破|构词|語形成|接头|接尾|复合词|词族/u.test(value)) {
      return { key: "q3-formation", title: "构词要素与词族", category: "基础判断" };
    }
    if (/易混|防背刺|陷阱|修正/u.test(value)) {
      return { key: "q3-traps", title: "易混构词与防错", category: "预测与防错" };
    }
  }

  // Apply the same editorial layers to the other language questions. This
  // turns many "final / supplement / prediction" headings into a small set of
  // study routes while leaving vocabulary tables and individual examples as
  // their own blocks inside those routes.
  if (kind === "language") {
    const problemLabel = scope ? `问题${scope.slice(1)}` : "本题";
    if (/预测|押题|高概率|防背刺|大胆|考前|冲刺|补强|补漏/u.test(value)) {
      return { key: `${scope}-forecast`, title: `${problemLabel}预测与考前优先级`, category: "预测与防错" };
    }
    if (/陷阱|易混|防错|错误选项|背刺/u.test(value)) {
      return { key: `${scope}-traps`, title: `${problemLabel}易错辨析与防错`, category: "预测与防错" };
    }
    if (/本质|命题逻辑|真正考法|出题人|规律|总览|总体|总结|解题流程|考场算法|使用方式|最终判断|最终结论|高分應試|高分应试|复习主文件/u.test(value)) {
      return { key: `${scope}-core`, title: `${problemLabel}核心判断框架`, category: "出题规律" };
    }
    if (/训练|每天|练习|复盘|背法|压缩|速记|口诀/u.test(value)) {
      return { key: `${scope}-practice`, title: `${problemLabel}训练与考前复盘`, category: "考场执行" };
    }
  }

  if (/导言与使用方式|使用方式|数据概览|总体数据/u.test(value)) {
    return { key: `overview-${compact}`, title: "资料总览与使用方式", category: "出题规律" };
  }
  return { key: compact };
}

function categoryFor(title: string, kind: AtlasKind) {
  const value = plain(title);
  if (/预测|背刺|防守|补强|冲刺|最后|考前/u.test(value)) return "预测与防错";
  if (/流程|复习|训练|做题|考场|判断|本质|方法|算法/u.test(value)) return "考场执行";
  if (/例句|模板|搭配|接续|句型|敬语|反应|功能句|真题/u.test(value)) return "例句与表达";
  if (kind === "listening" && /场景|店员|公司|朋友|范围|情绪|评价/u.test(value)) return "场景反应";
  if (/总览|规律|趋势|机制|结构|考点|核心|统计/u.test(value)) return "出题规律";
  return "基础判断";
}

function blockText(block: NoteBlock) {
  if (block.type === "paragraph" || block.type === "callout" || block.type === "heading") return block.text;
  if (block.type === "list") return block.items.join(" / ");
  return block.rows.flat().join(" / ");
}

function blockSignature(block: NoteBlock) {
  const normalize = (value: string) => plain(value).replace(/[\s\u3000]+/gu, "").trim();
  if (block.type === "table") return JSON.stringify({ type: block.type, headers: block.headers.map(normalize), rows: block.rows.map((row) => row.map(normalize)) });
  if (block.type === "list") return JSON.stringify({ type: block.type, items: block.items.map(normalize) });
  return JSON.stringify({ type: block.type, text: normalize(block.text) });
}

function buildUnits(documents: CompleteDocument[], kind: AtlasKind, scope?: string): LearningUnit[] {
  const map = new Map<string, LearningUnit>();
  documents.forEach((document) => {
    document.sections.forEach((section) => {
      const topic = topicFor(section.title, kind, scope, document.source);
      const key = topic.key;
      const existing = map.get(key);
      const sourceSection = { ...section, source: document.source };
      const blocks = existing?.blocks ?? [];
      const signatures = new Set(blocks.map(blockSignature));
      const uniqueBlocks = section.blocks.filter((block) => {
        const signature = blockSignature(block);
        if (signatures.has(signature)) return false;
        signatures.add(signature);
        return true;
      });
      const nextBlocks = [...blocks, ...uniqueBlocks];
      const tableRows = nextBlocks
        .filter((block): block is Extract<NoteBlock, { type: "table" }> => block.type === "table")
        .flatMap((block) => block.rows)
        .filter((row) => row.some((cell) => cell.trim()))
        .slice(0, 6);
      const firstUseful = nextBlocks.find((block) => block.type === "paragraph" || block.type === "callout" || block.type === "list");
      const intro = firstUseful ? plain(blockText(firstUseful)) : tableRows[0]?.map(plain).join(" · ") ?? "这一组内容已从你的资料合并为学习单元。";
      if (existing) {
        existing.variants.push(sourceSection);
        existing.blocks = nextBlocks;
        if (existing.intro.length < 30) existing.intro = intro;
        if (tableRows.length) existing.highlights = tableRows;
      } else {
          map.set(key, {
            id: `${kind}-${map.size}-${key}`,
            title: topic.title ?? plain(section.title),
            category: topic.category ?? categoryFor(section.title, kind),
          variants: [sourceSection],
          blocks: uniqueBlocks,
          intro,
          highlights: tableRows,
        });
      }
    });
  });
  return [...map.values()];
}

const guides = {
  language: [
    ["01", "先判题型", "这是读音、表记、搭配、语法形式，还是文章流向？"],
    ["02", "再找限制", "看接续、对象、助词、主体、语气和范围。"],
    ["03", "用例句验证", "答案必须能放回完整句子，而不是只在词典里成立。"],
    ["04", "最后防错", "把相近词、预测池和易错项放到最后一轮回忆。"],
  ],
  listening: [
    ["01", "先判断功能", "对方是在请求、确认、评价、拒绝，还是报告状态？"],
    ["02", "再抓方向", "确认时态、主体、情绪方向、范围和条件有没有反过来。"],
    ["03", "回应要自然", "不是翻译原句，而是选择在这个场景下真正会说的话。"],
    ["04", "最后排干扰", "听到过的词不一定是答案，功能相反的选项要立即划掉。"],
  ],
} as const;

export function LearningAtlas({ documents, kind, scope, eyebrow }: { documents: CompleteDocument[]; kind: AtlasKind; scope?: string; eyebrow: string }) {
  const units = useMemo(() => buildUnits(documents, kind, scope), [documents, kind, scope]);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("全部");
  const [activeId, setActiveId] = useState(units[0]?.id ?? "");
  const [blockPage, setBlockPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [jumpTarget, setJumpTarget] = useState<string | null>(null);
  const handledJumpTarget = useRef<string | null>(null);
  const categories = useMemo(() => ["全部", ...Array.from(new Set(units.map((unit) => unit.category)))], [units]);
  const visible = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return units.filter((unit) => {
      const matchesCategory = category === "全部" || unit.category === category;
      const haystack = JSON.stringify({ title: unit.title, intro: unit.intro, highlights: unit.highlights, blocks: unit.blocks }).toLowerCase();
      return matchesCategory && (!keyword || haystack.includes(keyword));
    });
  }, [category, query, units]);
  const matches = useMemo<AtlasMatch[]>(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) return [];
    const searchable = units.filter((unit) => category === "全部" || unit.category === category);
    return searchable.flatMap((unit) => {
      const found: AtlasMatch[] = [];
      if (`${unit.title} ${unit.intro}`.toLowerCase().includes(keyword)) found.push({ id: `${unit.id}-title`, unitId: unit.id, blockIndex: 0, title: unit.title, excerpt: unit.intro, kind: "content" });
      unit.blocks.forEach((block, blockIndex) => {
        const text = blockText(block);
        if (text.toLowerCase().includes(keyword)) found.push({ id: `${unit.id}-block-${blockIndex}`, unitId: unit.id, blockIndex, title: unit.title, excerpt: plain(text).slice(0, 120), kind: "content" });
      });
      return found;
    }).slice(0, 36);
  }, [category, query, units]);
  const activeIndex = Math.max(0, visible.findIndex((unit) => unit.id === activeId));
  const active = visible[activeIndex] ?? visible[0];
  const blocksPerPage = 8;
  const blockPageCount = active ? Math.max(1, Math.ceil(active.blocks.length / blocksPerPage)) : 1;
  const safeBlockPage = Math.min(blockPage, blockPageCount);
  const visibleBlocks = active?.blocks.slice((safeBlockPage - 1) * blocksPerPage, safeBlockPage * blocksPerPage) ?? [];

  useEffect(() => {
    if (!jumpTarget || handledJumpTarget.current === jumpTarget) return;
    const target = document.getElementById(jumpTarget);
    if (!target) return;
    target.scrollIntoView({ behavior: "smooth", block: "center" });
    target.focus({ preventScroll: true });
    handledJumpTarget.current = jumpTarget;
  }, [jumpTarget, active?.id, safeBlockPage]);

  function selectUnit(id: string) {
    setActiveId(id);
    setBlockPage(1);
    setPageInput("1");
  }

  function selectCategory(next: string) {
    setCategory(next);
    setActiveId("");
    setBlockPage(1);
    setPageInput("1");
  }

  function selectQuery(next: string) {
    setQuery(next);
    setActiveId("");
    setBlockPage(1);
    setPageInput("1");
  }

  function jumpTo(match: AtlasMatch) {
    setActiveId(match.unitId);
    const page = Math.floor(match.blockIndex / blocksPerPage) + 1;
    setBlockPage(page);
    setPageInput(String(page));
    handledJumpTarget.current = null;
    setJumpTarget(`atlas-block-${match.unitId}-${match.blockIndex}`);
  }

  function goToBlockPage(value: string) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return;
    const next = Math.max(1, Math.min(blockPageCount, parsed));
    setBlockPage(next);
    setPageInput(String(next));
  }

  function moveBlockPage(next: number) {
    const safe = Math.max(1, Math.min(blockPageCount, next));
    setBlockPage(safe);
    setPageInput(String(safe));
  }

  return (
    <section className="learning-atlas" id="learning-atlas">
      <header className="atlas-heading">
        <div><span>{eyebrow}</span><h2>按主题继续深入，不丢掉例句与细节</h2><p>每个主题会连续呈现核心结论、例句、对照和检查清单。先选当前要解决的问题，再逐页学习。</p></div>
        <div className="atlas-total"><strong>{units.length}</strong><span>学习主题</span><small>可搜索 · 可分页 · 可继续</small></div>
      </header>

      <div className="atlas-guide">
        {guides[kind].map(([number, title, text]) => <article key={number}><span>{number}</span><strong>{title}</strong><p>{text}</p></article>)}
      </div>

      <div className="atlas-toolbar">
        <div className="atlas-filters" aria-label="学习单元分类">{categories.map((item) => <button className={category === item ? "active" : ""} key={item} onClick={() => selectCategory(item)} type="button">{item}</button>)}</div>
        <label><span>搜索主题、例句或用法</span><input value={query} onChange={(event) => selectQuery(event.target.value)} placeholder={kind === "listening" ? "例如：请求、敬语、差点、条件…" : "例如：接续、自动词、文章、2025…"} /></label>
      </div>
      {query.trim() && <div className="atlas-search-jumps" aria-label="搜索命中位置">{matches.length ? <><span>点击结果直接跳到命中位置</span>{matches.slice(0, 8).map((match) => <button key={match.id} onClick={() => jumpTo(match)} type="button"><strong><RichText text={match.title} /></strong><em>内容</em><p><RichText text={match.excerpt} /></p></button>)}</> : <p>没有找到“{query}”。</p>}</div>}

      <div className="atlas-layout">
        <nav className="atlas-sidebar" aria-label="学习单元目录">
          <div className="atlas-sidebar-head"><span>UNIT INDEX</span><strong>{visible.length} 个主题</strong></div>
          {visible.map((unit, index) => <button className={active?.id === unit.id ? "active" : ""} key={unit.id} onClick={() => selectUnit(unit.id)} type="button"><span>{String(index + 1).padStart(2, "0")}</span><div><small>{unit.category}</small><strong><RichText text={unit.title} /></strong></div><em>{unit.blocks.length}</em></button>)}
          {visible.length === 0 && <p className="atlas-empty">没有找到“{query}”。</p>}
        </nav>

        {active && <article className="atlas-unit">
          <header className="atlas-unit-head"><div><span>{active.category} · 单元 {String(activeIndex + 1).padStart(2, "0")}</span><h3><RichText text={active.title} /></h3><p><RichText text={active.intro} /></p></div><aside><strong>{active.blocks.length}</strong><span>学习要点</span></aside></header>
          {active.highlights.length > 0 && <section className="atlas-highlights"><div><span>先看代表性例子</span><p>先用这些例子建立判断方向，再继续核对完整解释与对照。</p></div><div className="atlas-highlight-table">{active.highlights.map((row, rowIndex) => <div key={rowIndex}>{row.map((cell, cellIndex) => <span key={`${rowIndex}-${cellIndex}`}><RichText text={plain(cell)} /></span>)}</div>)}</div></section>}
          <section className="atlas-full-content"><div className="atlas-content-label"><span>FULL LEARNING UNIT</span><strong>完整学习内容</strong><em>当前页 {active.blocks.length ? ((safeBlockPage - 1) * blocksPerPage) + 1 : 0}–{Math.min(safeBlockPage * blocksPerPage, active.blocks.length)} / {active.blocks.length} 个要点</em></div>{renderStudyBlocks(visibleBlocks, active.id, (safeBlockPage - 1) * blocksPerPage)}<div className="atlas-module-pages"><button type="button" onClick={() => moveBlockPage(safeBlockPage - 1)} disabled={safeBlockPage === 1}>← 上一页内容</button><label>跳到第 <input aria-label="跳转到内容页" inputMode="numeric" min={1} max={blockPageCount} onChange={(event) => setPageInput(event.target.value.replace(/[^0-9]/gu, ""))} onBlur={() => goToBlockPage(pageInput)} onKeyDown={(event) => { if (event.key === "Enter") goToBlockPage(pageInput); }} type="number" value={pageInput} /> 页 <span>/ {blockPageCount}</span></label><button type="button" onClick={() => moveBlockPage(safeBlockPage + 1)} disabled={safeBlockPage === blockPageCount}>下一页内容 →</button></div></section>
          <div className="atlas-next"><button type="button" onClick={() => selectUnit(visible[Math.max(0, activeIndex - 1)]?.id ?? active.id)} disabled={activeIndex === 0}>← 上一个单元</button><span>{activeIndex + 1} / {visible.length}</span><button type="button" onClick={() => selectUnit(visible[Math.min(visible.length - 1, activeIndex + 1)]?.id ?? active.id)} disabled={activeIndex === visible.length - 1}>下一个单元 →</button></div>
        </article>}
      </div>
    </section>
  );
}
