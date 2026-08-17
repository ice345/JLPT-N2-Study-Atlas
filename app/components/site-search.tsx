"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { SearchResult } from "@/app/lib/search";

export function SiteSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`, { signal: controller.signal });
        const data = await response.json() as { results: SearchResult[] };
        setResults(data.results);
      } finally { setLoading(false); }
    }, query ? 160 : 0);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [query]);

  return <section className="site-search"><header><span>SEARCH THE ATLAS</span><h1>想找的题型、语法或句子，直接搜。</h1><p>检索最终笔记正文、练习题、例句与能力标签；资料索引仍只负责查找原文件。</p></header><label><span>站内检索</span><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="例如：にともなって / ところだった / 条件" /></label><p className="search-count">{loading ? "正在检索…" : query ? `找到 ${results.length} 条正文或练习结果` : "可搜索最终笔记正文与练习题"}</p><div className="search-results">{results.map((item) => <Link href={item.href} key={item.id}><span>{item.kind}</span><h2>{item.title}</h2><p>{item.excerpt}</p><b>打开 →</b></Link>)}</div>{!loading && query && results.length === 0 && <p className="search-empty">没有命中。可以尝试词干、日文原形、题型或中文解释。</p>}</section>;
}
