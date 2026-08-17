import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { type CompleteDocument } from "@/app/components/complete-notes";
import { EvidenceLibrary } from "@/app/components/evidence-library";
import { LearningAtlas } from "@/app/components/learning-atlas";
import { ListeningLab } from "@/app/components/listening-lab";
import { DeepNotesPage, ExamplesPage, PracticePage } from "@/app/components/problem-view-pages";
import { Breadcrumbs, PageFooter, SiteHeader } from "@/app/components/site-header";
import { StudyUnitPage } from "@/app/components/study-unit-page";
import problemFourNotes from "@/app/data/complete-notes/listening-p4.json";
import { toLearnerProblemDefinition } from "@/app/data/problem-definition";
import { problemFourDefinition } from "@/app/data/problem-four-course";
import { buildProblemFourEvidence } from "@/app/lib/problem-four-evidence";

const documents = problemFourNotes as CompleteDocument[];
const evidence = buildProblemFourEvidence(documents);
const learnerDefinition = toLearnerProblemDefinition(problemFourDefinition);
const specialViews = ["practice", "examples", "notes"] as const;

export function generateStaticParams() {
  return [
    ...problemFourDefinition.units.map((unit) => ({ view: unit.slug })),
    ...specialViews.map((view) => ({ view })),
  ];
}

export async function generateMetadata({ params }: { params: Promise<{ view: string }> }): Promise<Metadata> {
  const { view } = await params;
  const unit = problemFourDefinition.units.find((item) => item.slug === view);
  const title = unit?.title
    ?? (view === "practice" ? problemFourDefinition.practice.title : view === "examples" ? problemFourDefinition.examples.title : view === "notes" ? problemFourDefinition.deepNotes.title : "問題4");
  const description = unit?.objective
    ?? (view === "practice" ? problemFourDefinition.practice.description : view === "examples" ? problemFourDefinition.examples.description : problemFourDefinition.deepNotes.description);
  return {
    title: `${title} · 問題4 | JLPT Study Garden`,
    description,
    openGraph: { title: `${title} · 問題4`, description, images: [] },
    twitter: { title: `${title} · 問題4`, description, images: [] },
  };
}

function PageShell({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <main className={`app-page listening-detail problem-system-page ${className}`}>
      <SiteHeader />
      <div className="page-wrap lesson-wrap">
        <Breadcrumbs items={[{ label: "N2", href: "/n2" }, { label: "听力", href: "/n2/listening" }, { label: "問題4", href: "/n2/listening/problem-4" }, { label }]} />
        {children}
      </div>
      <PageFooter />
    </main>
  );
}

export default async function ProblemFourView({ params }: { params: Promise<{ view: string }> }) {
  const { view } = await params;
  const unit = problemFourDefinition.units.find((item) => item.slug === view);

  if (unit) {
    const learnerUnit = learnerDefinition.units.find((item) => item.slug === unit.slug);
    if (!learnerUnit) notFound();
    return <PageShell label={unit.title}><StudyUnitPage definition={learnerDefinition} unit={learnerUnit} /></PageShell>;
  }

  if (view === "practice") {
    return (
      <PageShell label="练习" className="problem-practice-page">
        <PracticePage definition={learnerDefinition}><ListeningLab /></PracticePage>
      </PageShell>
    );
  }

  if (view === "examples") {
    return (
      <PageShell label="历年题型模式" className="problem-examples-page">
        <ExamplesPage definition={learnerDefinition} total={evidence.length}>
          <section className="representative-patterns" aria-labelledby="representative-patterns-title">
            <header><span>REPRESENTATIVE EXAMPLES</span><h2 id="representative-patterns-title">先用三种典型反转读懂证据库</h2></header>
            <div>
              <article><strong lang="ja">〜ところだった</strong><p>差点发生，但最后没有发生。回应方向通常是庆幸或确认结果。</p></article>
              <article><strong lang="ja">〜ずに済んだ</strong><p>避免了原本担心的结果。不要选成“最后还是发生了”。</p></article>
              <article><strong lang="ja">〜次第</strong><p>条件一满足就立刻行动。答案要承接启动时点。</p></article>
            </div>
          </section>
          <EvidenceLibrary items={evidence} />
          <section className="exam-trend problem-exam-trend">
            <div><span>EXAM TRENDS</span><h2>趋势材料与已验证规律分开。</h2></div>
            <p><strong>趋势观察，不代表真实考试预测。</strong> 2026、高频与押题整理只适合安排复习优先级，不能作为真实出题承诺。</p>
            <Link href="/n2/listening/problem-4/notes">查看更多场景与趋势说明 →</Link>
          </section>
        </ExamplesPage>
      </PageShell>
    );
  }

  if (view === "notes") {
    return (
      <PageShell label="场景扩展与完整说明" className="problem-notes-page">
        <DeepNotesPage definition={learnerDefinition}><LearningAtlas documents={documents} kind="listening" scope="p4" eyebrow="問題4 · DEEP NOTES" /></DeepNotesPage>
      </PageShell>
    );
  }

  notFound();
}
