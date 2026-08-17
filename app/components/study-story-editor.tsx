"use client";

import { useEffect, useMemo, useState } from "react";
import { storyToMarkdown, type StudyStoryDraft } from "@/app/data/study-story-source";

const storageKey = "jlpt-n2-study-story-draft-v1";

export function StudyStoryEditor({ initial }: { initial: StudyStoryDraft }) {
  const [draft, setDraft] = useState(initial);
  const [saved, setSaved] = useState(false);
  const markdown = useMemo(() => storyToMarkdown(draft), [draft]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(storageKey);
      // Hydrate the optional browser-local draft after the published template is visible.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (stored) setDraft({ ...initial, ...JSON.parse(stored) });
    } catch {
      // Local drafts are optional; the published template remains available.
    }
  }, [initial]);

  function update(key: keyof StudyStoryDraft, value: string) {
    setDraft((current) => ({ ...current, [key]: value }));
    setSaved(false);
  }

  function saveLocal() {
    window.localStorage.setItem(storageKey, JSON.stringify(draft));
    setSaved(true);
  }

  function resetDraft() {
    window.localStorage.removeItem(storageKey);
    setDraft(initial);
    setSaved(false);
  }

  async function copyMarkdown() {
    await navigator.clipboard?.writeText(markdown);
    setSaved(true);
  }

  function downloadMarkdown() {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "my-study-story.md";
    link.click();
    URL.revokeObjectURL(url);
  }

  const fields: Array<[keyof StudyStoryDraft, string, string]> = [
    ["title", "页面标题", "例如：我从 N3 到 N2 的八个月"],
    ["intro", "开头介绍", "用两三句话说明你是谁、准备什么考试、这份记录想帮助谁。"],
    ["start", "我从什么状态开始", "写起点、薄弱项、时间和动机。"],
    ["method", "我怎样使用这个网站", "写具体顺序：先看什么、什么时候练习、什么时候展开完整资料。"],
    ["loop", "我的一次复习闭环", "写一次真实复盘：目标 → 练习 → 错误 → 修正 → 下一步。"],
    ["advice", "对其他学习者的建议", "写 3–5 条可模仿的建议。"],
    ["stage", "我现在的阶段", "写当前进度、仍然困难的内容和下一步。"],
    ["closing", "给后来使用者的一句话", "用一句最像你自己的话结尾。"],
  ];

  return (
    <section className="story-editor" id="write-your-story">
      <header className="story-editor-heading"><div><span>WRITE YOUR OWN STORY</span><h2>把你的备考过程写给后来的人</h2><p>先在这里填写，内容会保存在当前浏览器并即时生成 Markdown。正式发布时，把导出的文件交给我即可。</p></div><div className="story-editor-actions"><button type="button" onClick={saveLocal}>{saved ? "已保存到本机" : "保存草稿"}</button><button type="button" onClick={copyMarkdown}>复制 Markdown</button><button type="button" onClick={downloadMarkdown}>导出 Markdown</button><button className="quiet" type="button" onClick={resetDraft}>恢复模板</button></div></header>
      <div className="story-editor-grid">
        <div className="story-form">{fields.map(([key, label, hint]) => <label key={key}><span>{label}</span><small>{hint}</small>{key === "title" || key === "intro" ? <input value={draft[key]} onChange={(event) => update(key, event.target.value)} /> : <textarea value={draft[key]} onChange={(event) => update(key, event.target.value)} rows={key === "closing" ? 3 : 6} />}</label>)}</div>
        <aside className="story-markdown-preview"><div><span>MARKDOWN PREVIEW</span><strong>发布前预览</strong></div><pre>{markdown}</pre><div className="story-writing-guide"><strong>推荐写法</strong><p>写具体经历，不要只写“认真复习”。最好包括一个真实场景：我当时错了什么、资料中的哪一部分帮我改正、下一次会怎样做。</p></div></aside>
      </div>
    </section>
  );
}
