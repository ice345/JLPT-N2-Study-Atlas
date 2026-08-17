"use client";

import { useMemo, useState } from "react";
import { JapaneseReading } from "@/app/components/japanese-reading";
import type { LearnerProblemDefinition } from "@/app/data/problem-definition";
import { recordReview, recordStudyEvent } from "@/app/lib/study-store";

export function CoursePracticeDeck({ definition }: { definition: LearnerProblemDefinition }) {
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const drills = useMemo(() => definition.units.flatMap((unit) => unit.drills.map((drill) => ({ ...drill, unit }))), [definition.units]);
  const answered = Object.keys(answers).length;
  const correct = drills.filter((drill) => answers[drill.id] === drill.answer).length;

  async function choose(drillId: string, choice: number, answer: number, skill: string) {
    if (answers[drillId] !== undefined) return;
    setAnswers((current) => ({ ...current, [drillId]: choice }));
    const isCorrect = choice === answer;
    const contentId = `${definition.practice.reviewPrefix}${drillId}`;
    const contentType = definition.domain === "reading" ? "reading" : definition.domain === "listening" ? "listening" : "problem";
    try {
      await Promise.all([
        recordStudyEvent({ type: "practice_answer", contentType, contentId, domain: definition.domain, skill, correct: isCorrect }),
        recordReview(definition.domain === "listening" ? "listening_drill" : "concept_review", { contentId, contentType, domain: definition.domain, skill }, isCorrect ? "good" : "again"),
      ]);
      setMessage(isCorrect ? "已记录为会了；答错的卡片会更快回到复习中心。" : "这张卡已进入短间隔复习。先看解析，再继续下一题。");
    } catch {
      setMessage("答案与解析仍可正常使用，但这次本地复习记录没有保存成功。");
    }
  }

  return (
    <section className="course-practice-deck" aria-labelledby="course-practice-title">
      <header>
        <div><span>MIXED DRILL</span><h2 id="course-practice-title">{definition.units.length} 类能力混合训练</h2><p>每一组对应一个核心单元。先独立判断，再点击选项核对。</p></div>
        <div><strong>{correct}</strong><span>正确</span><i>/</i><strong>{answered}</strong><span>已答</span></div>
      </header>
      {definition.units.map((unit) => (
        <section className="study-unit-section study-unit-drills course-practice-group" aria-labelledby={`${unit.id}-practice`} key={unit.id}>
          <header><span>UNIT {unit.number}</span><h2 id={`${unit.id}-practice`}>{unit.title}</h2><p>{unit.coverage.join(" · ")}</p></header>
          <div>
            {unit.drills.map((drill, index) => {
              const choice = answers[drill.id];
              const hasAnswered = choice !== undefined;
              return (
                <article key={drill.id}>
                  <div className="study-drill-head"><span>{String(index + 1).padStart(2, "0")}</span><h3 lang="ja"><JapaneseReading text={drill.cue} /></h3></div>
                  <div className="study-drill-choices">
                    {drill.choices.map((option, optionIndex) => (
                      <button
                        className={hasAnswered ? optionIndex === drill.answer ? "correct" : optionIndex === choice ? "wrong" : "" : ""}
                        disabled={hasAnswered}
                        key={option}
                        onClick={() => choose(drill.id, optionIndex, drill.answer, unit.title)}
                        type="button"
                      ><span>{String.fromCharCode(65 + optionIndex)}</span><JapaneseReading text={option} /></button>
                    ))}
                  </div>
                  {hasAnswered && <p className={choice === drill.answer ? "correct" : "wrong"}>{choice === drill.answer ? "判断正确。" : "这次方向不对。"} {drill.reason}</p>}
                </article>
              );
            })}
          </div>
        </section>
      ))}
      {message && <p className="practice-sync-message" role="status">{message}</p>}
    </section>
  );
}
