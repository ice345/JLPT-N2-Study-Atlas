"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  getStudyStore,
  recordVocabularyReview,
  type ReviewState,
  type StudyRating,
} from "@/app/lib/study-store";
import {
  vocabularyKanaGroups,
  vocabularyLevels,
  type VocabularyEntry,
  type VocabularyExample,
  type VocabularyLevel,
  type VocabularyMetadata,
  type VocabularyQueryResult,
  type VocabularySourceKind,
} from "@/app/lib/vocabulary-types";

type RecallDirection = "meaning-first" | "japanese-first";
type ExampleFilter = "all" | "with" | "without";
type SourceFilter = "all" | VocabularySourceKind;

const ratingOptions: { value: StudyRating; label: string; hint: string }[] = [
  { value: "again", label: "不会", hint: "10 分钟后再看" },
  { value: "hard", label: "模糊", hint: "明天复习" },
  { value: "good", label: "会了", hint: "逐步拉长间隔" },
];

const ratingLabels: Record<StudyRating, string> = {
  again: "不会",
  hard: "模糊",
  good: "会了",
};

function formatCount(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

function pageWindow(page: number, pageCount: number) {
  const pages = new Set([1, pageCount, page - 1, page, page + 1]);
  return [...pages].filter((value) => value >= 1 && value <= pageCount).sort((a, b) => a - b);
}

export function VocabLab({
  initialLevel,
  initialResult,
  metadata,
}: {
  initialLevel: VocabularyLevel;
  initialResult: VocabularyQueryResult;
  metadata: VocabularyMetadata;
}) {
  const [level, setLevel] = useState<VocabularyLevel>(initialLevel);
  const [queryInput, setQueryInput] = useState("");
  const [query, setQuery] = useState("");
  const [group, setGroup] = useState("全部");
  const [examples, setExamples] = useState<ExampleFilter>("all");
  const [source, setSource] = useState<SourceFilter>("all");
  const [direction, setDirection] = useState<RecallDirection>("meaning-first");
  const [showFurigana, setShowFurigana] = useState(true);
  const [order, setOrder] = useState<"source" | "random">("source");
  const [seed, setSeed] = useState("study-garden");
  const [page, setPage] = useState(1);
  const [result, setResult] = useState(initialResult);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [revealed, setRevealed] = useState<Set<string>>(new Set());
  const [reviewStates, setReviewStates] = useState<Record<string, ReviewState>>({});
  const [sessionRevealed, setSessionRevealed] = useState<Set<string>>(new Set());
  const [sessionReviewed, setSessionReviewed] = useState<Set<string>>(new Set());
  const [saveMessage, setSaveMessage] = useState("");
  const firstRequest = useRef(true);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setQuery(queryInput.trim());
      setPage(1);
      setRevealed(new Set());
    }, 220);
    return () => window.clearTimeout(timer);
  }, [queryInput]);

  useEffect(() => {
    if (firstRequest.current) {
      firstRequest.current = false;
      return;
    }
    const controller = new AbortController();
    const params = new URLSearchParams({
      level,
      q: query,
      group,
      examples,
      source,
      order,
      seed,
      page: String(page),
      pageSize: "18",
    });
    setLoading(true);
    setError("");
    fetch(`/api/vocabulary?${params.toString()}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("词库暂时无法载入，请稍后重试。");
        return response.json() as Promise<VocabularyQueryResult>;
      })
      .then((nextResult) => {
        setResult(nextResult);
        if (nextResult.page !== page) setPage(nextResult.page);
      })
      .catch((requestError: Error) => {
        if (requestError.name !== "AbortError") setError(requestError.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [examples, group, level, order, page, query, seed, source]);

  useEffect(() => {
    let active = true;
    let store;
    try {
      store = getStudyStore();
    } catch {
      queueMicrotask(() => {
        if (active) setSaveMessage("当前浏览器未开放本地学习记录，词库仍可正常使用。");
      });
      return;
    }
    store
      .getReviewStates(level)
      .then((states) => {
        if (!active) return;
        setReviewStates(Object.fromEntries(states.map((state) => [state.contentId, state])));
      })
      .catch(() => {
        if (active) setSaveMessage("当前浏览器未开放本地学习记录，词库仍可正常使用。");
      });
    return () => {
      active = false;
    };
  }, [level]);

  useEffect(() => {
    if (!saveMessage) return;
    const timer = window.setTimeout(() => setSaveMessage(""), 4200);
    return () => window.clearTimeout(timer);
  }, [saveMessage]);

  const levelMetadata = metadata.levels[level];
  const visiblePages = useMemo(
    () => pageWindow(result.page, result.pageCount),
    [result.page, result.pageCount],
  );
  const reviewedInLevel = Object.keys(reviewStates).length;

  function resetCards() {
    setPage(1);
    setRevealed(new Set());
  }

  function changeLevel(nextLevel: VocabularyLevel) {
    if (nextLevel === level) return;
    setLevel(nextLevel);
    setQueryInput("");
    setQuery("");
    setGroup("全部");
    setExamples("all");
    setSource("all");
    setOrder("source");
    setSeed("study-garden");
    setReviewStates({});
    resetCards();
    const nextUrl = new URL(window.location.href);
    nextUrl.searchParams.set("level", nextLevel);
    window.history.replaceState({}, "", nextUrl);
  }

  function toggle(entry: VocabularyEntry) {
    setRevealed((current) => {
      const next = new Set(current);
      if (next.has(entry.id)) next.delete(entry.id);
      else next.add(entry.id);
      return next;
    });
    setSessionRevealed((current) => new Set(current).add(entry.id));
  }

  async function rate(entry: VocabularyEntry, rating: StudyRating) {
    try {
      const state = await recordVocabularyReview(
        entry.id,
        entry.level,
        rating,
        reviewStates[entry.id],
        entry.word,
      );
      setReviewStates((current) => ({ ...current, [entry.id]: state }));
      setSessionReviewed((current) => new Set(current).add(entry.id));
      setSaveMessage(`“${entry.word}”已标记为${ratingLabels[rating]}，记录保存在当前设备。`);
    } catch (reviewError) {
      setSaveMessage(
        reviewError instanceof Error ? reviewError.message : "本地学习记录写入失败。",
      );
    }
  }

  function startRandomBatch() {
    const nextSeed = globalThis.crypto?.randomUUID?.() ?? String(Date.now());
    setOrder("random");
    setSeed(nextSeed);
    resetCards();
  }

  return (
    <section className="vocab-shell" aria-labelledby="vocab-lab-title">
      <div className="vocab-levels" aria-label="JLPT 词汇等级">
        {vocabularyLevels.map((item) => {
          const itemMetadata = metadata.levels[item];
          return (
            <button
              aria-pressed={level === item}
              className={level === item ? "is-active" : ""}
              key={item}
              onClick={() => changeLevel(item)}
              type="button"
            >
              <span>{item}</span>
              <strong>{formatCount(itemMetadata.total)}</strong>
              <small>{formatCount(itemMetadata.exampleEntries)} 条含例句</small>
            </button>
          );
        })}
      </div>

      <header className="vocab-lab-heading">
        <div>
          <span id="vocab-lab-title">{level} · ACTIVE RECALL</span>
          <h2>不是浏览词表，<br />而是先回忆，再确认。</h2>
          <p>点开答案后，用“不会 / 模糊 / 会了”记录这一次回忆。无需登录，记录会保存在当前设备。</p>
        </div>
        <div className="vocab-session-panel">
          <div>
            <span>本次已翻开</span>
            <strong>{sessionRevealed.size}</strong>
          </div>
          <div>
            <span>本次已判断</span>
            <strong>{sessionReviewed.size}</strong>
          </div>
          <div>
            <span>{level} 已留记录</span>
            <strong>{reviewedInLevel}</strong>
          </div>
        </div>
      </header>

      {level === "N2" && (
        <section className="vocab-merge-note" aria-label="N2 今日学习建议">
          <div>
            <span>N2 TODAY</span>
            <strong>{formatCount(levelMetadata.total)}</strong>
            <small>个可练习词条</small>
          </div>
          <p>
            第一次可以先随机抽 18 词：看到中文说出日语，再切换方向从日语回忆中文。每张卡都朗读例句，并在最后选择“不会 / 模糊 / 会了”。
          </p>
        </section>
      )}

      <div className="vocab-modebar">
        <div className="vocab-direction" aria-label="回忆方向">
          <span>回忆方向</span>
          <button
            aria-pressed={direction === "meaning-first"}
            className={direction === "meaning-first" ? "active" : ""}
            onClick={() => {
              setDirection("meaning-first");
              setRevealed(new Set());
            }}
            type="button"
          >
            中文 → 日语
          </button>
          <button
            aria-pressed={direction === "japanese-first"}
            className={direction === "japanese-first" ? "active" : ""}
            onClick={() => {
              setDirection("japanese-first");
              setRevealed(new Set());
            }}
            type="button"
          >
            日语 → 中文
          </button>
        </div>
        <button className="vocab-random-button" onClick={startRandomBatch} type="button">
          <span>↝</span>
          {order === "random" ? "换一组随机词" : "随机 18 词"}
        </button>
        <button
          aria-pressed={showFurigana}
          className={`vocab-furigana-toggle ${showFurigana ? "active" : ""}`}
          onClick={() => setShowFurigana((value) => !value)}
          type="button"
        >
          例句读音 {showFurigana ? "ON" : "OFF"}
        </button>
        {order === "random" && (
          <button
            className="vocab-order-reset"
            onClick={() => {
              setOrder("source");
              setSeed("study-garden");
              resetCards();
            }}
            type="button"
          >
            恢复词表顺序
          </button>
        )}
      </div>

      <div className="vocab-toolbar">
        <label className="vocab-search-field">
          <span>搜索单词、读音、词义或例句</span>
          <input
            onChange={(event) => setQueryInput(event.target.value)}
            placeholder="例：愛情 / あいじょう / 热爱 / 彼を愛する"
            type="search"
            value={queryInput}
          />
        </label>
        <label>
          <span>例句</span>
          <select
            onChange={(event) => {
              setExamples(event.target.value as ExampleFilter);
              resetCards();
            }}
            value={examples}
          >
            <option value="all">全部词条</option>
            <option value="with">只看有例句</option>
            <option value="without">暂缺例句</option>
          </select>
        </label>
        <div className="result-badge" aria-live="polite">
          <strong>{formatCount(result.filteredTotal)}</strong>
          <span>个符合条件</span>
        </div>
      </div>

      <div className="vocab-kana-filter" aria-label="按假名行筛选">
        {vocabularyKanaGroups.map((item) => (
          <button
            className={group === item ? "active" : ""}
            disabled={(result.groupCounts[item] ?? 0) === 0}
            key={item}
            onClick={() => {
              setGroup(item);
              resetCards();
            }}
            type="button"
          >
            {item}
            <span>{formatCount(result.groupCounts[item] ?? 0)}</span>
          </button>
        ))}
      </div>

      {error && (
        <div className="vocab-empty" role="alert">
          <strong>没有载入成功</strong>
          <p>{error}</p>
        </div>
      )}

      {!error && result.entries.length === 0 && !loading && (
        <div className="vocab-empty">
          <strong>没有找到对应词条</strong>
          <p>试试缩短关键词，或切回“全部词条 / 全部假名”。</p>
        </div>
      )}

      <div className={`vocab-grid ${loading ? "is-loading" : ""}`} aria-busy={loading}>
        {result.entries.map((entry) => (
          <VocabularyCard
            direction={direction}
            entry={entry}
            key={entry.id}
            onRate={rate}
            onToggle={toggle}
            open={revealed.has(entry.id)}
            reviewState={reviewStates[entry.id]}
            showFurigana={showFurigana}
          />
        ))}
      </div>

      {result.filteredTotal > 0 && (
        <nav className="vocab-pagination" aria-label="词库分页">
          <p>
            第 {formatCount((result.page - 1) * result.pageSize + 1)}–
            {formatCount(Math.min(result.page * result.pageSize, result.filteredTotal))} 条，共 {formatCount(result.filteredTotal)} 条
          </p>
          <div>
            <button
              disabled={result.page === 1 || loading}
              onClick={() => {
                setPage((value) => Math.max(1, value - 1));
                setRevealed(new Set());
              }}
              type="button"
            >
              上一页
            </button>
            {visiblePages.map((item, index) => {
              const previous = visiblePages[index - 1];
              return (
                <span className="vocab-page-item" key={item}>
                  {previous && item - previous > 1 && <i>…</i>}
                  <button
                    aria-current={item === result.page ? "page" : undefined}
                    className={item === result.page ? "active" : ""}
                    disabled={loading}
                    onClick={() => {
                      setPage(item);
                      setRevealed(new Set());
                    }}
                    type="button"
                  >
                    {item}
                  </button>
                </span>
              );
            })}
            <button
              disabled={result.page === result.pageCount || loading}
              onClick={() => {
                setPage((value) => Math.min(result.pageCount, value + 1));
                setRevealed(new Set());
              }}
              type="button"
            >
              下一页
            </button>
          </div>
        </nav>
      )}

      {saveMessage && (
        <p className="vocab-save-message" role="status">
          {saveMessage}
        </p>
      )}
    </section>
  );
}

function VocabularyCard({
  entry,
  direction,
  open,
  reviewState,
  onToggle,
  onRate,
  showFurigana,
}: {
  entry: VocabularyEntry;
  direction: RecallDirection;
  open: boolean;
  reviewState?: ReviewState;
  onToggle: (entry: VocabularyEntry) => void;
  onRate: (entry: VocabularyEntry, rating: StudyRating) => void;
  showFurigana: boolean;
}) {
  const meaningFirst = direction === "meaning-first";
  const additionalExamples = entry.examples.slice(1);

  return (
    <article className={`vocab-card ${open ? "is-open" : ""}`}>
      <header>
        <div>
          <span>{entry.level}</span>
          <span>{entry.kanaGroup}</span>
          {entry.category && <span>{entry.category}</span>}
        </div>
        {reviewState ? (
          <em className={`rating-${reviewState.rating}`}>{ratingLabels[reviewState.rating]}</em>
        ) : (
          <em>未学习</em>
        )}
      </header>

      <div className={`vocab-prompt ${meaningFirst ? "meaning-first" : "japanese-first"}`}>
        <small>{meaningFirst ? "中文提示" : "日语提示"}</small>
        {meaningFirst ? (
          <h3>{entry.meaning}</h3>
        ) : (
          <div className="vocab-japanese-prompt">
            <h3 lang="ja">{entry.word}</h3>
            <p lang="ja">{entry.reading}</p>
          </div>
        )}
      </div>

      <button
        aria-expanded={open}
        className="vocab-mask"
        onClick={() => onToggle(entry)}
        type="button"
      >
        {open ? (
          meaningFirst ? (
            <span className="vocab-answer-japanese">
              <b lang="ja">{entry.word}</b>
              <em lang="ja">{entry.reading}</em>
              {entry.pitch && <small>声调 {entry.pitch}</small>}
            </span>
          ) : (
            <span className="vocab-answer-meaning">{entry.meaning}</span>
          )
        ) : (
          <span className="vocab-mask-label">
            <i aria-hidden="true" />
            {meaningFirst ? "点击显示日语" : "点击显示词义"}
          </span>
        )}
      </button>

      {open && (
        <div className="vocab-reveal">
          <section className="vocab-examples">
            <span>IN CONTEXT · 例句</span>
            {entry.examples.length ? (
              <>
                <div>
                  <strong lang="ja">
                    <FuriganaText example={entry.examples[0]} show={showFurigana} />
                  </strong>
                  {entry.examples[0].chinese && <p>{entry.examples[0].chinese}</p>}
                  <ExampleSource example={entry.examples[0]} />
                </div>
                {additionalExamples.length > 0 && (
                  <details>
                    <summary>再看 {additionalExamples.length} 个例句</summary>
                    {additionalExamples.map((example, index) => (
                      <div key={`${example.japanese}-${index}`}>
                        <strong lang="ja">
                          <FuriganaText example={example} show={showFurigana} />
                        </strong>
                        {example.chinese && <p>{example.chinese}</p>}
                        <ExampleSource example={example} />
                      </div>
                    ))}
                  </details>
                )}
              </>
            ) : (
              <p className="vocab-no-example">当前来源未提供例句，词条仍保留供回忆。</p>
            )}
          </section>

          <div className="vocab-rating">
            <span>这次回忆得怎样？</span>
            <div>
              {ratingOptions.map((option) => (
                <button
                  className={reviewState?.rating === option.value ? "active" : ""}
                  key={option.value}
                  onClick={() => onRate(entry, option.value)}
                  title={option.hint}
                  type="button"
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      <footer>
        <span>{entry.level} · {entry.category ?? entry.kanaGroup}</span>
        <small>{entry.reading}</small>
      </footer>
    </article>
  );
}

function FuriganaText({ example, show }: { example: VocabularyExample; show: boolean }) {
  if (!show || !example.furigana?.length) return example.japanese;
  return example.furigana.map((segment, index) =>
    segment.reading ? (
      <ruby key={`${segment.text}-${index}`}>
        {segment.text}
        <rt>{segment.reading}</rt>
      </ruby>
    ) : (
      <span key={`${segment.text}-${index}`}>{segment.text}</span>
    ),
  );
}

function ExampleSource({ example }: { example: VocabularyExample }) {
  if (example.source !== "supplement") return null;
  return <small className="vocab-example-source">学习补充例句</small>;
}
