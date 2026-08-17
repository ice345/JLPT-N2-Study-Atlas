import fs from "node:fs";
import path from "node:path";

const sourceRoot = process.argv[2];

if (!sourceRoot) {
  throw new Error("Usage: node scripts/extract-jlpt-data.mjs <JLPT source root>");
}

const decode = (value) =>
  value
    .replace(/<rt>[\s\S]*?<\/rt>/g, "")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

const vocabPath = path.join(
  sourceRoot,
  "JLPT_N2_Word",
  "N2必背1500词_遮挡回忆完整版_手机触控版.html",
);
const vocabHtml = fs.readFileSync(vocabPath, "utf8");
const cardPattern =
  /<div class="card" data-category="([^"]+)" data-search="[^"]*">[\s\S]*?<span class="meaning">([\s\S]*?)<\/span>[\s\S]*?<span class="word masked"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<span class="reading-aside masked"[^>]*>([\s\S]*?)<\/span>[\s\S]*?<span class="meta">([\s\S]*?)<\/span>/g;

const vocabulary = [];
for (const match of vocabHtml.matchAll(cardPattern)) {
  const rawReading = decode(match[4]).replace(/^\(|\)$/g, "");
  const [reading, pitch = ""] = rawReading.split("/").map((part) => part.trim());
  vocabulary.push({
    id: vocabulary.length + 1,
    category: decode(match[1]),
    meaning: decode(match[2]),
    word: decode(match[3]),
    reading,
    pitch,
    source: decode(match[5]),
  });
}

if (vocabulary.length < 1400) {
  throw new Error(`Vocabulary extraction looks incomplete: ${vocabulary.length}`);
}

const resourcesPath = path.join(sourceRoot, "jlpt-study-site", "src", "data", "resources.json");
const resources = JSON.parse(fs.readFileSync(resourcesPath, "utf8")).map((item) => ({
  id: item.id,
  title: item.title,
  section: item.section,
  problem: item.problem ?? "",
  year: item.year ?? "",
  month: item.month ?? "",
  sourcePath: item.sourcePath,
  fileType: item.fileType,
  status: item.status,
}));

const outputDir = path.resolve("app/data");
fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(
  path.join(outputDir, "vocabulary.json"),
  `${JSON.stringify(vocabulary, null, 2)}\n`,
);
fs.writeFileSync(
  path.join(outputDir, "resources.json"),
  `${JSON.stringify(resources, null, 2)}\n`,
);

console.log(
  JSON.stringify({ vocabulary: vocabulary.length, resources: resources.length }),
);
