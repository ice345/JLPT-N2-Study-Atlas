"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  getStudyStore,
  recordReview,
  type ReviewState,
  type StudyEvent,
  type StudyRating,
} from "@/app/lib/study-store";
import { syncStudyStore } from "@/app/lib/study-sync";
import { languageProblemDefinitions } from "@/app/data/language-course";
import { problemFourDefinition } from "@/app/data/problem-four-course";
import { problemOneTwoDefinitions } from "@/app/data/problem-one-two-course";
import { problemThreeFiveDefinitions } from "@/app/data/listening-three-five-course";
import { readingModules } from "@/app/data/reading-content";
import { practiceQuestions } from "@/app/data/practice";

const courseDefinitions = [
  ...languageProblemDefinitions,
  ...problemOneTwoDefinitions,
  ...problemThreeFiveDefinitions,
  problemFourDefinition,
];

function learningContent(state: ReviewState) {
  const unitMatch = courseDefinitions.flatMap((definition) => definition.units.map((unit) => ({ definition, unit }))).find(({ unit }) => unit.id === state.contentId);
  if (unitMatch) {
    const root = unitMatch.definition.domain === "language" ? "/n2/language" : "/n2/listening";
    return {
      title: unitMatch.unit.title,
      prompt: unitMatch.unit.objective,
      answer: unitMatch.unit.summary,
      href: `${root}/${unitMatch.definition.slug}/${unitMatch.unit.slug}`,
    };
  }
  const readingSlug = state.contentId.replace(/^reading-/u, "");
  const reading = readingModules.find((module) => module.slug === readingSlug);
  if (reading) return { title: `問題${reading.number} · ${reading.japanese}`, prompt: reading.lead, answer: reading.flow.slice(0, 3), href: `/n2/reading/${reading.slug}` };
  if (state.contentType === "vocabulary") {
    const word = state.skill?.split(":").slice(2).join(":");
    return {
      title: word || `${state.level ?? "N2"} 词汇卡`,
      prompt: "先说出读音、中文义，再试着造一个短句。",
      answer: ["核对读音与词义", "朗读例句并观察搭配", "根据实际掌握度评分"],
      href: `/n2/vocabulary?level=${state.level ?? "N2"}`,
    };
  }
  return {
    title: state.skill ?? "听力即时应答",
    prompt: "先回忆这个信号出现时，答案方向应该怎样变化。",
    answer: ["确认说话人的真实意图", "检查时态、范围与否定", "再决定回应方向"],
    href: state.domain === "listening" ? "/n2/listening/problem-4#drill" : "/n2/language",
  };
}

function reviewLink(state: ReviewState) {
  return learningContent(state).href;
}

function eventLink(event: StudyEvent) {
  const question = practiceQuestions.find((item) => item.id === event.contentId);
  if (!question) {
    if (event.domain === "reading") return "/n2/reading";
    if (event.domain === "listening") return "/n2/listening";
    return "/n2/language";
  }
  if (question.area === "reading") return `/n2/reading/${question.problem}`;
  const unitSlug = question.relatedContentIds[1];
  const root = question.area === "listening" ? "/n2/listening" : "/n2/language";
  return unitSlug ? `${root}/${question.problem}/${unitSlug}` : `${root}/${question.problem}`;
}

function wrongLabel(event: StudyEvent) {
  const question = practiceQuestions.find((item) => item.id === event.contentId);
  return {
    title: event.skill ?? question?.skill ?? "综合判断",
    detail: question?.title ?? (event.domain === "reading" ? "阅读" : event.domain === "listening" ? "听力" : "语言知识"),
  };
}

