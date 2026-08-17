"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getUnitCatalogEntry, problemCatalog } from "@/app/lib/learning-catalog";
import { getStudyStore, type CourseCompletionState, type ReviewState, type StudyEvent } from "@/app/lib/study-store";

export function N2ActionHome() {
  const [events, setEvents] = useState<StudyEvent[]>([]);
  const [reviews, setReviews] = useState<ReviewState[]>([]);
  const [completions, setCompletions] = useState<CourseCompletionState[]>([]);

  useEffect(() => {
    let active = true;
    const store = getStudyStore();
    Promise.all([store.getEvents(), store.getReviewStates(), store.getCourseCompletions()]).then(([nextEvents, nextReviews, nextCompletions]) => {
      if (!active) return;
      setEvents(nextEvents);
      setReviews(nextReviews);
      setCompletions(nextCompletions);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);

  const due = reviews.filter((state) => state.nextReviewAt <= new Date().toISOString()).length;
  const latestAnswers = new Map<string, StudyEvent>();
  for (const event of events.filter((item) => item.type === "practice_answer" || item.type === "diagnostic_answer")) {
    if (!latestAnswers.has(event.contentId)) latestAnswers.set(event.contentId, event);
  }
  const wrong = [...latestAnswers.values()].filter((event) => event.correct === false).length;
  const completed = completions.filter((state) => state.status === "completed").length;
  const current = completions.find((state) => state.status === "in_progress") ?? completions[0];
  const currentUnit = getUnitCatalogEntry(current?.unitId);
  const hasDiagnostic = events.some((event) => event.type === "diagnostic_answer");
  const studiedProblems = new Set(events.map((event) => event.problemId).filter(Boolean)).size;

  return (
    <section className="n2-action-home page-wrap" aria-labelledby="next-action-title">
      <header><div><span>NEXT ACTION</span><h2 id="next-action-title">现在最值得完成的一步</h2></div><p>{studiedProblems} / {problemCatalog.length} 个题型已有学习记录</p></header>
      <div>
        <article className="n2-action-primary">
          <span>{currentUnit ? "CONTINUE COURSE" : hasDiagnostic ? "START A LESSON" : "FIRST BASELINE"}</span>
          <h3>{currentUnit?.title ?? (hasDiagnostic ? "从学习地图选择一个薄弱题型" : "用标准诊断建立学习起点")}</h3>
          <p>{currentUnit?.description ?? (hasDiagnostic ? "完成一节短课、一道微训练和一次掌握判断。" : "38 题覆盖全部 19 个题型，每个题型两个样本。")}</p>
          <Link href={currentUnit?.href ?? (hasDiagnostic ? "/n2/language" : "/n2/practice")}>{currentUnit ? "继续这节课" : hasDiagnostic ? "选择课程" : "开始标准诊断"} →</Link>
        </article>
        <article><span>TODAY REVIEW</span><strong>{due + wrong}</strong><p>{due} 个到期项目 · {wrong} 道当前错题</p><Link href="/n2/review">打开统一复习队列 →</Link></article>
        <article><span>COURSE COMPLETION</span><strong>{completed}</strong><p>主动完成的课程；不会与掌握度混算。</p><Link href="/n2/dashboard">查看完整学习统计 →</Link></article>
      </div>
    </section>
  );
}
