"use client";

import { useEffect, useState } from "react";
import { getStudyStore, recordReview, recordStudyEvent, type ReviewState, type StudyRating } from "@/app/lib/study-store";

const ratings: { value: StudyRating; label: string }[] = [
  { value: "again", label: "不会" },
  { value: "hard", label: "模糊" },
  { value: "good", label: "会了" },
];

export function ReadingMastery({ slug, title }: { slug: string; title: string }) {
  const contentId = `reading-${slug}`;
  const [state, setState] = useState<ReviewState>();
  const [message, setMessage] = useState("");

  useEffect(() => {
    let active = true;
    getStudyStore().getReviewState(contentId).then((value) => active && setState(value)).catch(() => undefined);
    recordStudyEvent({ type: "lesson_started", contentType: "reading", contentId, domain: "reading", skill: title }).catch(() => undefined);
    return () => { active = false; };
  }, [contentId, title]);

  async function rate(rating: StudyRating) {
    try {
      const next = await recordReview("concept_review", { contentId, contentType: "reading", domain: "reading", skill: title }, rating, state);
      setState(next);
      if (rating === "good") await recordStudyEvent({ type: "lesson_completed", contentType: "reading", contentId, domain: "reading", skill: title });
      setMessage(rating === "good" ? "已完成本题型；系统会在合适时间安排复习。" : "已加入复习队列。先回看模型与陷阱，再做相关题。 ");
    } catch {
      setMessage("内容仍可继续学习，但这次掌握状态没有保存成功。");
    }
  }

  return <section className="study-unit-mastery reading-mastery" aria-labelledby={`${slug}-mastery`}>
    <div><span>YOUR MASTERY</span><h2 id={`${slug}-mastery`}>这套读法现在掌握到哪里？</h2><p>完成模型、代表场景和检查清单后，再做一次主动判断。</p></div>
    <div>{ratings.map((rating) => <button className={state?.rating === rating.value ? "active" : ""} key={rating.value} onClick={() => rate(rating.value)} type="button">{rating.label}</button>)}</div>
    {message && <p className="practice-sync-message" role="status">{message}</p>}
  </section>;
}
