"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { JapaneseReading } from "@/app/components/japanese-reading";
import type { LearnerProblemDefinition, LearnerStudyUnitDefinition } from "@/app/data/problem-definition";
import {
  getStudyStore,
  recordReview,
  recordStudyEvent,
  type ReviewState,
  type StudyRating,
} from "@/app/lib/study-store";

const ratings: { rating: StudyRating; label: string; hint: string }[] = [
  { rating: "again", label: "不会", hint: "10 分钟后再看" },
  { rating: "hard", label: "模糊", hint: "进入明日复习" },
  { rating: "good", label: "会了", hint: "完成本单元并拉长复习间隔" },
];

export function StudyUnitPage({ definition, unit }: { definition: LearnerProblemDefinition; unit: LearnerStudyUnitDefinition }) {
  const isListening = definition.domain === "listening";
  const [reviewState, setReviewState] = useState<ReviewState>();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const started = useRef(false);
  const unitIndex = definition.units.findIndex((item) => item.id === unit.id);
  const previous = definition.units[unitIndex - 1];
  const next = definition.units[unitIndex + 1];
  const basePath = `/n2/${definition.domain}/${definition.slug}`;

  useEffect(() => {
    let active = true;
    getStudyStore().getReviewState(unit.id)
      .then((state) => {
        if (active) setReviewState(state);
      })
      .catch(() => setMessage("当前浏览器没有开放本地学习记录，但课程仍可正常使用。"));
    if (!started.current) {
      started.current = true;
      recordStudyEvent({
        type: "lesson_started",
        contentType: "concept",
        contentId: unit.id,
        domain: definition.domain,
        skill: `${definition.japanese}・${unit.title}`,
      }).catch(() => undefined);
    }
    return () => {
      active = false;
    };
  }, [definition.domain, definition.japanese, unit.id, unit.title]);

  function answerDrill(drillId: string, choice: number, correctAnswer: number) {
    if (answers[drillId] !== undefined) return;
    setAnswers((current) => ({ ...current, [drillId]: choice }));
    recordStudyEvent({
      type: "practice_answer",
      contentType: definition.domain === "listening" ? "listening" : definition.domain === "reading" ? "reading" : "problem",
      contentId: `${definition.id}-${drillId}`,
      domain: definition.domain,
      skill: unit.title,
      correct: choice === correctAnswer,
    }).catch(() => setMessage("答案已显示，但这次训练记录没有保存成功。"));
  }

  async function rateUnit(rating: StudyRating) {
    try {
      const state = await recordReview(
        "concept_review",
        {
          contentId: unit.id,
          contentType: "concept",
          domain: definition.domain,
          skill: unit.title,
        },
        rating,
        reviewState,
      );
      setReviewState(state);
      if (rating === "good") {
        await recordStudyEvent({
          type: "lesson_completed",
          contentType: "concept",
          contentId: unit.id,
          domain: definition.domain,
          skill: unit.title,
        });
      }
      setMessage(rating === "good" ? "本单元已完成。下一步可以继续学习或进入练习。" : `已标记为“${rating === "hard" ? "模糊" : "不会"}”，系统会安排再次复习。`);
    } catch {
      setMessage("掌握状态没有保存成功，请稍后重试。 ");
    }
  }

  return (
    <article className="study-unit-page">
      <header className="study-unit-hero">
        <div className="study-unit-position">
          <span>{unit.number} / {String(definition.units.length).padStart(2, "0")}</span>
          <strong>{unit.estimatedMinutes}</strong>
          <small>MIN</small>
        </div>
        <div>
          <p className="eyebrow">{definition.japanese} · STUDY UNIT</p>
          <h1>{unit.title}</h1>
          <p lang="ja" className="study-unit-japanese">{unit.japanese}</p>
          <p>{unit.objective}</p>
        </div>
        <div className={`study-unit-current status-${reviewState?.mastery ?? "new"}`}>
          <span>CURRENT STATUS</span>
          <strong>{reviewState?.mastery === "mastered" ? "已掌握" : reviewState?.mastery === "review" ? "待复习" : reviewState?.mastery === "learning" ? "学习中" : "未开始"}</strong>
        </div>
      </header>

      <section className="study-unit-summary" aria-labelledby="unit-summary-title">
        <div><span>30</span><strong id="unit-summary-title">秒掌握</strong></div>
        <ol>{unit.summary.map((rule) => <li key={rule}>{rule}</li>)}</ol>
      </section>

      <section className="study-unit-coverage" aria-labelledby="unit-coverage-title">
        <div>
          <span>LEARNING FOCUS</span>
          <h2 id="unit-coverage-title">学完后，你能判断这些内容</h2>
          <p>{unit.noteInsight}</p>
        </div>
        <ul>{unit.coverage.map((item) => <li key={item}>{item}</li>)}</ul>
      </section>

      <section className="study-unit-section" aria-labelledby="unit-model-title">
        <header><span>CORE MODEL</span><h2 id="unit-model-title">{isListening ? "听到信号以后，沿这条线判断" : "看到题干线索后，沿这条线判断"}</h2></header>
        <div className="study-concept-list">
          {unit.concepts.map((concept, index) => (
            <article key={concept.cue}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div className="study-concept-cue">
                <strong lang="ja"><JapaneseReading text={concept.cue} /></strong>
                <small>{concept.signal}</small>
                {concept.variants?.length ? <ul>{concept.variants.map((variant) => <li key={variant} lang="ja"><JapaneseReading text={variant} /></li>)}</ul> : null}
              </div>
              <p>{concept.direction}</p>
              {concept.example && <blockquote lang="ja">→ <JapaneseReading text={concept.example} />{concept.exampleMeaning && <small>{concept.exampleMeaning}</small>}</blockquote>}
              {concept.wrong && <aside>Trap · {concept.wrong}</aside>}
            </article>
          ))}
        </div>
      </section>

      <section className="study-unit-section study-unit-traps" aria-labelledby="unit-traps-title">
        <header><span>TRAP CONTRAST</span><h2 id="unit-traps-title">先排除方向相反的理解</h2></header>
        <div>{unit.traps.map((trap) => <article key={trap.title}><strong>× {trap.title}</strong><p>○ {trap.contrast}</p></article>)}</div>
      </section>

      <section className="study-unit-section study-unit-drills" aria-labelledby="unit-drills-title">
        <header><span>QUICK CHECK</span><h2 id="unit-drills-title">{isListening ? "三秒内选择自然回应" : "不看笔记，完成三道判断"}</h2><p>先判断功能和方向，再看选项。作答后才显示解析。</p></header>
        <div>
          {unit.drills.map((drill, index) => {
            const choice = answers[drill.id];
            const answered = choice !== undefined;
            return (
              <article key={drill.id}>
                <div className="study-drill-head"><span>{String(index + 1).padStart(2, "0")}</span><h3 lang="ja"><JapaneseReading text={drill.cue} /></h3></div>
                <div className="study-drill-choices">
                  {drill.choices.map((option, optionIndex) => (
                    <button
                      className={answered ? optionIndex === drill.answer ? "correct" : optionIndex === choice ? "wrong" : "" : ""}
                      disabled={answered}
                      key={option}
                      onClick={() => answerDrill(drill.id, optionIndex, drill.answer)}
                      type="button"
                    >
                      <span>{String.fromCharCode(65 + optionIndex)}</span><JapaneseReading text={option} />
                    </button>
                  ))}
                </div>
                {answered && <p className={choice === drill.answer ? "correct" : "wrong"}>{choice === drill.answer ? "判断正确。" : "这次判断未命中。"} {drill.reason}</p>}
              </article>
            );
          })}
        </div>
      </section>

      <section className="study-unit-mastery" aria-labelledby="unit-mastery-title">
        <div><span>YOUR MASTERY</span><h2 id="unit-mastery-title">这个判断现在掌握到哪里？</h2><p>只有主动选择才会改变进度；浏览页面不会自动算作完成。</p></div>
        <div>{ratings.map((option) => <button className={reviewState?.rating === option.rating ? "active" : ""} key={option.rating} onClick={() => rateUnit(option.rating)} title={option.hint} type="button">{option.label}</button>)}</div>
      </section>

      {message && <div className="study-unit-result" role="status">
        <p>{message}</p>
        <div>
          {next && <Link href={`${basePath}/${next.slug}`}>继续 {next.number} · {next.title} →</Link>}
          <Link href={`${basePath}/practice`}>进入混合练习 →</Link>
          <Link href="/n2/review">稍后复习 →</Link>
        </div>
      </div>}

      <nav className="study-unit-navigation" aria-label={`${definition.japanese} 学习路线`}>
        {previous ? <Link href={`${basePath}/${previous.slug}`}><span>← {previous.number}</span><strong>{previous.title}</strong></Link> : <Link href={basePath}><span>← 返回</span><strong>{definition.japanese} 学习 Hub</strong></Link>}
        {next ? <Link href={`${basePath}/${next.slug}`}><span>{next.number} →</span><strong>{next.title}</strong></Link> : <Link href={`${basePath}/practice`}><span>下一步 →</span><strong>{isListening ? "即时应答练习" : "单元混合练习"}</strong></Link>}
      </nav>

      <p className="study-unit-resource-link"><Link href="/n2/resources">资料与内容说明 →</Link></p>
    </article>
  );
}
