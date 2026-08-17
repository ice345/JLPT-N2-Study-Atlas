import fs from "node:fs";
import path from "node:path";

const sourceRoot = process.argv[2];
if (!sourceRoot) throw new Error("Usage: node scripts/extract-complete-notes.mjs <JLPT source root>");

const finalTypst = path.join(
  sourceRoot,
  "N2_語彙文法_2026_07_公式教材風_HTML交叉_問題7接続強化_最終完全版",
  "chapters",
);
const outputDir = path.resolve("app/data/complete-notes");
fs.mkdirSync(outputDir, { recursive: true });

const read = (file) => fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");

function replaceBalancedFunction(text, name, replacer) {
  const token = `#${name}[`;
  let cursor = 0;
  while ((cursor = text.indexOf(token, cursor)) !== -1) {
    const start = cursor + token.length;
    let depth = 1;
    let end = start;
    for (; end < text.length; end++) {
      if (text[end] === "[") depth++;
      if (text[end] === "]") depth--;
      if (depth === 0) break;
    }
    if (depth !== 0) break;
    text = `${text.slice(0, cursor)}${replacer(text.slice(start, end))}${text.slice(end + 1)}`;
    cursor += 1;
  }
  return text;
}

function normalizeTypstInline(text) {
  let previous = "";
  while (previous !== text) {
    previous = text;
    text = text.replace(/#furigana\[([^\[\]]*)\]\[([^\[\]]*)\]/gu, "{{ruby:$1|$2}}");
    text = replaceBalancedFunction(text, "strong", (value) => value);
    text = replaceBalancedFunction(text, "emph", (value) => value);
  }
  return text
    .replace(/#answer-slots\([^)]*\)/gu, "＿＿★＿＿")
    .replace(/#(?:horizontalrule|sectionbreak|reviewbreak|pagebreak)\([^)]*\)/gu, "")
    .replace(/#(?:horizontalrule|sectionbreak|reviewbreak)\b/gu, "")
    .replace(/\\\s*$/gmu, " ")
    .replace(/`([^`]*)`/gu, "$1")
    .replace(/\*\*([^*]+)\*\*/gu, "$1");
}

function cleanText(text) {
  return normalizeTypstInline(text)
    // The first generated JSON pass preserved parser structure labels as
    // literal text. Remove them at extraction time so the source data stays
    // clean as well as the React renderer.
    .replace(/(?:^|(?<=\s))text\s+id="[^"]*"\s*/gu, "")
    .replace(/`text(?=\s|$)/gu, "")
    .replace(/(?:^|(?<=\s))text(?=\s|$)/gu, "")
    .replace(/<[^>\n]+>/gu, "")
    .replace(/#(?:quote|box|block|align|text)\([^)]*\)/gu, "")
    .replace(/#\w+\([^)]*\)/gu, "")
    .replace(/#\w+/gu, "")
    .replace(/^\s*\[|\]\s*$/gmu, "")
    .replace(/\s+/gu, " ")
    .trim();
}

function findMatchingParen(text, openIndex) {
  let depth = 0;
  let quote = null;
  for (let i = openIndex; i < text.length; i++) {
    const char = text[i];
    if (quote) {
      if (char === quote && text[i - 1] !== "\\") quote = null;
      continue;
    }
    if (char === '"' || char === "'") {
      quote = char;
      continue;
    }
    if (char === "(") depth++;
    if (char === ")") depth--;
    if (depth === 0) return i;
  }
  return -1;
}

function bracketCells(text) {
  const cells = [];
  let depth = 0;
  let start = -1;
  for (let i = 0; i < text.length; i++) {
    if (text[i] === "[") {
      if (depth === 0) start = i + 1;
      depth++;
    } else if (text[i] === "]") {
      depth--;
      if (depth === 0 && start >= 0) cells.push(cleanText(text.slice(start, i)));
    }
  }
  return cells.filter((cell) => cell.length > 0);
}

function parseTable(raw) {
  const normalized = normalizeTypstInline(raw);
  const columnMatch = normalized.match(/columns:\s*(\d+)/u);
  const headerStart = normalized.indexOf("table.header(");
  let headers = [];
  let body = normalized;
  if (headerStart !== -1) {
    const open = normalized.indexOf("(", headerStart);
    const close = findMatchingParen(normalized, open);
    headers = bracketCells(normalized.slice(open + 1, close));
    body = `${normalized.slice(0, headerStart)}${normalized.slice(close + 1)}`;
  }
  body = body.replace(/table\.hline\([^)]*\),?/gu, "");
  const columns = Number(columnMatch?.[1] ?? headers.length ?? 2) || 2;
  const cells = bracketCells(body);
  const rows = [];
  for (let index = 0; index < cells.length; index += columns) {
    const row = cells.slice(index, index + columns);
    if (row.length === columns) rows.push(row);
  }
  return { type: "table", headers: headers.slice(0, columns), rows };
}

function tokenizeTypst(source) {
  source = normalizeTypstInline(source);
  const tables = [];
  let cursor = 0;
  while ((cursor = source.indexOf("#table(", cursor)) !== -1) {
    const open = source.indexOf("(", cursor);
    const close = findMatchingParen(source, open);
    if (close === -1) break;
    const block = source.slice(open + 1, close);
    const token = `\n@@TABLE:${tables.length}@@\n`;
    tables.push(parseTable(block));
    let start = cursor;
    const wrapper = source.lastIndexOf("#book-table[", cursor);
    if (wrapper !== -1 && source.slice(wrapper, cursor).trim() === "#book-table[") start = wrapper;
    let end = close + 1;
    while (end < source.length && /[\s\]]/u.test(source[end])) {
      if (source[end] === "\n" && source.slice(end + 1).startsWith("\n")) break;
      end++;
    }
    source = `${source.slice(0, start)}${token}${source.slice(end)}`;
    cursor = start + token.length;
  }

  const callouts = [];
  const quotePattern = /#quote\([^)]*\)\[/gu;
  let match;
  while ((match = quotePattern.exec(source))) {
    const open = match.index + match[0].length - 1;
    let depth = 1;
    let close = open + 1;
    for (; close < source.length; close++) {
      if (source[close] === "[") depth++;
      if (source[close] === "]") depth--;
      if (depth === 0) break;
    }
    if (depth !== 0) break;
    const token = `\n@@CALLOUT:${callouts.length}@@\n`;
    callouts.push({ type: "callout", text: cleanText(source.slice(open + 1, close)) });
    source = `${source.slice(0, match.index)}${token}${source.slice(close + 1)}`;
    quotePattern.lastIndex = match.index + token.length;
  }
  return { source, tables, callouts };
}

function parseStructured(source, kind = "typst") {
  if (kind === "markdown") return parseMarkdown(source);
  const tokenized = tokenizeTypst(source);
  const lines = tokenized.source.split("\n");
  const blocks = [];
  let paragraph = [];
  let list = [];
  const flushParagraph = () => {
    const text = cleanText(paragraph.join(" "));
    if (text) blocks.push({ type: "paragraph", text });
    paragraph = [];
  };
  const flushList = () => {
    if (list.length) blocks.push({ type: "list", ordered: false, items: list });
    list = [];
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    const table = line.match(/^@@TABLE:(\d+)@@$/u);
    const callout = line.match(/^@@CALLOUT:(\d+)@@$/u);
    const heading = line.match(/^(={1,4})\s+(.+)$/u);
    const bullet = line.match(/^[-+]\s+(.+)$/u);
    if (table || callout || heading || bullet || !line) {
      flushParagraph();
      if (!bullet) flushList();
    }
    if (!line) continue;
    if (table) {
      blocks.push(tokenized.tables[Number(table[1])]);
      continue;
    }
    if (callout) {
      blocks.push(tokenized.callouts[Number(callout[1])]);
      continue;
    }
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: cleanText(heading[2]) });
      continue;
    }
    if (bullet) {
      list.push(cleanText(bullet[1]));
      continue;
    }
    if (/^#import\b|^<[^>]+>$|^#(?:horizontalrule|sectionbreak|reviewbreak)/u.test(line)) continue;
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

function parseMarkdown(source) {
  const lines = source.split("\n");
  const blocks = [];
  let paragraph = [];
  let list = [];
  const flushParagraph = () => {
    const text = cleanText(paragraph.join(" "));
    if (text) blocks.push({ type: "paragraph", text });
    paragraph = [];
  };
  const flushList = () => {
    if (list.length) blocks.push({ type: "list", ordered: false, items: list });
    list = [];
  };
  for (let index = 0; index < lines.length; index++) {
    const line = lines[index].trim();
    const heading = line.match(/^(#{1,4})\s+(.+)$/u);
    const bullet = line.match(/^[-*+]\s+(.+)$/u);
    const ordered = line.match(/^\d+[.)]\s+(.+)$/u);
    if (heading || bullet || ordered || !line || line.startsWith("|") || line.startsWith(">")) {
      flushParagraph();
      if (!bullet && !ordered) flushList();
    }
    if (!line || /^---+$/u.test(line)) continue;
    if (heading) {
      blocks.push({ type: "heading", level: heading[1].length, text: cleanText(heading[2]) });
      continue;
    }
    if (bullet || ordered) {
      list.push(cleanText((bullet ?? ordered)[1]));
      continue;
    }
    if (line.startsWith(">")) {
      const parts = [];
      while (index < lines.length && lines[index].trim().startsWith(">")) {
        parts.push(lines[index].trim().replace(/^>\s?/u, ""));
        index++;
      }
      index--;
      blocks.push({ type: "callout", text: cleanText(parts.join(" ")) });
      continue;
    }
    if (line.startsWith("|") && lines[index + 1]?.trim().match(/^\|?\s*:?-+/u)) {
      const split = (value) => value.split("|").slice(1, -1).map((cell) => cleanText(cell));
      const headers = split(line);
      index += 2;
      const rows = [];
      while (index < lines.length && lines[index].trim().startsWith("|")) {
        const row = split(lines[index].trim());
        if (row.length) rows.push(row);
        index++;
      }
      index--;
      blocks.push({ type: "table", headers, rows });
      continue;
    }
    paragraph.push(line);
  }
  flushParagraph();
  flushList();
  return blocks;
}

function slugify(value, index) {
  return `${value.toLowerCase().replace(/\{\{ruby:([^|]+)\|[^}]+\}\}/gu, "$1").replace(/[^a-z0-9\u3040-\u30ff\u3400-\u9fff]+/gu, "-").replace(/^-|-$/gu, "").slice(0, 42) || "section"}-${index}`;
}

function toDocument(title, sourcePath, blocks) {
  const sections = [];
  let current = { id: "introduction-0", title: "导言与使用方式", level: 1, blocks: [] };
  for (const block of blocks) {
    if (block.type === "heading" && block.level <= 2) {
      if (current.blocks.length || sections.length === 0) sections.push(current);
      current = { id: slugify(block.text, sections.length), title: block.text, level: block.level, blocks: [] };
    } else if (block.type === "heading") {
      current.blocks.push(block);
    } else {
      current.blocks.push(block);
    }
  }
  if (current.blocks.length) sections.push(current);
  const tables = sections.flatMap((section) => section.blocks).filter((block) => block.type === "table");
  return {
    title,
    source: sourcePath,
    stats: {
      sections: sections.length,
      tables: tables.length,
      rows: tables.reduce((sum, table) => sum + table.rows.length, 0),
    },
    sections: sections.filter((section) => section.blocks.length),
  };
}

function between(text, start, end) {
  const from = text.indexOf(start);
  if (from === -1) return "";
  const to = end ? text.indexOf(end, from + start.length) : -1;
  return text.slice(from, to === -1 ? undefined : to);
}

function sliceMarkdownForProblem(source, problem) {
  const lines = source.split("\n");
  let foundHeading = false;
  let include = false;
  const selected = [];
  for (const line of lines) {
    const heading = line.match(/^#{1,4}\s+.*?(?:問題|问题)\s*([1-9])/u);
    if (heading) {
      foundHeading = true;
      include = Number(heading[1]) === problem;
    }
    if (include) selected.push(line);
  }
  return foundHeading ? selected.join("\n") : "";
}

function addSupplement(target, title, sourcePath, raw, problem) {
  const source = problem ? sliceMarkdownForProblem(raw, problem) : raw;
  if (!source.trim()) return;
  const document = toDocument(title, sourcePath, parseStructured(source, "markdown"));
  if (document.sections.length > 0 && (document.stats.rows > 0 || document.sections.some((section) => section.blocks.length > 2))) target.push(document);
}

const combined = read(path.join(finalTypst, "problem1-3.typ"));
const commonIntro = between(combined, "=== 0. 本版到底", "== 第二部分：");
const q1Source = [
  commonIntro,
  between(combined, "== 第二部分：", "== 第三部分："),
  between(combined, "=== 1. #furigana[問題][もんだい]1的换词逻辑", "=== 2. #furigana[問題][もんだい]2"),
  between(combined, "=== #furigana[問題][もんだい]1：考前30分钟", "=== #furigana[問題][もんだい]2："),
  between(combined, "== 第八部分：", "=== 8.4"),
  between(combined, "=== 8.5", "=== 8.6"),
  between(combined, "=== #furigana[問題][もんだい]1：読み方最终方向", "=== #furigana[問題][もんだい]2："),
  between(combined, "=== V2-1", "=== V2-2"),
  between(combined, "== 追加最終補強：2026年7月向け", "=== 問題2 漢字：S级"),
  between(combined, "== 究極完成版追加：", "=== 問題2：近形"),
  between(combined, "== HTML 1500詞", null),
].join("\n");
const q2Source = [
  commonIntro,
  between(combined, "== 第三部分：", "== 第四部分："),
  between(combined, "=== 2. #furigana[問題][もんだい]2", "== 第五部分："),
  between(combined, "=== #furigana[問題][もんだい]2：考前30分钟", "== 第六部分："),
  between(combined, "== 第八部分：", "=== 8.1"),
  between(combined, "=== 8.4", "=== 8.6"),
  between(combined, "=== #furigana[問題][もんだい]2：#furigana[漢字][かんじ]書き最终方向", "=== #furigana[問題][もんだい]3："),
  between(combined, "=== V2-2", "=== V2-3"),
  between(combined, "=== 問題2 漢字：S级", "=== 10分钟压缩背法"),
  between(combined, "=== 問題2：近形", "=== 問題3：一字構詞"),
  between(combined, "== HTML 1500詞", null),
].join("\n");
const q3Source = [
  between(combined, "== 第七部分：", "== 第八部分："),
  between(combined, "=== 8.6", "=== 最终压缩版"),
  between(combined, "=== #furigana[問題][もんだい]3：語形成最终方向", "=== 最终#furigana[判断]"),
  between(combined, "=== V2-3", "=== V2-4"),
  between(combined, "=== 問題3：一字構詞", "== HTML 1500詞"),
].join("\n");

const languageDocs = {
  q1: [toDocument("問題1 完整版：読み方・HTML1500交叉・防背刺池", "最终Typst/chapters/problem1-3.typ", parseStructured(q1Source))],
  q2: [toDocument("問題2 完整版：漢字書き・同音近形・多義漢字", "最终Typst/chapters/problem1-3.typ", parseStructured(q2Source))],
  q3: [toDocument("問題3 完整版：語形成・全部既出表达・构词预测", "最终Typst/chapters/problem1-3.typ", parseStructured(q3Source))],
};

for (const number of [4, 5, 6, 7, 8]) {
  const file = `problem${number}.typ`;
  languageDocs[`q${number}`] = [toDocument(`問題${number} 最终 Typst 完整版`, `最终Typst/chapters/${file}`, parseStructured(read(path.join(finalTypst, file))))];
}

const q9Path = path.join(sourceRoot, "JLPT_N2_Part01", "JLPT_N2_文章の文法_問題9.md");
languageDocs.q9 = [toDocument("問題9 文章の文法完整笔记", "JLPT_N2_Part01/JLPT_N2_文章の文法_問題9.md", parseStructured(read(q9Path), "markdown"))];

// Supplement the canonical Typst edition with the user's annual Markdown notes.
// They remain separate source documents here; the learning atlas merges their
// unique blocks while preserving the source trail.
const part01Dir = path.join(sourceRoot, "JLPT_N2_Part01");
for (const file of fs.readdirSync(part01Dir).filter((name) => name.endsWith(".md") && !name.includes("問題9"))) {
  const raw = read(path.join(part01Dir, file));
  for (const problem of [1, 2, 3, 4, 5, 6, 7, 8]) {
    addSupplement(languageDocs[`q${problem}`], `年度真题补充：問題${problem} · ${file}`, path.relative(sourceRoot, path.join(part01Dir, file)), raw, problem);
  }
}

const sourceMdDir = path.join(sourceRoot, "JLPT_N2_Typst_Project", "source_md");
for (const file of fs.readdirSync(sourceMdDir).filter((name) => name.endsWith(".md"))) {
  const raw = read(path.join(sourceMdDir, file));
  const numbers = [...file.matchAll(/問題([1-8])/gu)].map((match) => Number(match[1]));
  for (const problem of new Set(numbers)) addSupplement(languageDocs[`q${problem}`], `Typst 源 Markdown 补充：問題${problem}`, path.relative(sourceRoot, path.join(sourceMdDir, file)), raw, problem);
}

const bookletDir = path.join(sourceRoot, "JLPT_N2_Typst_Project", "JLPT_N2_問題1-8_高分應試最終版_分冊");
for (const file of fs.readdirSync(bookletDir).filter((name) => name.endsWith(".md"))) {
  const match = file.match(/問題([1-8])/u);
  if (!match) continue;
  const problem = Number(match[1]);
  addSupplement(languageDocs[`q${problem}`], `分册 Markdown 补充：問題${problem}`, path.relative(sourceRoot, path.join(bookletDir, file)), read(path.join(bookletDir, file)));
}

const rootPrediction = path.join(sourceRoot, "JLPT_N2_問題7_全年度全月份再审视_2019补漏_2026大胆预测.md");
if (fs.existsSync(rootPrediction)) addSupplement(languageDocs.q7, "問題7 全年度再审视与预测补充", path.relative(sourceRoot, rootPrediction), read(rootPrediction));

for (const [slug, docs] of Object.entries(languageDocs)) {
  fs.writeFileSync(path.join(outputDir, `${slug}.json`), `${JSON.stringify(docs)}\n`);
}

const p4Dir = path.join(sourceRoot, "JLPT_N2_听力问题四");
const p4Sources = [
  ["問題4 完全チェック・最終整合版", "N2_問題4_高分最終版_2010-2025_完全チェック_最終整合.md"],
  ["問題4 真题例句回答强化版", "N2_問題4_高分最終版_2010-2025_真題例句回答強化版.md"],
  ["問題4 全功能句训练版", "問題4のトレーニング.md"],
];
const p4Docs = p4Sources.map(([title, file]) => toDocument(title, `JLPT_N2_听力问题四/${file}`, parseStructured(read(path.join(p4Dir, file)), "markdown")));
for (const file of fs.readdirSync(p4Dir).filter((name) => name.endsWith(".md") && !/問題1[・-]?2|問題1-3|深度分析报告/u.test(name))) {
  addSupplement(p4Docs, `問題4 年度与补充资料：${file}`, path.relative(sourceRoot, path.join(p4Dir, file)), read(path.join(p4Dir, file)));
}
fs.writeFileSync(path.join(outputDir, "listening-p4.json"), `${JSON.stringify(p4Docs)}\n`);

const p12Dir = path.join(sourceRoot, "JLPT_N2_听力问题1-2");
const p12Docs = fs.readdirSync(p12Dir)
  // This directory also contains two "問題1-3" language-knowledge drafts.
  // They are useful source files, but importing them here polluted the
  // listening 1/2 page with kanji and word-formation chapters.
  .filter((file) => file.endsWith(".md") && !/問題1-3/u.test(file))
  .map((file) => toDocument(`問題1・2 补充资料：${file}`, path.relative(sourceRoot, path.join(p12Dir, file)), parseStructured(read(path.join(p12Dir, file)), "markdown")))
  .filter((document) => document.sections.length > 0);
fs.writeFileSync(path.join(outputDir, "listening-p12.json"), `${JSON.stringify(p12Docs)}\n`);

const summary = Object.fromEntries(
  [...Object.entries(languageDocs), ["listening-p4", p4Docs], ["listening-p12", p12Docs]].map(([key, docs]) => [key, docs.map((doc) => doc.stats)]),
);
console.log(JSON.stringify(summary, null, 2));
