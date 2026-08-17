import type { Metadata } from "next";
import { ProblemHub } from "@/app/components/problem-hub";
import { Breadcrumbs, PageFooter, SiteHeader } from "@/app/components/site-header";
import { problemTwoDefinition } from "@/app/data/problem-one-two-course";
import { toLearnerProblemDefinition } from "@/app/data/problem-definition";

export const metadata: Metadata = { title: "問題2 ポイント理解 | JLPT Study Garden", description: problemTwoDefinition.description };

export default function ProblemTwoHubPage() {
  return <main className="app-page listening-detail problem-system-page"><SiteHeader /><div className="page-wrap lesson-wrap"><Breadcrumbs items={[{ label: "N2", href: "/n2" }, { label: "听力", href: "/n2/listening" }, { label: "問題2" }]} /><ProblemHub definition={toLearnerProblemDefinition(problemTwoDefinition)} /></div><PageFooter /></main>;
}
