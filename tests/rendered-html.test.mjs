import assert from "node:assert/strict";
import test from "node:test";

async function fetchPage(worker, path) {
  return worker.fetch(
    new Request(`http://localhost${path}`, { headers: { accept: "text/html" } }),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) }, },
    { waitUntil() {}, passThroughOnException() {} },
  );
}

test("renders the finished site metadata without starter preview markers", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  const response = await fetchPage(worker, "/");

  assert.equal(response.status, 200);
  assert.match(
    response.headers.get("content-type") ?? "",
    /^text\/html\b/i,
  );
  const html = await response.text();
  assert.match(html, /JLPT N2 Study Atlas/i);
  assert.doesNotMatch(html, /codex-preview/i);
});

test("searches imported study-note text rather than only file metadata", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("search", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await worker.fetch(
    new Request("http://localhost/api/search?q=%E3%81%A8%E3%81%93%E3%82%8D%E3%81%A0%E3%81%A3%E3%81%9F"),
    { ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) } },
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(response.status, 200);
  const { results } = await response.json();
  assert.ok(results.length > 0);
  assert.ok(results.some((item) => item.href === "/n2/listening/problem-4"));
  assert.ok(results.some((item) => item.href === "/n2/language/q7"));
});

test("renders the practice, dashboard, and search workspaces", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("workspaces", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const expectations = [
    ["/n2/practice", /开始 38 题全域基线/u],
    ["/n2/dashboard", /MY STUDY DESK/u],
    ["/n2/review", /REVIEW CENTER/u],
    ["/n2/listening/problem-4", /LEARNING PATH/u],
    ["/n2/listening/problem-4/core-response", /CORE MODEL/u],
    ["/n2/listening/problem-4/practice", /3 秒即时应答/u],
    ["/n2/listening/problem-4/examples", /EXAM PATTERNS/u],
    ["/n2/listening/problem-4/notes", /EXTENDED READING · OPTIONAL/u],
    ["/n2/listening/problem-1-2", /ROUTE SELECTOR/u],
    ["/n2/listening/problem-1", /LEARNING PATH/u],
    ["/n2/listening/problem-1/missed-remedy", /漏做、遗忘与补救动作/u],
    ["/n2/listening/problem-1/practice", /任务链 24 题/u],
    ["/n2/listening/problem-1/examples", /MODEL INDEX/u],
    ["/n2/listening/problem-1/notes", /场景扩展与完整说明/u],
    ["/n2/listening/problem-2", /不是选听到的理由/u],
    ["/n2/listening/problem-2/real-reason", /表面理由与真正理由/u],
    ["/n2/listening/problem-2/practice", /重点链 24 题/u],
    ["/n2/listening/problem-2/examples", /MODEL INDEX/u],
    ["/n2/listening/problem-2/notes", /场景扩展与完整说明/u],
    ["/n2/listening/problem-3", /概要理解/u],
    ["/n2/listening/problem-3/summary-level", /主旨层级与一句话概括/u],
    ["/n2/listening/problem-3/practice", /概要理解 · 混合训练/u],
    ["/n2/listening/problem-5", /統合理解/u],
    ["/n2/listening/problem-5/hard-conditions", /硬条件交集/u],
    ["/n2/language/q1", /漢字読み/u],
    ["/n2/language/q1/on-yomi-length", /音读与长音/u],
    ["/n2/language/q4", /文脈規定/u],
    ["/n2/language/q4/collocation-objects", /搭配对象/u],
    ["/n2/language/q9", /文章の文法/u],
    ["/n2/reading/q10", /一篇只做一件事/u],
    ["/privacy", /先在你的设备上学习/u],
    ["/n2/search", /SEARCH THE ATLAS/u],
  ];
  for (const [path, marker] of expectations) {
    const response = await fetchPage(worker, path);
    assert.equal(response.status, 200, path);
    assert.match(await response.text(), marker, path);
  }
});

test("learner-facing pages do not render repository source paths", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("source-isolation", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const paths = [
    "/n2/listening/problem-4",
    "/n2/listening/problem-4/core-response",
    "/n2/listening/problem-4/practice",
    "/n2/listening/problem-4/examples",
    "/n2/listening/problem-4/notes",
    "/n2/listening/problem-1-2",
    "/n2/listening/problem-1",
    "/n2/listening/problem-1/missed-remedy",
    "/n2/listening/problem-1/notes",
    "/n2/listening/problem-2",
    "/n2/listening/problem-2/real-reason",
    "/n2/listening/problem-2/notes",
    "/n2/listening/problem-3",
    "/n2/listening/problem-5",
    "/n2/language/q3",
    "/n2/reading/q10",
    "/n2/vocabulary",
  ];
  const forbidden = /SOURCES? & VERSION TRACE|SOURCE NOTES|SOURCE TRACE|本单元合并自|原笔记|原始笔记|没有被删成|NOTES → COURSE COVERAGE|SOURCE & MERGE NOTES|RESEARCH VIEW|(?:JLPT_N2|最终Typst|N2_語彙文法)[^<\s]*(?:\.md|\.typ|\.pdf)/iu;
  for (const path of paths) {
    const response = await fetchPage(worker, path);
    assert.equal(response.status, 200, path);
    const html = await response.text();
    const visibleHtml = html
      .replace(/<script\b[^>]*>[\s\S]*?<\/script>/giu, "")
      .replace(/<style\b[^>]*>[\s\S]*?<\/style>/giu, "");
    assert.doesNotMatch(visibleHtml, forbidden, path);
  }
});

test("renders the multi-level vocabulary lab with the requested level", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("vocabulary-page", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const response = await fetchPage(worker, "/n2/vocabulary?level=N5");

  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /11,568/u);
  assert.match(html, /N1–N5/u);
  assert.match(html, /高校/u);
  assert.match(html, /妹は高校に通っています/u);
});

test("queries examples and preserves both sides of the merged N2 catalog", async () => {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("vocabulary-api", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  const environment = {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  };

  const exampleResponse = await worker.fetch(
    new Request("http://localhost/api/vocabulary?level=N5&q=%E5%A6%B9%E5%A6%B9%E5%9C%A8%E4%B8%8A%E9%AB%98%E4%B8%AD&pageSize=6"),
    environment,
    { waitUntil() {}, passThroughOnException() {} },
  );
  assert.equal(exampleResponse.status, 200);
  const exampleResult = await exampleResponse.json();
  assert.equal(exampleResult.filteredTotal, 1);
  assert.equal(exampleResult.entries[0].word, "高校");
  assert.equal(exampleResult.entries[0].examples[0].japanese, "妹は高校に通っています");

  for (const [source, expected] of [["merged", 554], ["legacy", 934]]) {
    const response = await worker.fetch(
      new Request(`http://localhost/api/vocabulary?level=N2&source=${source}&pageSize=6`),
      environment,
      { waitUntil() {}, passThroughOnException() {} },
    );
    assert.equal(response.status, 200, source);
    const result = await response.json();
    assert.equal(result.filteredTotal, expected, source);
  }
});