export function ReviewCenter({ signedIn }: { signedIn: boolean }) {
  const [states, setStates] = useState<ReviewState[]>([]);
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [message, setMessage] = useState("");
  const [revealed, setRevealed] = useState(false);
  const [rating, setRating] = useState<StudyRating | null>(null);

  const load = useCallback(async () => {
    const store = getStudyStore();
    const [nextStates, nextEvents] = await Promise.all([
      store.getReviewStates(),
      store.getEvents({ type: ["practice_answer", "diagnostic_answer"] }),
    ]);
    setStates(nextStates);
    setEvents(nextEvents);
  }, []);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      load().catch(() => setMessage("无法读取此设备上的复习记录。"));
      if (signedIn) {
        syncStudyStore()
          .then(() => active ? load() : undefined)
          .catch((reason: Error) => active && setMessage(reason.message));
      }
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [load, signedIn]);

  const due = useMemo(
    () => states.filter((state) => state.nextReviewAt <= new Date().toISOString()),
    [states],
  );
  const latestAnswers = useMemo(() => {
    const latest = new Map<string, StudyEvent>();
    for (const event of events) {
      if (!latest.has(event.contentId)) latest.set(event.contentId, event);
    }
    return [...latest.values()];
  }, [events]);
  const wrong = latestAnswers.filter((event) => event.correct === false);
  const counts = {
    vocabulary: due.filter((state) => state.contentType === "vocabulary").length,
    listening: due.filter((state) => state.contentType === "listening").length,
    concept: due.filter((state) => state.contentType === "concept" || state.contentType === "problem").length,
    wrong: wrong.length,
  };
  const currentReview = due[0];
  const currentContent = currentReview ? learningContent(currentReview) : null;

  async function rateCurrent(nextRating: StudyRating) {
    if (!currentReview) return;
    try {
      setRating(nextRating);
      const eventType = currentReview.contentType === "vocabulary" ? "vocab_review"
        : currentReview.contentType === "listening" ? "listening_drill" : "concept_review";
      const next = await recordReview(eventType, {
        contentId: currentReview.contentId,
        contentType: currentReview.contentType,
        domain: currentReview.domain,
        level: currentReview.level,
        skill: currentReview.skill,
      }, nextRating, currentReview);
      setStates((current) => current.map((state) => state.contentId === next.contentId ? next : state));
      setRevealed(false);
      setRating(null);
      setMessage(nextRating === "good" ? "已完成一项，继续下一项。" : "已重新安排复习时间，继续下一项。 ");
    } catch {
      setRating(null);
      setMessage("这次复习判断没有保存成功，请重试。 ");
    }
  }

  return (
    <section className="review-center">
      <header className="review-heading">
        <div>
          <span>REVIEW CENTER · ONE QUEUE</span>
          <h1>今天该复习的内容，<br />不再散落在四个页面。</h1>
          <p>词汇、听力卡片、能力单元和最近错题统一从本机学习记录生成。没有登录也可以继续。</p>
        </div>
        <div className="review-total">
          <span>TODAY REVIEW</span>
          <strong>{due.length + wrong.length}</strong>
          <small>到期项目 + 当前错题</small>
        </div>
      </header>

      <div className="review-source-grid">
        <article><span>词汇</span><strong>{counts.vocabulary}</strong><Link href="/n2/vocabulary">进入词库 →</Link></article>
        <article><span>听力卡片</span><strong>{counts.listening}</strong><Link href="/n2/listening">进入听力 →</Link></article>
        <article><span>能力单元</span><strong>{counts.concept}</strong><Link href="/n2">回到学习地图 →</Link></article>
        <article><span>当前错题</span><strong>{counts.wrong}</strong><Link href="/n2/practice">错题优先练习 →</Link></article>
      </div>

      {currentReview && currentContent ? (
        <section className="direct-review" aria-labelledby="direct-review-title">
          <header><div><span>MIXED REVIEW · {due.length} LEFT</span><h2 id="direct-review-title">就在这里完成今日第一项</h2></div><Link href={currentContent.href}>打开完整内容 ↗</Link></header>
          <div className="direct-review-card">
            <small>{currentReview.contentType} · {currentReview.domain}</small>
            <h3>{currentContent.title}</h3>
            <p>{currentContent.prompt}</p>
            {!revealed ? <button type="button" onClick={() => setRevealed(true)}>想好后，核对判断 →</button> : <div className="direct-review-answer"><span>核对重点</span><ul>{currentContent.answer.map((item) => <li key={item}>{item}</li>)}</ul><div>{([ ["again", "不会"], ["hard", "模糊"], ["good", "会了"] ] as [StudyRating, string][]).map(([value, label]) => <button disabled={rating !== null} key={value} type="button" onClick={() => rateCurrent(value)}>{rating === value ? "保存中…" : label}</button>)}</div></div>}
          </div>
        </section>
      ) : (
        <section className="direct-review direct-review-complete"><span>TODAY COMPLETE</span><h2>今天的到期复习已经完成。</h2><p>现在做一轮混合练习，让刚复习的内容重新进入题目语境。</p><Link href="/n2/practice">开始第二轮练习 →</Link></section>
      )}

      <div className="review-columns">
        <section>
          <div className="section-heading"><div><span>DUE BY SCHEDULE</span><h2>到期复习</h2></div><strong>{due.length}</strong></div>
          {due.length ? (
            <ol className="review-list">
              {due.slice(0, 30).map((state) => (
                <li key={state.contentId}>
                  <div>
                    <span>{state.contentType}</span>
                    <strong>{learningContent(state).title}</strong>
                    <small>{state.rating === "again" ? "上次：不会" : state.rating === "hard" ? "上次：模糊" : "上次：会了"}</small>
                  </div>
                  <Link href={reviewLink(state)}>复习 →</Link>
                </li>
              ))}
            </ol>
          ) : (
            <div className="review-empty"><strong>暂时没有到期项目</strong><p>完成主动回忆并选择“不会 / 模糊 / 会了”后，复习间隔会自动排入这里。</p></div>
          )}
        </section>

        <section>
          <div className="section-heading"><div><span>WRONG → LEARN</span><h2>最近错题</h2></div><strong>{wrong.length}</strong></div>
          {wrong.length ? (
            <ol className="review-list">
              {wrong.slice(0, 20).map((event) => (
                <li key={event.contentId}>
                  <div>
                    <span>{event.domain}</span>
                    <strong>{wrongLabel(event).title}</strong>
                    <small>{wrongLabel(event).detail}</small>
                  </div>
                  <Link href={eventLink(event)}>相关知识 →</Link>
                </li>
              ))}
            </ol>
          ) : (
            <div className="review-empty"><strong>当前没有待处理错题</strong><p>提交练习后，最新一次仍答错的题会出现在这里；答对后会自动移出。</p></div>
          )}
        </section>
      </div>
      {message && <p className="practice-sync-message" role="status">{message}</p>}
    </section>
  );
}
