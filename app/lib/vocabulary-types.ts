export const vocabularyLevels = ["N1", "N2", "N3", "N4", "N5"] as const;
export type VocabularyLevel = (typeof vocabularyLevels)[number];

export const vocabularyKanaGroups = [
  "全部",
  "あ行",
  "か行",
  "さ行",
  "た行",
  "な行",
  "は行",
  "ま行",
  "や行",
  "ら行",
  "わ行",
  "其他",
] as const;

export type VocabularyExample = {
  japanese: string;
  chinese: string;
  source: "source" | "supplement";
  furigana: {
    text: string;
    reading?: string;
  }[];
};

export type VocabularySourceKind = "level" | "merged" | "legacy";

export type VocabularyEntry = {
  id: string;
  level: VocabularyLevel;
  sourceIndex: number;
  word: string;
  reading: string;
  meaning: string;
  examples: VocabularyExample[];
  kanaGroup: string;
  category: string | null;
  pitch: string | null;
  sourceKind: VocabularySourceKind;
  legacySource: string | null;
};

export type VocabularyLevelMetadata = {
  level: VocabularyLevel;
  total: number;
  markdown: number;
  merged: number;
  legacyOnly: number;
  supplementedExampleEntries: number;
  exampleEntries: number;
  exampleSentences: number;
};

export type VocabularyMetadata = {
  total: number;
  levels: Record<VocabularyLevel, VocabularyLevelMetadata>;
};

export type VocabularyQueryResult = {
  level: VocabularyLevel;
  entries: VocabularyEntry[];
  total: number;
  filteredTotal: number;
  page: number;
  pageSize: number;
  pageCount: number;
  groupCounts: Record<string, number>;
};
