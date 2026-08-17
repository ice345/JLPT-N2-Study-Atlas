import type { Metadata } from "next";
import { ProblemHub } from "@/app/components/problem-hub";
import { Breadcrumbs, PageFooter, SiteHeader } from "@/app/components/site-header";
import { problemOneDefinition } from "@/app/data/problem-one-two-course";
import { toLearnerProblemDefinition } from "@/app/data/problem-definition";

export const metadata: Metadata = { title: "問題1 課題理解 | JLPT Study Garden", description: problemOneDefinition.description };

export default function ProblemOneHubPage() {
  return <main className="app-page listening-detail problem-system-page"><SiteHeader /><div className="page-wrap lesson-wrap"><Breadcrumbs items={[{ label: "N2", href: "/n2" }, { label: "听力", href: "/n2/listening" }, { label: "問題1" }]} /><ProblemHub definition={toLearnerProblemDefinition(problemOneDefinition)} /></div><PageFooter /></main>;
}
