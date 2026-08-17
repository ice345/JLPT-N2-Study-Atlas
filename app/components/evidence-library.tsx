"use client";

import { useMemo, useState } from "react";

export type EvidenceItem = {
  id: string;
  year: string;
  type: string;
  function: string;
  keyword: string;
  values: string[];
  headers: string[];
};

export function EvidenceLibrary({ items }: { items: EvidenceItem[] }) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState("全部");
  const [type, setType] = useState("全部");
  const [visible, setVisible] = useState(18);
  const years = ["全部", ...Array.from(new Set(items.map((item) => item.year))).sort()];
  const types = ["全部", ...Array.from(new Set(items.map((item) => item.type))).slice(0, 30)];
  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase();
    return items.filter((item) => {
      if (year !== "全部" && item.year !== year) return false;
      if (type !== "全部" && item.type !== type) return false;
      if (!normalizedQuery) return true;
      return [item.keyword, item.function, ...item.values]
        .join(" ")
        .toLocaleLowerCase()
        .includes(normalizedQuery);
    });
  }, [items, query, type, year]);

  function resetVisible() {
    setVisible(18);
  }

  return (
    <section className="evidence-library" id="evidence-library">
      <header>
        <div><span>PATTERN LIBRARY</span><h2>历年场景与判断练习</h2><p>按年份、题型或关键词查找相近场景，比较同一信号在不同语境中的答案方向。</p></div>
        <strong>{filtered.length}<small> / {items.length}</small></strong>
      </header>
      <div className="evidence-toolbar">
        <label><span>Search</span><input type="search" value={query} onChange={(event) => { setQuery(event.target.value); resetVisible(); }} placeholder="ところだった / 敬语 / 2021…" /></label>
        <label><span>年份</span><select value={year} onChange={(event) => { setYear(event.target.value); resetVisible(); }}>{years.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label><span>类型</span><select value={type} onChange={(event) => { setType(event.target.value); resetVisible(); }}>{types.map((item) => <option key={item}>{item}</option>)}</select></label>
      </div>
      <div className="evidence-list">
        {filtered.slice(0, visible).map((item) => (
          <details key={item.id}>
            <summary>
              <span>{item.year}</span>
              <div><strong lang="ja">{item.keyword}</strong><small>{item.function}</small></div>
              <em>{item.type}</em>
            </summary>
            <dl>
              {item.values.map((value, index) => <div key={`${item.id}-${index}`}><dt>{item.headers[index] ?? `Field ${index + 1}`}</dt><dd>{value}</dd></div>)}
            </dl>
          </details>
        ))}
      </div>
      {!filtered.length && <div className="review-empty"><strong>没有匹配的证据条目</strong><p>试试缩短关键词，或切回“全部”筛选。</p></div>}
      {visible < filtered.length && <button className="evidence-more" type="button" onClick={() => setVisible((value) => value + 24)}>再显示 24 条</button>}
    </section>
  );
}
