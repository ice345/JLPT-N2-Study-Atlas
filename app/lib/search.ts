import type { CompleteDocument, NoteBlock } from "@/app/components/complete-notes";
import { practiceAreaNames, practiceQuestions } from "@/app/data/practice";
import q1 from "@/app/data/complete-notes/q1.json";
import q2 from "@/app/data/complete-notes/q2.json";
import q3 from "@/app/data/complete-notes/q3.json";
import q4 from "@/app/data/complete-notes/q4.json";
import q5 from "@/app/data/complete-notes/q5.json";
import q6 from "@/app/data/complete-notes/q6.json";
import q7 from "@/app/data/complete-notes/q7.json";
import q8 from "@/app/data/complete-notes/q8.json";
import q9 from "@/app/data/complete-notes/q9.json";
import listeningP12 from "@/app/data/complete-notes/listening-p12.json";
import listeningP4 from "@/app/data/complete-notes/listening-p4.json";

export type SearchResult = { id: string; kind: string; title: string; excerpt: string; href: string; source: string };
type Entry = SearchResult & { haystack: string; normalized: string };

function normalize(value: string) {
  return value.normalize("NFKC").toLowerCase().replace(/[\s　〜~・、】【「」『』（）()（）\-—_.,，。！？!?：:]/gu, "");
}

function blockText(block: NoteBlock) {
  if (block.type === "list") return block.items.join(" ");
  if (block.type === "table") return `${block.headers.join(" ")} ${block.rows.flat().join(" ")}`;
  return block.text;
}

const documentGroups: Array<{ kind: string; href: string; documents: CompleteDocument[] }> = [
  { kind: "语言知识 · 問題1", href: "/n2/language/q1", documents: q1 as CompleteDocument[] },
  { kind: "语言知识 · 問題2", href: "/n2/language/q2", documents: q2 as CompleteDocument[] },
  { kind: "语言知识 · 問題3", href: "/n2/language/q3", documents: q3 as CompleteDocument[] },
  { kind: "语言知识 · 問題4", href: "/n2/language/q4", documents: q4 as CompleteDocument[] },
  { kind: "语言知识 · 問題5", href: "/n2/language/q5", documents: q5 as CompleteDocument[] },
  { kind: "语言知识 · 問題6", href: "/n2/language/q6", documents: q6 as CompleteDocument[] },
  { kind: "语言知识 · 問題7", href: "/n2/language/q7", documents: q7 as CompleteDocument[] },
  { kind: "语言知识 · 問題8", href: "/n2/language/q8", documents: q8 as CompleteDocument[] },
  { kind: "语言知识 · 問題9", href: "/n2/language/q9", documents: q9 as CompleteDocument[] },
  { kind: "听力 · 問題1・2", href: "/n2/listening/problem-1-2", documents: listeningP12 as CompleteDocument[] },
  { kind: "听力 · 問題4", href: "/n2/listening/problem-4", documents: listeningP4 as CompleteDocument[] },
];

function buildIndex(): Entry[] {
  const entries: Entry[] = [];
  documentGroups.forEach((group) => group.documents.forEach((document) => document.sections.forEach((section) => {
    const text = section.blocks.map(blockText).join(" ");
    const haystack = `${group.kind} ${document.title} ${section.title} ${text}`;
    entries.push({ id: `${group.href}-${document.source}-${section.id}`, kind: group.kind, title: section.title, excerpt: text.slice(0, 220), href: group.href, source: document.source, haystack, normalized: normalize(haystack) });
  })));
  practiceQuestions.forEach((question) => {
    const haystack = `${practiceAreaNames[question.area]} ${question.title} ${question.prompt} ${question.context ?? ""} ${question.choices.join(" ")} ${question.skill} ${question.explanation}`;
    entries.push({ id: `practice-${question.id}`, kind: "练习题", title: question.title, excerpt: `${question.prompt} · ${question.skill}`, href: "/n2/practice", source: question.source, haystack, normalized: normalize(haystack) });
  });
  return entries;
}

const index = buildIndex();

function publicResult(entry: Entry): SearchResult {
  return { id: entry.id, kind: entry.kind, title: entry.title, excerpt: entry.excerpt, href: entry.href, source: entry.source };
}

export function searchStudyContent(query: string) {
  const raw = query.trim();
  const keyword = normalize(raw);
  if (!keyword) return index.slice(0, 12).map(publicResult);
  return index
    .filter((entry) => entry.normalized.includes(keyword))
    .sort((left, right) => {
      const leftTitle = normalize(left.title).includes(keyword) ? 0 : 1;
      const rightTitle = normalize(right.title).includes(keyword) ? 0 : 1;
      return leftTitle - rightTitle || left.title.localeCompare(right.title, "ja");
    })
    .slice(0, 40)
    .map(publicResult);
}
