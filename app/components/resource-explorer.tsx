"use client";

import { useMemo, useState } from "react";
import resources from "@/app/data/resources.json";

const sectionNames: Record<string, string> = {
  grammar: "语言知识",
  listening: "听力整理",
  vocabulary: "词汇",
  "past-paper": "真题",
  "listening-script": "听力原文",
  typst: "Typst",
  review: "考前资料",
};

export function ResourceExplorer() {
  const [query, setQuery] = useState("");
  const [section, setSection] = useState("全部");
  const sections = useMemo(
    () => ["全部", ...Array.from(new Set(resources.map((item) => item.section)))],
    [],
  );
  const filtered = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    return resources.filter((item) => {
      const matchesSection = section === "全部" || item.section === section;
      const matchesQuery = `${item.title} ${item.sourcePath} ${item.problem}`
        .toLowerCase()
        .includes(keyword);
      return matchesSection && (!keyword || matchesQuery);
    });
  }, [query, section]);

  return (
    <section className="resource-explorer">
      <div className="resource-filters">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索文件名、题型或年份" />
        <select value={section} onChange={(event) => setSection(event.target.value)}>
          {sections.map((item) => (
            <option value={item} key={item}>
              {item === "全部" ? item : sectionNames[item] ?? item}
            </option>
          ))}
        </select>
        <span>{filtered.length} 项</span>
      </div>
      <div className="resource-list">
        {filtered.slice(0, 120).map((item) => (
          <article key={`${item.id}-${item.sourcePath}`}>
            <div>
              <span>{sectionNames[item.section] ?? item.section}</span>
              <i>{item.fileType.toUpperCase()}</i>
              {item.year && <i>{item.year}</i>}
            </div>
            <h3>{item.title}</h3>
            <p>{item.sourcePath}</p>
            <small>{item.status === "converted" ? "可在课程中继续学习" : "可作为补充资料查阅"}</small>
          </article>
        ))}
      </div>
      {filtered.length > 120 && <p className="list-note">当前先显示前 120 项；可继续缩小关键词或分类。</p>}
    </section>
  );
}
