import fs from "node:fs";
import path from "node:path";
import KuroshiroModule from "kuroshiro";
import KuromojiAnalyzer from "kuroshiro-analyzer-kuromoji";

const projectRoot = path.resolve(import.meta.dirname, "..");
const sourceDirectory = path.join(
  projectRoot,
  "JLPT_Study_database",
  "JLPT_N2_Word",
);
const outputDirectory = path.join(projectRoot, "app", "data", "vocabulary");
const legacyN2Path = path.join(projectRoot, "app", "data", "vocabulary.json");
const supplementalExamplesPath = path.join(
  outputDirectory,
  "supplemental-examples.json",
);
const levels = ["N1", "N2", "N3", "N4", "N5"];
const Kuroshiro = KuroshiroModule.default;
const kuroshiro = new Kuroshiro();
await kuroshiro.init(new KuromojiAnalyzer());
const supplementalExamples = JSON.parse(
  fs.readFileSync(supplementalExamplesPath, "utf8"),
);

function decodeText(value) {
  return value
    .replace(/\\\|/gu, "|")
    .replace(/&amp;/gu, "&")
    .replace(/&lt;/gu, "<")
    .replace(/&gt;/gu, ">")
    .replace(/&quot;/gu, '"')
    .replace(/&#39;/gu, "'")
    .replace(/<[^>]+>/gu, "")
    .trim();
}

function katakanaToHiragana(value) {
  return [...value]
    .map((character) => {
      const codePoint = character.codePointAt(0);
      if (codePoint && codePoint >= 0x30a1 && codePoint <= 0x30f6) {
        return String.fromCodePoint(codePoint - 0x60);
      }
      return character;
    })
    .join("");
}

function normalizedReading(reading, word) {
  const value = /[a-z]/iu.test(reading) ? katakanaToHiragana(word) : reading;
  return katakanaToHiragana(value).replace(/^[〜～\-・\s]+/u, "").trim();
}

const kanaRows = [
  ["あ行", "あいうえおぁぃぅぇぉゔ"],
  ["か行", "かきくけこがぎぐげご"],
  ["さ行", "さしすせそざじずぜぞ"],
  ["た行", "たちつてとだぢづでどっ"],
  ["な行", "なにぬねの"],
  ["は行", "はひふへほばびぶべぼぱぴぷぺぽ"],
  ["ま行", "まみむめも"],
  ["や行", "やゆよゃゅょ"],
  ["ら行", "らりるれろ"],
  ["わ行", "わをんゎ"],
];

function kanaGroup(reading, word) {
  const first = [...normalizedReading(reading, word)][0];
  return kanaRows.find(([, characters]) => characters.includes(first))?.[0] ?? "其他";
}

function parseExamples(rawValue) {
  if (!rawValue || rawValue.startsWith("—")) return [];

  const examples = [];
  const pattern = /\*\*(\d+)\.\*\*\s*([\s\S]*?)(?=<br><br>\*\*\d+\.\*\*|$)/gu;
  for (const match of rawValue.matchAll(pattern)) {
    const [japanesePart, ...translationParts] = match[2].split(/<br>\s*↳\s*/u);
    const japanese = decodeText(japanesePart.replace(/<br>/gu, " "));
    const chinese = decodeText(translationParts.join(" ").replace(/<br>/gu, " "));
    if (japanese) examples.push({ japanese, chinese, source: "source" });
  }
  return examples;
}

function supplementalKey(level, word, reading = "*") {
  return `${level}\u0000${word}\u0000${normalizedReading(reading, word) || "*"}`;
}

const supplementalExampleIndex = new Map();
for (const item of supplementalExamples) {
  const key = supplementalKey(item.level, item.word, item.reading);
  if (supplementalExampleIndex.has(key)) {
    throw new Error(`Duplicate supplemental vocabulary example: ${key}`);
  }
  supplementalExampleIndex.set(key, item.examples);
}

function attachSupplementalExamples(entries) {
  let supplemented = 0;
  for (const entry of entries) {
    if (entry.examples.length > 0) continue;
    const exactKey = supplementalKey(entry.level, entry.word, entry.reading);
    const wildcardKey = supplementalKey(entry.level, entry.word);
    const examples =
      supplementalExampleIndex.get(exactKey) ??
      supplementalExampleIndex.get(wildcardKey);
    if (!examples?.length) continue;
    entry.examples = examples.map((example) => ({
      ...example,
      source: "supplement",
    }));
    supplemented += 1;
  }
  return supplemented;
}

function parseFurigana(value) {
  const segments = [];
  const pattern = /<ruby>([\s\S]*?)<rp>\(<\/rp><rt>([\s\S]*?)<\/rt><rp>\)<\/rp><\/ruby>/gu;
  let cursor = 0;
  for (const match of value.matchAll(pattern)) {
    if (match.index > cursor) {
      segments.push({ text: value.slice(cursor, match.index) });
    }
    const text = decodeText(match[1]);
    const reading = decodeText(match[2]);
    segments.push(
      /^[ぁ-ゖー]+$/u.test(reading) && reading !== text
        ? { text, reading }
        : { text },
    );
    cursor = match.index + match[0].length;
  }
  if (cursor < value.length) segments.push({ text: value.slice(cursor) });
  return segments.length ? segments : [{ text: value }];
}

const furiganaCache = new Map();
async function furiganaFor(value) {
  if (furiganaCache.has(value)) return furiganaCache.get(value);
  const annotated = await kuroshiro.convert(value, {
    mode: "furigana",
    to: "hiragana",
  });
  const segments = parseFurigana(annotated);
  furiganaCache.set(value, segments);
  return segments;
}

async function enrichExamples(entries) {
  for (const entry of entries) {
    for (const example of entry.examples) {
      example.furigana = withTargetReading(
        await furiganaFor(example.japanese),
        example.japanese,
        entry,
      );
    }
  }
}

function sliceFurigana(segments, start, end) {
  const result = [];
  let cursor = 0;
  for (const segment of segments) {
    const segmentStart = cursor;
    const segmentEnd = cursor + segment.text.length;
    cursor = segmentEnd;
    const overlapStart = Math.max(start, segmentStart);
    const overlapEnd = Math.min(end, segmentEnd);
    if (overlapStart >= overlapEnd) continue;
    const text = segment.text.slice(overlapStart - segmentStart, overlapEnd - segmentStart);
    const wholeSegment = overlapStart === segmentStart && overlapEnd === segmentEnd;
    result.push(wholeSegment && segment.reading ? { text, reading: segment.reading } : { text });
  }
  return result;
}

function withTargetReading(segments, japanese, entry) {
  const target = entry.word
    .replace(/[（(][^）)]*[）)]/gu, "")
    .replace(/^[〜～]/u, "")
    .trim();
  const reading = normalizedReading(entry.reading, entry.word)
    .replace(/[（(][^）)]*[）)]/gu, "")
    .trim();
  const start = japanese.indexOf(target);
  if (
    start < 0 ||
    !/[々〆ヶ一-龯]/u.test(target) ||
    !/^[ぁ-ゖー]+$/u.test(reading)
  ) return segments;
  const end = start + target.length;
  return [
    ...sliceFurigana(segments, 0, start),
    { text: target, reading },
    ...sliceFurigana(segments, end, japanese.length),
  ];
}

