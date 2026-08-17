import { Breadcrumbs, PageFooter, SiteHeader } from "@/app/components/site-header";
import { ProblemHub } from "@/app/components/problem-hub";
import { toLearnerProblemDefinition } from "@/app/data/problem-definition";
import { problemFourDefinition } from "@/app/data/problem-four-course";

const learnerDefinition = toLearnerProblemDefinition(problemFourDefinition);

export default function ListeningProblemFour() {
  return (
    <main className="app-page listening-detail">
      <SiteHeader />
      <div className="page-wrap">
        <Breadcrumbs items={[{ label: "N2", href: "/n2" }, { label: "听力", href: "/n2/listening" }, { label: "問題4" }]} />
        <ProblemHub definition={learnerDefinition} />
      </div>
      <PageFooter />
    </main>
  );
}
