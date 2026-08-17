import { ProblemHub } from "@/app/components/problem-hub";
import { Breadcrumbs, PageFooter, SiteHeader } from "@/app/components/site-header";
import { problemThreeDefinition } from "@/app/data/listening-three-five-course";
import { toLearnerProblemDefinition } from "@/app/data/problem-definition";

export default function ListeningProblemThree() {
  return <main className="app-page listening-detail problem-system-page"><SiteHeader /><div className="page-wrap lesson-wrap"><Breadcrumbs items={[{ label: "N2", href: "/n2" }, { label: "听力", href: "/n2/listening" }, { label: "問題3" }]} /><ProblemHub definition={toLearnerProblemDefinition(problemThreeDefinition)} /></div><PageFooter /></main>;
}
