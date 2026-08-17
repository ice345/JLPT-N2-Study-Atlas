"use client";

import { useEffect, useMemo, useState } from "react";
import { listeningTriggers } from "@/app/data/content";
import {
  getStudyStore,
  recordReview,
  type ReviewState,
  type StudyRating,
} from "@/app/lib/study-store";

type DeckMode = "all" | "wrong" | "due" | "random5" | "random10";

const ratingOptions: { rating: StudyRating; label: string }[] = [
  { rating: "again", label: "不会" },
  { rating: "hard", label: "模糊" },
  { rating: "good", label: "会了" },
];

function cardId(index: number) {
  return `p4-card-${String(index + 1).padStart(2, "0")}`;
}

function speak(text: string) {
  if (!("speechSynthesis" in window)) return false;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = "ja-JP";
  utterance.rate = 0.82;
  window.speechSynthesis.speak(utterance);
  return true;
}

function randomIndices(count: number) {
  return listeningTriggers
    .map((_, index) => index)
    .sort(() => Math.random() - 0.5)
    .slice(0, count);
}

export function ListeningLab() {
  const [revealed, setRevealed] = useState<number[]>([]);
  const [group, setGroup] = useState("全部");
  const [mode, setMode] = useState<DeckMode>("all");
  const [batch, setBatch] = useState<number[]>([]);
  const [page, setPage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [reviewStates, setReviewStates] = useState<Record<string, ReviewState>>({});
  const [message, setMessage] = useState("");
  const groups = ["全部", ...Array.from(new Set(listeningTriggers.map((item) => item.group)))];

  useEffect(() => {
    let active = true;
    getStudyStore().getReviewStates({ contentType: "listening" })
      .then((states) => {
        if (active) setReviewStates(Object.fromEntries(states.map((state) => [state.contentId, state])));
      })
      .catch(() => setMessage("当前浏览器没有开放本地学习记录。"));
    return () => {
      active = false;
    };
  }, []);

  const indexedTriggers = useMemo(
    () => listeningTriggers.map((trigger, index) => ({ trigger, index })),
    [],
  );
  const visibleTriggers = indexedTriggers.filter(({ trigger, index }) => {
    if (group !== "全部" && trigger.group !== group) return false;
    const state = reviewStates[cardId(index)];
    if (mode === "wrong") return state?.rating === "again";
    if (mode === "due") return Boolean(state && state.nextReviewAt <= new Date().toISOString());
    if (mode === "random5" || mode === "random10") return batch.includes(index);
    return true;
  });
  const pageSize = mode === "random10" ? 10 : mode === "random5" ? 5 : 6;
  const pageCount = Math.max(1, Math.ceil(visibleTriggers.length / pageSize));
  const safePage = Math.min(page, pageCount);
  const pageTriggers = visibleTriggers.slice((safePage - 1) * pageSize, safePage * pageSize);

  function resetView() {
    setPage(1);
    setPageInput("1");
    setRevealed([]);
  }

  function changeMode(nextMode: DeckMode) {
    setMode(nextMode);
    if (nextMode === "random5") setBatch(randomIndices(5));
    if (nextMode === "random10") setBatch(randomIndices(10));
    resetView();
  }

  function goToPage(value: string) {
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed)) return;
    const next = Math.max(1, Math.min(pageCount, parsed));
    setPage(next);
    setPageInput(String(next));
    setRevealed([]);
  }

  function movePage(next: number) {
    const safe = Math.max(1, Math.min(pageCount, next));
    setPage(safe);
    setPageInput(String(safe));
    setRevealed([]);
  }

  function toggle(index: number) {
    setRevealed((current) => current.includes(index) ? current.filter((item) => item !== index) : [...current, index]);
  }

  async function rate(index: number, rating: StudyRating) {
    const id = cardId(index);
    try {
      const state = await recordReview(
        "listening_drill",
        {
          contentId: id,
          contentType: "listening",
          domain: "listening",
          skill: listeningTriggers[index].tag,
        },
        rating,
        reviewStates[id],
      );
      setReviewStates((current) => ({ ...current, [id]: state }));
      setMessage(`${id} 已标记为“${rating === "good" ? "会了" : rating === "hard" ? "模糊" : "不会"}”。`);
    } catch {
      setMessage("这次判断没有保存成功，请稍后重试。 ");
    }
  }

  return (
    <section id="drill" className="listening-deck-shell">
      <div className="listening-deck-toolbar">
        <div>
          <span>DECK MODE</span>
          <button className={mode === "all" ? "active" : ""} onClick={() => changeMode("all")} type="button">全部</button>
          <button className={mode === "random5" ? "active" : ""} onClick={() => changeMode("random5")} type="button">随机 5</button>
          <button className={mode === "random10" ? "active" : ""} onClick={() => changeMode("random10")} type="button">随机 10</button>
          <button className={mode === "wrong" ? "active" : ""} onClick={() => changeMode("wrong")} type="button">不会</button>
          <button className={mode === "due" ? "active" : ""} onClick={() => changeMode("due")} type="button">今日复习</button>
        </div>
        <p><strong>听音模式：</strong>卡片中的“播放日语”使用浏览器语音合成。TTS 是学习辅助，不是真题录音。</p>
      </div>

      <div className="listening-filters" aria-label="听力训练分类">
        {groups.map((item) => (
          <button
            className={group === item ? "active" : ""}
            key={item}
            onClick={() => { setGroup(item); resetView(); }}
            type="button"
          >
            {item}<span>{item === "全部" ? listeningTriggers.length : listeningTriggers.filter((trigger) => trigger.group === item).length}</span>
          </button>
        ))}
      </div>

      {!pageTriggers.length && (
        <div className="review-empty"><strong>这个筛选下还没有卡片</strong><p>先练全部卡片并选择“不会 / 模糊 / 会了”，错题与今日复习会自动出现。</p></div>
      )}

      <div className="listening-lab">
        {pageTriggers.map(({ trigger: item, index }) => {
          const open = revealed.includes(index);
          const state = reviewStates[cardId(index)];
          return (
            <article className={`response-card ${open ? "is-open" : ""}`} key={cardId(index)}>
              <div className="response-topline">
                <span>{item.tag}</span>
                <b>{String(index + 1).padStart(2, "0")}</b>
              </div>
              <p className="japanese-cue" lang="ja">{item.cue}</p>
              <p className="response-meaning">{item.meaning}</p>
              <div className="response-card-actions">
                <button type="button" onClick={() => toggle(index)} aria-expanded={open}>{open ? "收起回应" : "3 秒后看回应"}</button>
                <button type="button" onClick={() => { if (!speak(item.cue)) setMessage("当前浏览器不支持日语语音合成。"); }}>播放日语</button>
              </div>
              {open && (
                <div className="response-answer">
                  <strong lang="ja">{item.response}</strong>
                  <small>陷阱：{item.trap}</small>
                  <div className="response-rating">
                    <span>这次反应：</span>
                    {ratingOptions.map((option) => (
                      <button className={state?.rating === option.rating ? "active" : ""} key={option.rating} onClick={() => rate(index, option.rating)} type="button">{option.label}</button>
                    ))}
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>

      {visibleTriggers.length > 0 && (
        <div className="listening-pagebar">
          <span>显示 {((safePage - 1) * pageSize) + 1}–{Math.min(safePage * pageSize, visibleTriggers.length)} / {visibleTriggers.length} 张卡</span>
          <div>
            <button type="button" disabled={safePage === 1} onClick={() => movePage(safePage - 1)}>上一组</button>
            <label>跳到第 <input aria-label="跳转到训练卡页" inputMode="numeric" min={1} max={pageCount} onChange={(event) => setPageInput(event.target.value.replace(/[^0-9]/gu, ""))} onBlur={() => goToPage(pageInput)} onKeyDown={(event) => { if (event.key === "Enter") goToPage(pageInput); }} type="number" value={pageInput} /> 页 / {pageCount}</label>
            <button type="button" disabled={safePage === pageCount} onClick={() => movePage(safePage + 1)}>下一组</button>
          </div>
        </div>
      )}
      {message && <p className="practice-sync-message" role="status">{message}</p>}
    </section>
  );
}
