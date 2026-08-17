import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";

const sourceRoot = resolve(process.argv[2] ?? "JLPT_Study_database");
const outputRoot = resolve(process.argv[3] ?? "content/final-notes");

async function walk(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => entry.isDirectory() ? walk(join(directory, entry.name)) : [join(directory, entry.name)]));
  return files.flat();
}

function groupFor(path) {
  if (path.includes("JLPT_N2_听力问题1-2")) return "listening-problems-1-2";
  if (path.includes("JLPT_N2_听力问题四")) return "listening-problem-4";
  if (path.includes("JLPT_N2_Typst_Project") || path.includes("N2_語彙文法")) return "language-knowledge";
  if (path.includes("問題7")) return "language-problem-7";
  return "n2-review-and-strategy";
}

function isSourceOnly(path) {
  const name = path.split("/").at(-1) ?? "";
  return path.includes("jlpt-study-site/") || /^(?:20\d{2}|201\d)(?:年)?(?:[._-]|\.md$)/u.test(name) || /(?:真题|原文|年度)/u.test(name) && /^\D*20\d{2}/u.test(name);
}

function normalise(block) {
  return block.normalize("NFKC").replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().toLowerCase();
}

function blocksFrom(source) {
  return source.replace(/\r\n/g, "\n").split(/\n\s*\n/g).map((block) => block.trim()).filter((block) => block.length > 8);
}

const allFiles = (await walk(sourceRoot)).filter((path) => path.endsWith(".md"));
const candidates = allFiles.filter((path) => !isSourceOnly(relative(sourceRoot, path)));
const groups = new Map();
for (const file of candidates) {
  const relativePath = relative(sourceRoot, file);
  const key = groupFor(relativePath);
  const current = groups.get(key) ?? [];
  current.push({ file, relativePath });
  groups.set(key, current);
}

await rm(outputRoot, { recursive: true, force: true });
await mkdir(outputRoot, { recursive: true });
const manifest = { generatedAt: new Date().toISOString(), sourceRoot: relative(process.cwd(), sourceRoot), groups: [] };

for (const [group, files] of groups) {
  const seen = new Map();
  const duplicateBlocks = [];
  const output = [`# JLPT N2 最终完整笔记：${group}`, "", "> 此文件由总结型 Markdown 合并生成。原始资料保持不变；预测内容、表格和例句均按原顺序保留。", "", "## 来源", ...files.map(({ relativePath }) => `- ${relativePath}`), ""];
  let retained = 0;
  for (const { file, relativePath } of files.sort((left, right) => left.relativePath.localeCompare(right.relativePath, "zh"))) {
    const source = await readFile(file, "utf8");
    const unique = [];
    for (const block of blocksFrom(source)) {
      const key = createHash("sha256").update(normalise(block)).digest("hex");
      const first = seen.get(key);
      if (first) { duplicateBlocks.push({ source: relativePath, duplicateOf: first, preview: block.slice(0, 120) }); continue; }
      seen.set(key, relativePath);
      unique.push(block);
    }
    if (unique.length) {
      output.push(`<!-- source: ${relativePath} -->`, ...unique, "");
      retained += unique.length;
    }
  }
  const fileName = `${group}.md`;
  await writeFile(join(outputRoot, fileName), output.join("\n"), "utf8");
  manifest.groups.push({ group, file: fileName, sourceCount: files.length, retainedBlocks: retained, exactDuplicateBlocks: duplicateBlocks.length, duplicates: duplicateBlocks });
}
await writeFile(join(outputRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
console.log(`Created ${manifest.groups.length} final-note files in ${outputRoot}`);
