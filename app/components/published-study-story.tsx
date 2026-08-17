import type { StudyStoryDraft } from "@/app/data/study-story-source";

const sections: Array<[keyof Pick<StudyStoryDraft, "start" | "method" | "loop" | "advice" | "stage" | "closing">, string]> = [
  ["start", "我从什么状态开始"],
  ["method", "我怎样使用这个网站"],
  ["loop", "我的一次复习闭环"],
  ["advice", "对其他学习者的建议"],
  ["stage", "我现在的阶段"],
  ["closing", "给后来使用者的一句话"],
];

function StoryText({ value }: { value: string }) {
  return <div className="published-story-copy">{value.split(/\n{2,}/u).filter(Boolean).map((paragraph, index) => <p key={`${paragraph}-${index}`}>{paragraph}</p>)}</div>;
}

export function PublishedStudyStory({ draft }: { draft: StudyStoryDraft }) {
  return (
    <article className="published-story">
      <header className="published-story-hero"><span>MY N2 STUDY STORY</span><h1>{draft.title}</h1><p>{draft.intro}</p></header>
      <div className="published-story-body">{sections.map(([key, heading], index) => <section key={key}><span>{String(index + 1).padStart(2, "0")}</span><div><h2>{heading}</h2><StoryText value={draft[key]} /></div></section>)}</div>
    </article>
  );
}
