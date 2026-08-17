import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProblemHub } from "@/app/components/problem-hub";
import { Breadcrumbs, PageFooter, SiteHeader } from "@/app/components/site-header";
import { getLanguageProblemDefinition, languageProblemDefinitions } from "@/app/data/language-course";
import { toLearnerProblemDefinition } from "@/app/data/problem-definition";

export function generateStaticParams() {
  return languageProblemDefinitions.map((definition) => ({ slug: definition.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const definition = getLanguageProblemDefinition(slug);
  if (!definition) return {};
  const title = `${definition.japanese} | JLPT Study Garden`;
  return {
    title,
    description: definition.description,
    openGraph: { title, description: definition.description, images: [] },
    twitter: { title, description: definition.description, images: [] },
  };
}

export default async function LanguageProblemHub({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const definition = getLanguageProblemDefinition(slug);
  if (!definition) notFound();
  return (
    <main className="app-page lesson-page problem-system-page">
      <SiteHeader />
      <div className="page-wrap lesson-wrap">
        <Breadcrumbs items={[{ label: "N2", href: "/n2" }, { label: "语言知识", href: "/n2/language" }, { label: definition.japanese }]} />
        <ProblemHub definition={toLearnerProblemDefinition(definition)} />
      </div>
      <PageFooter />
    </main>
  );
}
