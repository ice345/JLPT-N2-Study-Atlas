"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import type { LearnerProblemDefinition, LearnerStudyUnitDefinition } from "@/app/data/problem-definition";
import { getStudyStore, type MasteryState, type ReviewState } from "@/app/lib/study-store";

const statusCopy: Record<MasteryState, string> = {
  new: "未开始",
  learning: "学习中",
  review: "待复习",
  mastered: "已掌握",
};

const domainCopy = {
  language: "言語知識",
  reading: "読解",
  listening: "聴解",
} as const;

function stateFor(unit: LearnerStudyUnitDefinition, states: Record<string, ReviewState>) {
  return states[unit.id]?.mastery ?? "new";
}

export function ProblemHub({ definition }: { definition: LearnerProblemDefinition }) {
  const [reviewStates, setReviewStates] = useState<Record<string, ReviewState>>({});
  const [dueCards, setDueCards] = useState(0);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    const store = getStudyStore();
    Promise.all([
      store.getReviewStates({ contentType: "concept", domain: definition.domain }),
      store.getReviewStates({ contentType: "listening", domain: definition.domain }),
    ])
      .then(([unitStates, cardStates]) => {
        if (!active) return;
        setReviewStates(Object.fromEntries(unitStates.map((state) => [state.contentId, state])));
        const now = new Date().toISOString();
        setDueCards(cardStates.filter((state) => state.contentId.startsWith(definition.practice.reviewPrefix) && state.nextReviewAt <= now).length);
      })
      .catch(() => setMessage("当前浏览器没有开放本地学习记录，但课程仍可正常使用。"));
    return () => {
      active = false;
    };
  }, [definition.domain, definition.practice.reviewPrefix]);

  const learned = definition.units.filter((unit) => {
    const state = stateFor(unit, reviewStates);
    return state === "review" || state === "mastered";
  }).length;
  const mastered = definition.units.filter((unit) => stateFor(unit, reviewStates) === "mastered").length;
  const progress = Math.round((learned / definition.units.length) * 100);
  const nextUnit = useMemo(() => {
    return definition.units.find((unit) => stateFor(unit, reviewStates) === "learning")
      ?? definition.units.find((unit) => stateFor(unit, reviewStates) === "new")
      ?? definition.units.find((unit) => stateFor(unit, reviewStates) === "review")
      ?? null;
  }, [definition.units, reviewStates]);
  const basePath = `/n2/${definition.domain}/${definition.slug}`;
  const eyebrow = definition.japanese.includes(definition.title)
    ? definition.japanese
    : `${definition.japanese} · ${definition.title}`;

  return (
    <>
      <section className="problem-hub-hero">
        <div className="problem-hub-mark"><span>{domainCopy[definition.domain]}</span><strong>{definition.number}</strong></div>
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h1>{definition.heroTitle}</h1>
          <p>{definition.description}</p>
          <ol aria-label={`${definition.japanese} 核心策略`}>
            {definition.quickSummary.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}
          </ol>
        </div>
      </section>

      <section className="problem-progress-card" aria-labelledby="problem-progress-title">
        <div className="problem-progress-summary">
          <span>YOUR PROGRESS</span>
          <h2 id="problem-progress-title">{learned} / {definition.units.length} 个单元已学</h2>
          <p>{mastered > 0 ? `${mastered} 个已达到长期掌握；其余会进入复习节奏。` : "完成短课后选择掌握状态，进度会保存在当前设备。"}</p>
          <div className="problem-progress-track" aria-label={`学习进度 ${progress}%`} aria-valuemax={100} aria-valuemin={0} aria-valuenow={progress} role="progressbar"><i style={{ width: `${progress}%` }} /></div>
        </div>
        <div className="problem-continue">
          <strong>{progress}%</strong>
          {nextUnit ? (
            <Link href={`${basePath}/${nextUnit.slug}`}>
              <span>{learned === 0 ? "开始学习" : "继续学习"}</span>
              {nextUnit.number} · {nextUnit.title} →
            </Link>
          ) : (
            <Link href={`${basePath}/practice`}><span>课程已完成</span>进入综合练习 →</Link>
          )}
        </div>
      </section>

      <section className="problem-coverage-map" aria-labelledby="problem-coverage-title">
        <header>
          <div><span>SKILL MAP</span><h2 id="problem-coverage-title">这道题需要掌握哪些判断</h2></div>
          <p>先认识 {definition.coverageGroups.reduce((total, group) => total + group.items.length, 0)} 个关键判断，再按下面的短课路线逐项练习。</p>
        </header>
        <div>
          {definition.coverageGroups.map((group, index) => (
            <article key={group.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><h3>{group.title}</h3><small lang="ja">{group.japanese}</small></div>
              <ul>{group.items.map((item) => <li key={item}>{item}</li>)}</ul>
            </article>
          ))}
        </div>
      </section>

      <section className="problem-learning-path" aria-labelledby="learning-path-title">
        <header><div><span>LEARNING PATH</span><h2 id="learning-path-title">一次完成一个判断任务</h2></div><p>共 {definition.units.length} 个短单元 · 约 {definition.units.reduce((total, unit) => total + unit.estimatedMinutes, 0)} 分钟</p></header>
        <ol>
          {definition.units.map((unit) => {
            const mastery = stateFor(unit, reviewStates);
            return (
              <li key={unit.id}>
                <Link href={`${basePath}/${unit.slug}`}>
                  <span className="problem-unit-number">{unit.number}</span>
                  <span className="problem-unit-name"><strong>{unit.title}</strong><small>{unit.japanese}</small><em>{unit.coverage.join(" · ")}</em></span>
                  <span className="problem-unit-time">{unit.estimatedMinutes} min</span>
                  <span className={`problem-unit-status status-${mastery}`}>{statusCopy[mastery]}</span>
                  <b aria-hidden="true">→</b>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="problem-next-actions" aria-label="练习与复习入口">
        <Link className="problem-action-primary" href={`${basePath}/${definition.practice.slug}`}>
          <span>PRACTICE · {definition.practice.estimatedMinutes} MIN</span>
          <h2>{definition.practice.title}</h2>
          <p>{definition.practice.description}</p>
          <strong>开始 {definition.practice.cardCount} 张训练卡 →</strong>
        </Link>
        <Link href="/n2/review">
          <span>REVIEW</span>
          <h2>{dueCards > 0 ? `${dueCards} 张今天到期` : "复习不会与模糊项"}</h2>
          <p>单元判断与听力卡片都回到同一个复习中心。</p>
          <strong>进入今日复习 →</strong>
        </Link>
        <Link href={`${basePath}/${definition.examples.slug}`}>
          <span>EXAM PATTERNS · {definition.examples.yearRange}</span>
          <h2>{definition.examples.title}</h2>
          <p>{definition.examples.description}</p>
          <strong>查看历年模式 →</strong>
        </Link>
      </section>

      <section className="problem-deep-entry">
        <div><span>EXTENDED READING · OPTIONAL</span><h2>{definition.deepNotes.title}</h2><p>{definition.deepNotes.description}</p></div>
        <Link href={`${basePath}/${definition.deepNotes.slug}`}>进入扩展阅读 →</Link>
      </section>
      {message && <p className="practice-sync-message" role="status">{message}</p>}
    </>
  );
}