function parseMarkdown(level) {
  const sourcePath = path.join(sourceDirectory, `JLPT_${level}_vocabulary.md`);
  const markdown = fs.readFileSync(sourcePath, "utf8");
  const declaredCount = Number.parseInt(
    markdown.match(/\*\*词条数\*\*：\*\*(\d+)\*\*/u)?.[1] ?? "0",
    10,
  );
  const entries = [];

  for (const line of markdown.split("\n")) {
    if (!/^\| \d+ \|/u.test(line)) continue;
    const cells = line.slice(1, -1).split("|").map((cell) => cell.trim());
    if (cells.length !== 5) {
      throw new Error(`${sourcePath}: malformed vocabulary row: ${line.slice(0, 120)}`);
    }
    const sourceIndex = Number.parseInt(cells[0], 10);
    const word = decodeText(cells[1]);
    const reading = decodeText(cells[2]);
    entries.push({
      id: `${level.toLowerCase()}-${sourceIndex}`,
      level,
      sourceIndex,
      word,
      reading,
      meaning: decodeText(cells[3]),
      examples: parseExamples(cells[4]),
      kanaGroup: kanaGroup(reading, word),
      category: null,
      pitch: null,
      sourceKind: "level",
      legacySource: null,
    });
  }

  if (entries.length !== declaredCount) {
    throw new Error(
      `${sourcePath}: declared ${declaredCount} entries but parsed ${entries.length}`,
    );
  }
  return entries;
}

