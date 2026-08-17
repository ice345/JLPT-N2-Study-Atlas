import Link from "next/link";
import type { ReactNode } from "react";
import type { LearnerProblemDefinition } from "@/app/data/problem-definition";

function basePath(definition: LearnerProblemDefinition) {
  return `/n2/${definition.domain}/${definition.slug}`;
}

export function PracticePage({ definition, children }: { definition: LearnerProblemDefinition; children: ReactNode }) {
  const path = basePath(definition);
  const isListening = definition.domain === "listening";
  return (
    <>
      <header className="problem-view-hero">
        <div><span>PRACTICE · {isListening ? "3 SECOND RESPONSE" : "ACTIVE CHECK"}</span><h1>{definition.practice.title}</h1><p>{definition.practice.description}</p></div>
        <aside><strong>{definition.practice.cardCount}</strong><span>训练卡</span><small>约 {definition.practice.estimatedMinutes} 分钟</small></aside>
      </header>
      <section className="problem-practice-guide"><strong>{isListening ? "先听 / 读短句" : "先读题干与空格两侧"}</strong><span>→</span><strong>{isListening ? "三秒判断回应方向" : "独立选择最自然答案"}</strong><span>→</span><strong>揭晓并标记掌握度</strong></section>
      {children}
      <nav className="problem-view-footer"><Link href={path}>← 返回{definition.japanese} Hub</Link><Link href="/n2/review">复习不会与模糊项 →</Link></nav>
    </>
  );
}

export function ExamplesPage({ definition, total, children }: { definition: LearnerProblemDefinition; total: number; children: ReactNode }) {
  const path = basePath(definition);
  return (
    <>
      <header className="problem-view-hero">
        <div><span>EXAM PATTERNS · {definition.examples.yearRange}</span><h1>{definition.examples.title}</h1><p>{definition.examples.description}</p></div>
        <aside><strong>{total}</strong><span>模式条目</span><small>用于集中复习</small></aside>
      </header>
      {children}
      <nav className="problem-view-footer"><Link href={path}>← 返回{definition.japanese} Hub</Link><Link href={`${path}/practice`}>进入综合练习 →</Link></nav>
    </>
  );
}

export function DeepNotesPage({ definition, children }: { definition: LearnerProblemDefinition; children: ReactNode }) {
  const path = basePath(definition);
  return (
    <>
      <header className="problem-research-hero">
        <div><span>EXTENDED READING · OPTIONAL</span><h1>{definition.deepNotes.title}</h1><p>需要比较更多例句、历年变化或完整说明时，可以在这里继续查阅；日常学习不必一次读完。</p></div>
        <nav><Link href={path}>返回学习路线</Link><Link href="/n2/resources">资料说明</Link></nav>
      </header>
      {children}
      <nav className="problem-view-footer"><Link href={path}>← 返回{definition.japanese} Hub</Link><Link href={`${path}/examples`}>查看历年模式 →</Link></nav>
    </>
  );
}
