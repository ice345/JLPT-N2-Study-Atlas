import n1 from "@/app/data/vocabulary/n1.json";
import n2 from "@/app/data/vocabulary/n2.json";
import n3 from "@/app/data/vocabulary/n3.json";
import n4 from "@/app/data/vocabulary/n4.json";
import n5 from "@/app/data/vocabulary/n5.json";
import metadata from "@/app/data/vocabulary/meta.json";
import {
  vocabularyKanaGroups,
  vocabularyLevels,
  type VocabularyEntry,
  type VocabularyLevel,
  type VocabularyMetadata,
  type VocabularyQueryResult,
  type VocabularySourceKind,
} from "@/app/lib/vocabulary-types";

const catalogs: Record<VocabularyLevel, VocabularyEntry[]> = {
  N1: n1 as VocabularyEntry[],
  N2: n2 as VocabularyEntry[],
  N3: n3 as VocabularyEntry[],
  N4: n4 as VocabularyEntry[],
  N5: n5 as VocabularyEntry[],
};

export const vocabularyMetadata = metadata as VocabularyMetadata;

export function parseVocabularyLevel(value: string | null | undefined): VocabularyLevel {
  const normalized = value?.toUpperCase();
  return vocabularyLevels.find((level) => level === normalized) ?? "N2";
}

function searchText(entry: VocabularyEntry) {
  return [
    entry.word,
    entry.reading,
    entry.meaning,
    entry.category ?? "",
    ...entry.examples.flatMap((example) => [example.japanese, example.chinese]),
  ]
    .join(" ")
    .toLowerCase();
}

function randomScore(value: string, seed: string) {
  let hash = 2166136261;
  const input = `${seed}:${value}`;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

type VocabularyQuery = {
  level: VocabularyLevel;
  query?: string;
  group?: string;
  examples?: "all" | "with" | "without";
  source?: "all" | VocabularySourceKind;
  order?: "source" | "random";
  seed?: string;
  page?: number;
  pageSize?: number;
};

export function queryVocabulary({
  level,
  query = "",
  group = "全部",
  examples = "all",
  source = "all",
  order = "source",
  seed = "study-garden",
  page = 1,
  pageSize = 18,
}: VocabularyQuery): VocabularyQueryResult {
  const catalog = catalogs[level];
  const keyword = query.trim().toLowerCase().slice(0, 120);
  const safeGroup = vocabularyKanaGroups.includes(
    group as (typeof vocabularyKanaGroups)[number],
  )
    ? group
    : "全部";
  const safePageSize = Number.isFinite(pageSize)
    ? Math.max(6, Math.min(48, Math.floor(pageSize)))
    : 18;

  const baseEntries = catalog.filter((entry) => {
    const inSearch = !keyword || searchText(entry).includes(keyword);
    const hasExamples = entry.examples.length > 0;
    const inExampleFilter =
      examples === "all" || (examples === "with" ? hasExamples : !hasExamples);
    const inSource = source === "all" || entry.sourceKind === source;
    return inSearch && inExampleFilter && inSource;
  });

  const groupCounts = Object.fromEntries(
    vocabularyKanaGroups.map((name) => [
      name,
      name === "全部"
        ? baseEntries.length
        : baseEntries.filter((entry) => entry.kanaGroup === name).length,
    ]),
  );
  const filtered =
    safeGroup === "全部"
      ? baseEntries
      : baseEntries.filter((entry) => entry.kanaGroup === safeGroup);

  if (order === "random") {
    filtered.sort(
      (left, right) => randomScore(left.id, seed) - randomScore(right.id, seed),
    );
  }

  const pageCount = Math.max(1, Math.ceil(filtered.length / safePageSize));
  const safePage = Number.isFinite(page)
    ? Math.max(1, Math.min(pageCount, Math.floor(page)))
    : 1;
  const start = (safePage - 1) * safePageSize;

  return {
    level,
    entries: filtered.slice(start, start + safePageSize),
    total: catalog.length,
    filteredTotal: filtered.length,
    page: safePage,
    pageSize: safePageSize,
    pageCount,
    groupCounts,
  };
}
