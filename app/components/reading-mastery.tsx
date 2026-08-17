"use client";

import { useEffect, useState } from "react";
import { getStudyStore, recordReview, recordStudyEvent, type CourseCompletionStatus, type ReviewState, type StudyRating } from "@/app/lib/study-store";
import { useActiveStudyTimer } from "@/app/lib/use-active-study-timer";

const ratings: { value: StudyRating; label: string }[] = [
  { value: "again", label: "不会" },
  { value: "hard", label: "模糊" },
  { value: "good", label: "会了" },
];

export function ReadingMastery({ slug, title }: { slug: string; title: string }) {
  const contentId = `reading-${slug}`;
  const [state, setState] = useState<ReviewState>();
  const [completion, setCompletion] = useState<CourseCompletionStatus>("not_started");
  const [message, setMessage] = useState("");
  useActiveStudyTimer({ contentId, contentType: "reading", domain: "reading", problemId: slug, unitId: contentId, skill: title });

  useEffect(() => {
    let active = true;
    Promise.all([getStudyStore().getReviewState(contentId), getStudyStore().getCourseCompletions()]).then(([value, completions]) => {
      if (!active) return;
      setState(value);
      setCompletion(completions.find((item) => item.contentId === contentId)?.status ?? "not_started");
    }).catch(() => undefined);
    recordStudyEvent({ type: "lesson_started", contentType: "reading", contentId, problemId: slug, unitId: contentId, domain: "reading", skill: title }).catch(() => undefined);
    return () => { active = false; };
  }, [contentId, slug, title]);

  async function rate(rating: StudyRating) {
    try {
      const next = await recordReview("concept_review", { contentId, contentType: "reading", problemId: slug, unitId: contentId, domain: "reading", skill: title }, rating, state);
      setState(next);
      setMessage("掌握判断已保存；它不会替代课程完成状态。");
    } catch {
      setMessage("内容仍可继续学习，但这次掌握状态没有保存成功。");
    }
  }

  async function completeLesson() {
    try {
      await recordStudyEvent({ type: "lesson_completed", contentType: "reading", contentId, problemId: slug, unitId: contentId, domain: "reading", skill: title });
      setCompletion("completed");
      setMessage("本题型课程已完成；复习间隔仍按你的掌握判断计算。");
    } catch {
      setMessage("课程完成状态没有保存成功，请稍后重试。");
    }
  }

  return <section className="study-unit-mastery reading-mastery" aria-labelledby={`${slug}-mastery`}>
    <div><span>FINISH &amp; REVIEW</span><h2 id={`${slug}-mastery`}>完成这套读法，再判断掌握程度。</h2><p>完成模型、代表场景和检查清单后，分别保存课程完成度与主动回忆判断。</p></div>
    <div><button className={completion === "completed" ? "active" : ""} disabled={completion === "completed"} onClick={completeLesson} type="button">{completion === "completed" ? "课程已完成" : "完成这节课"}</button>{ratings.map((rating) => <button className={state?.rating === rating.value ? "active" : ""} key={rating.value} onClick={() => rate(rating.value)} type="button">{rating.label}</button>)}</div>
    {message && <p className="practice-sync-message" role="status">{message}</p>}
  </section>;
}