function mergeLegacyN2(entries) {
  const legacy = JSON.parse(fs.readFileSync(legacyN2Path, "utf8"));
  const exact = new Map();
  const byWord = new Map();
  const usedLegacyIds = new Set();

  for (const item of legacy) {
    const exactKey = `${item.word}\u0000${normalizedReading(item.reading, item.word)}`;
    exact.set(exactKey, [...(exact.get(exactKey) ?? []), item]);
    byWord.set(item.word, [...(byWord.get(item.word) ?? []), item]);
  }

  let merged = 0;
  for (const entry of entries) {
    const exactKey = `${entry.word}\u0000${normalizedReading(entry.reading, entry.word)}`;
    const exactMatch = (exact.get(exactKey) ?? []).find(
      (item) => !usedLegacyIds.has(item.id),
    );
    const wordCandidates = (byWord.get(entry.word) ?? []).filter(
      (item) => !usedLegacyIds.has(item.id),
    );
    const legacyMatch = exactMatch ?? (wordCandidates.length === 1 ? wordCandidates[0] : null);
    if (!legacyMatch) continue;

    usedLegacyIds.add(legacyMatch.id);
    entry.category = legacyMatch.category || null;
    entry.pitch = legacyMatch.pitch || null;
    entry.sourceKind = "merged";
    entry.legacySource = legacyMatch.source || null;
    merged += 1;
  }

  const legacyOnly = legacy
    .filter((item) => !usedLegacyIds.has(item.id))
    .map((item) => {
      const reading = normalizedReading(item.reading, item.word) || item.reading;
      return {
        id: `n2-legacy-${item.id}`,
        level: "N2",
        sourceIndex: item.id,
        word: item.word,
        reading,
        meaning: item.meaning,
        examples: [],
        kanaGroup: kanaGroup(reading, item.word),
        category: item.category || null,
        pitch: item.pitch || null,
        sourceKind: "legacy",
        legacySource: item.source || null,
      };
    });

  return { entries: [...entries, ...legacyOnly], merged, legacyOnly: legacyOnly.length };
}

fs.mkdirSync(outputDirectory, { recursive: true });

const metadata = {
  total: 0,
  levels: {},
};

for (const level of levels) {
  const markdownEntries = parseMarkdown(level);
  const mergedResult =
    level === "N2"
      ? mergeLegacyN2(markdownEntries)
      : { entries: markdownEntries, merged: 0, legacyOnly: 0 };
  const entries = mergedResult.entries;
  const supplementedExampleEntries = attachSupplementalExamples(entries);
  await enrichExamples(entries);
  const exampleEntries = entries.filter((entry) => entry.examples.length > 0).length;
  const exampleSentences = entries.reduce((sum, entry) => sum + entry.examples.length, 0);

  metadata.levels[level] = {
    level,
    total: entries.length,
    markdown: markdownEntries.length,
    merged: mergedResult.merged,
    legacyOnly: mergedResult.legacyOnly,
    supplementedExampleEntries,
    exampleEntries,
    exampleSentences,
  };
  metadata.total += entries.length;

  fs.writeFileSync(
    path.join(outputDirectory, `${level.toLowerCase()}.json`),
    `${JSON.stringify(entries)}\n`,
  );
}

fs.writeFileSync(
  path.join(outputDirectory, "meta.json"),
  `${JSON.stringify(metadata, null, 2)}\n`,
);

console.log(JSON.stringify(metadata, null, 2));
