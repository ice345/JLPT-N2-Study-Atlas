import markdown from "@/content/my-study-story.md?raw";

export type StudyStoryDraft = {
  title: string;
  intro: string;
  start: string;
  method: string;
  loop: string;
  advice: string;
  stage: string;
  closing: string;
};

const sectionNames: Array<[keyof Omit<StudyStoryDraft, "title" | "intro">, string]> = [
  ["start", "我从什么状态开始"],
  ["method", "我怎样使用这个网站"],
  ["loop", "我的一次复习闭环"],
  ["advice", "对其他学习者的建议"],
  ["stage", "我现在的阶段"],
  ["closing", "给后来使用者的一句话"],
];

function clean(value: string) {
  return value.replace(/^\s*>\s?/u, "").trim();
}

function extractSection(source: string, heading: string) {
  const match = source.match(new RegExp(`^##\\s+${heading}\\s*$([\\s\\S]*?)(?=^##\\s+|$)`, "mu"));
  return match?.[1]?.trim() ?? "";
}

export function parseStudyStory(source: string): StudyStoryDraft {
  const title = source.match(/^#\s+(.+)$/mu)?.[1]?.trim() ?? "我的 JLPT N2 备考经历";
  const intro = source.match(/^>\s*(.+)$/mu)?.[1]?.trim() ?? "";
  const draft = { title, intro, start: "", method: "", loop: "", advice: "", stage: "", closing: "" } satisfies StudyStoryDraft;
  for (const [key, heading] of sectionNames) draft[key] = clean(extractSection(source, heading));
  return draft;
}

export function storyToMarkdown(draft: StudyStoryDraft) {
  return [
    `# ${draft.title}`,
    "",
    `> ${draft.intro}`,
    "",
    ...sectionNames.flatMap(([key, heading]) => [`## ${heading}`, "", draft[key] || "（待补充）", ""]),
  ].join("\n").trim() + "\n";
}

export const publishedStudyStory = parseStudyStory(markdown);
