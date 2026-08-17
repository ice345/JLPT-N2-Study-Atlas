import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { type CompleteDocument } from "@/app/components/complete-notes";
import { CourseModelIndex } from "@/app/components/course-model-index";
import { CoursePracticeDeck } from "@/app/components/course-practice-deck";
import { LearningAtlas } from "@/app/components/learning-atlas";
import { DeepNotesPage, ExamplesPage, PracticePage } from "@/app/components/problem-view-pages";
import { Breadcrumbs, PageFooter, SiteHeader } from "@/app/components/site-header";
import { StudyUnitPage } from "@/app/components/study-unit-page";
import problemOneTwoNotes from "@/app/data/complete-notes/listening-p12.json";
import { problemOneTwoDefinitions } from "@/app/data/problem-one-two-course";
import { problemThreeFiveDefinitions } from "@/app/data/listening-three-five-course";
import { problemFiveEvidence, problemFiveTraps, problemThreeEvidence, problemThreeTraps } from "@/app/data/listening-content";
import { toLearnerProblemDefinition, type ProblemDefinition } from "@/app/data/problem-definition";

const specialViews = ["practice", "examples", "notes"] as const;
const listeningDocuments = (problemOneTwoNotes as CompleteDocument[]).filter((document) => /N2听力|問題1・2 补充资料：20/u.test(document.title));
const definitions = [...problemOneTwoDefinitions, ...problemThreeFiveDefinitions];

function definitionFor(problem: string): ProblemDefinition | undefined {
  return definitions.find((definition) => definition.slug === problem);
}

export function generateStaticParams() {
  return definitions.flatMap((definition) => [
    ...definition.units.map((unit) => ({ problem: definition.slug, view: unit.slug })),
    ...specialViews.map((view) => ({ problem: definition.slug, view })),
  ]);
}

function ListeningEvidencePanel({ problem }: { problem: string }) {
  const items = problem === "problem-3" ? problemThreeEvidence : problemFiveEvidence;
  const traps = problem === "problem-3" ? problemThreeTraps : problemFiveTraps;
  return <>
    <section className="source-evidence-section learner-pattern-section">
      <div className="p4-intro"><div><span>SCENE PATTERNS</span><h2>用跨年场景练习判断层级</h2></div><p>先看场景如何从背景走到主旨或最终决定，再回到短课练同一模型。</p></div>
      <div className="evidence-table compact-evidence">
        <div className="evidence-head four-columns"><strong>时期</strong><strong>场景</strong><strong>信息走向</strong><strong>判断重点</strong></div>
        {items.map((item) => <div className="evidence-row four-columns" key={`${item[0]}-${item[1]}`}><strong>{item[0]}</strong><span>{item[1]}</span><p>{item[2]}</p><em>{item[3]}</em></div>)}
      </div>
    </section>
    <section className="trap-section">
      <div className="p4-intro"><div><span>TRAP REVIEW</span><h2>集中检查最容易串线的地方</h2></div><p>每个错误选项都可能复述真实信息，但它停在了错误层级、错误人物或过时决定。</p></div>
      <div className="confusion-grid reading-traps">{traps.map((trap, index) => <article key={trap.title}><span>TRAP {String(index + 1).padStart(2, "0")}</span><h3>{trap.title}</h3><div className="wrong-line"><i>×</i><strong>{trap.wrong}</strong></div><div className="correct-line"><i>○</i><strong>{trap.correct}</strong></div></article>)}</div>
    </section>
  </>;
}

export async function generateMetadata({ params }: { params: Promise<{ problem: string; view: string }> }): Promise<Metadata> {
  const { problem, view } = await params;
  const definition = definitionFor(problem);
  if (!definition) return {};
  const unit = definition.units.find((item) => item.slug === view);
  const title = unit?.title ?? (view === "practice" ? definition.practice.title : view === "examples" ? definition.examples.title : definition.deepNotes.title);
  const description = unit?.objective ?? (view === "practice" ? definition.practice.description : view === "examples" ? definition.examples.description : definition.deepNotes.description);
  return { title: `${title} · ${definition.japanese} | JLPT Study Garden`, description };
}

function PageShell({ definition, label, children, className = "" }: { definition: ProblemDefinition; label: string; children: ReactNode; className?: string }) {
  return <main className={`app-page listening-detail problem-system-page ${className}`}><SiteHeader /><div className="page-wrap lesson-wrap"><Breadcrumbs items={[{ label: "N2", href: "/n2" }, { label: "听力", href: "/n2/listening" }, { label: definition.japanese, href: `/n2/listening/${definition.slug}` }, { label }]} />{children}</div><PageFooter /></main>;
}

export default async function ProblemOneTwoView({ params }: { params: Promise<{ problem: string; view: string }> }) {
  const { problem, view } = await params;
  const definition = definitionFor(problem);
  if (!definition) notFound();
  const learnerDefinition = toLearnerProblemDefinition(definition);
  const unit = definition.units.find((item) => item.slug === view);
  if (unit) {
    const learnerUnit = learnerDefinition.units.find((item) => item.id === unit.id);
    if (!learnerUnit) notFound();
    return <PageShell definition={definition} label={unit.title}><StudyUnitPage definition={learnerDefinition} unit={learnerUnit} /></PageShell>;
  }
  if (view === "practice") return <PageShell definition={definition} label="练习" className="problem-practice-page"><PracticePage definition={learnerDefinition}><CoursePracticeDeck definition={learnerDefinition} /></PracticePage></PageShell>;
  if (view === "examples") return <PageShell definition={definition} label="题型模式" className="problem-examples-page"><ExamplesPage definition={learnerDefinition} total={definition.units.reduce((total, item) => total + item.concepts.length, 0)}><CourseModelIndex definition={learnerDefinition} />{(problem === "problem-3" || problem === "problem-5") && <ListeningEvidencePanel problem={problem} />}</ExamplesPage></PageShell>;
  if (view === "notes") return <PageShell definition={definition} label="扩展阅读" className="problem-notes-page"><DeepNotesPage definition={learnerDefinition}>{problem === "problem-1" || problem === "problem-2" ? <LearningAtlas documents={listeningDocuments} kind="listening" scope="p12" eyebrow={`${definition.japanese} · EXTENDED READING`} /> : <ListeningEvidencePanel problem={problem} />}</DeepNotesPage></PageShell>;
  notFound();
}
