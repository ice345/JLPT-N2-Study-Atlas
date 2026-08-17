import type { Metadata } from "next";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import type { CompleteDocument } from "@/app/components/complete-notes";
import { CourseModelIndex } from "@/app/components/course-model-index";
import { CoursePracticeDeck } from "@/app/components/course-practice-deck";
import { LearningAtlas } from "@/app/components/learning-atlas";
import { DeepNotesPage, ExamplesPage, PracticePage } from "@/app/components/problem-view-pages";
import { Breadcrumbs, PageFooter, SiteHeader } from "@/app/components/site-header";
import { StudyUnitPage } from "@/app/components/study-unit-page";
import q1Notes from "@/app/data/complete-notes/q1.json";
import q2Notes from "@/app/data/complete-notes/q2.json";
import q3Notes from "@/app/data/complete-notes/q3.json";
import q4Notes from "@/app/data/complete-notes/q4.json";
import q5Notes from "@/app/data/complete-notes/q5.json";
import q6Notes from "@/app/data/complete-notes/q6.json";
import q7Notes from "@/app/data/complete-notes/q7.json";
import q8Notes from "@/app/data/complete-notes/q8.json";
import q9Notes from "@/app/data/complete-notes/q9.json";
import { getLanguageProblemDefinition, languageProblemDefinitions } from "@/app/data/language-course";
import { toLearnerProblemDefinition, type ProblemDefinition } from "@/app/data/problem-definition";

const notesBySlug: Record<string, CompleteDocument[]> = {
  q1: q1Notes as CompleteDocument[], q2: q2Notes as CompleteDocument[], q3: q3Notes as CompleteDocument[],
  q4: q4Notes as CompleteDocument[], q5: q5Notes as CompleteDocument[], q6: q6Notes as CompleteDocument[],
  q7: q7Notes as CompleteDocument[], q8: q8Notes as CompleteDocument[], q9: q9Notes as CompleteDocument[],
};
const specialViews = ["practice", "examples", "notes"] as const;

export function generateStaticParams() {
  return languageProblemDefinitions.flatMap((definition) => [
    ...definition.units.map((unit) => ({ slug: definition.slug, view: unit.slug })),
    ...specialViews.map((view) => ({ slug: definition.slug, view })),
  ]);
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string; view: string }> }): Promise<Metadata> {
  const { slug, view } = await params;
  const definition = getLanguageProblemDefinition(slug);
  if (!definition) return {};
  const unit = definition.units.find((item) => item.slug === view);
  const title = unit?.title ?? (view === "practice" ? definition.practice.title : view === "examples" ? definition.examples.title : definition.deepNotes.title);
  const description = unit?.objective ?? (view === "practice" ? definition.practice.description : view === "examples" ? definition.examples.description : definition.deepNotes.description);
  const fullTitle = `${title} · ${definition.japanese} | JLPT Study Garden`;
  return {
    title: fullTitle,
    description,
    openGraph: { title: fullTitle, description, images: [] },
    twitter: { title: fullTitle, description, images: [] },
  };
}

function PageShell({ definition, label, className = "", children }: { definition: ProblemDefinition; label: string; className?: string; children: ReactNode }) {
  return (
    <main className={`app-page lesson-page problem-system-page ${className}`}>
      <SiteHeader />
      <div className="page-wrap lesson-wrap">
        <Breadcrumbs items={[{ label: "N2", href: "/n2" }, { label: "语言知识", href: "/n2/language" }, { label: definition.japanese, href: `/n2/language/${definition.slug}` }, { label }]} />
        {children}
      </div>
      <PageFooter />
    </main>
  );
}

export default async function LanguageProblemView({ params }: { params: Promise<{ slug: string; view: string }> }) {
  const { slug, view } = await params;
  const definition = getLanguageProblemDefinition(slug);
  if (!definition) notFound();
  const learnerDefinition = toLearnerProblemDefinition(definition);
  const unit = definition.units.find((item) => item.slug === view);
  if (unit) {
    const learnerUnit = learnerDefinition.units.find((item) => item.id === unit.id);
    if (!learnerUnit) notFound();
    return <PageShell definition={definition} label={unit.title}><StudyUnitPage definition={learnerDefinition} unit={learnerUnit} /></PageShell>;
  }
  if (view === "practice") return <PageShell definition={definition} label="练习" className="problem-practice-page"><PracticePage definition={learnerDefinition}><CoursePracticeDeck definition={learnerDefinition} /></PracticePage></PageShell>;
  if (view === "examples") return <PageShell definition={definition} label="模型速查" className="problem-examples-page"><ExamplesPage definition={learnerDefinition} total={definition.units.reduce((total, item) => total + item.concepts.length, 0)}><CourseModelIndex definition={learnerDefinition} /></ExamplesPage></PageShell>;
  if (view === "notes") return <PageShell definition={definition} label="扩展阅读" className="problem-notes-page"><DeepNotesPage definition={learnerDefinition}><LearningAtlas documents={notesBySlug[slug]} kind="language" scope={slug} eyebrow={`${definition.japanese} · EXTENDED READING`} /></DeepNotesPage></PageShell>;
  notFound();
}
