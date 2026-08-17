"use client";

import { Fragment, useMemo, useState } from "react";

type ParagraphBlock = { type: "paragraph"; text: string };
type CalloutBlock = { type: "callout"; text: string };
type HeadingBlock = { type: "heading"; level: number; text: string };
type ListBlock = { type: "list"; ordered: boolean; items: string[] };
type TableBlock = { type: "table"; headers: string[]; rows: string[][] };
export type NoteBlock = ParagraphBlock | CalloutBlock | HeadingBlock | ListBlock | TableBlock;

export type CompleteDocument = {
  title: string;
  source: string;
  stats: { sections: number; tables: number; rows: number };
  sections: { id: string; title: string; level: number; blocks: NoteBlock[] }[];
};

// Older imports accidentally serialized Typst/Markdown structure markers as
// literal `text` tokens (and, in a few places, `text id="..."`). Keep this
// cleanup at the rendering boundary as a last line of defence for existing
// and regenerated note data.
export function normalizeImportedText(value: string) {
  return value
    .replace(/(?:^|(?<=\s))text\s+id="[^"]*"\s*/gu, "")
    .replace(/`text(?=\s|$)/gu, "")
    .replace(/(?:^|(?<=\s))text(?=\s|$)/gu, "")
    .replace(/[ \t]{2,}/gu, " ")
    .trim();
}

export function RichText({ text }: { text: string }) {
  const cleanedText = normalizeImportedText(text);
  const pieces = cleanedText.split(/(\{\{ruby:[^|{}]+\|[^{}]+\}\})/gu);
  return (
    <>
      {pieces.map((piece, index) => {
        const match = piece.match(/^\{\{ruby:([^|{}]+)\|([^{}]+)\}\}$/u);
        if (!match) return <Fragment key={`${piece}-${index}`}>{piece}</Fragment>;
        return <ruby key={`${piece}-${index}`}>{match[1]}<rt>{match[2]}</rt></ruby>;
      })}
    </>
  );
}

export function Block({ block }: { block: NoteBlock }) {
  if (block.type === "paragraph") return <p className="complete-paragraph"><RichText text={block.text} /></p>;
  if (block.type === "callout") return <aside className="complete-callout"><RichText text={block.text} /></aside>;
  if (block.type === "heading") {
    const Tag = block.level >= 4 ? "h4" : "h3";
    return <Tag className="complete-subheading"><RichText text={block.text} /></Tag>;
  }
  if (block.type === "list") {
    const Tag = block.ordered ? "ol" : "ul";
    return <Tag className="complete-list">{block.items.map((item, index) => <li key={`${item}-${index}`}><RichText text={item} /></li>)}</Tag>;
  }
  return (
    <div className="complete-table-wrap">
      <table className="complete-table">
        {block.headers.length > 0 && <thead><tr>{block.headers.map((header, index) => <th key={`${header}-${index}`}><RichText text={header} /></th>)}</tr></thead>}
        <tbody>{block.rows.map((row, rowIndex) => <tr key={rowIndex}>{row.map((cell, cellIndex) => <td key={`${rowIndex}-${cellIndex}`}><RichText text={cell} /></td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

function searchableText(document: CompleteDocument) {
  return JSON.stringify(document).replace(/\{\{ruby:([^|{}]+)\|([^{}]+)\}\}/gu, "$1 $2").toLowerCase();
}

export function CompleteNotes({ documents, eyebrow = "EXTENDED LEARNING" }: { documents: CompleteDocument[]; eyebrow?: string }) {
  const [activeDocument, setActiveDocument] = useState(0);
  const [query, setQuery] = useState("");
  const document = documents[activeDocument] ?? documents[0];
  const normalizedQuery = query.trim().toLowerCase();
  const sections = useMemo(() => {
    if (!normalizedQuery) return document.sections;
    return document.sections.filter((section) => searchableText({ ...document, sections: [section] }).includes(normalizedQuery));
  }, [document, normalizedQuery]);

  return (
    <section className="complete-notes" id="complete-notes">
      <div className="complete-notes-heading">
        <div><span>{eyebrow}</span><h2>扩展解释、例句与对照</h2><p>需要继续查清接续、语义差别或典型用法时，可以在这里按主题搜索并逐项展开。</p></div>
        <div className="complete-total"><strong>{document.stats.rows}</strong><span>个例句与对照项</span></div>
      </div>

      {documents.length > 1 && (
        <div className="document-tabs" role="tablist" aria-label="扩展学习主题">
          {documents.map((item, index) => <button className={index === activeDocument ? "active" : ""} key={item.title} onClick={() => { setActiveDocument(index); setQuery(""); }} type="button">{item.title}</button>)}
        </div>
      )}

      <div className="complete-toolbar">
        <div><small>CURRENT DOCUMENT</small><strong><RichText text={document.title} /></strong><a href="/n2/resources">资料与内容说明 →</a></div>
        <label><span>搜索例句、语法或场景</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如：敬语、拟态词、向け、2026…" /></label>
        <div className="complete-stats"><span><b>{document.stats.sections}</b>主题</span><span><b>{document.stats.tables}</b>对照组</span><span><b>{sections.length}</b>命中</span></div>
      </div>

      <nav className="complete-toc" aria-label="完整笔记目录">
        {sections.map((section, index) => <a href={`#complete-${section.id}`} key={`${section.id}-${index}`}><span>{String(index + 1).padStart(2, "0")}</span><RichText text={section.title} /></a>)}
      </nav>

      <div className="complete-sections">
        {sections.map((section, index) => (
          <details className="complete-section" id={`complete-${section.id}`} key={`${section.id}-${index}`} open={normalizedQuery ? true : undefined}>
            <summary><span>{String(index + 1).padStart(2, "0")}</span><h3><RichText text={section.title} /></h3><em>{section.blocks.length} 项学习内容</em><b>＋</b></summary>
            <div className="complete-section-body">{section.blocks.map((block, blockIndex) => <Block block={block} key={`${block.type}-${blockIndex}`} />)}</div>
          </details>
        ))}
        {sections.length === 0 && <div className="complete-empty">没有找到“{query}”。可以尝试词语、题型、年份或语法名称。</div>}
      </div>
    </section>
  );
}
