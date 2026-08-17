import { PageFooter, SiteHeader } from "@/app/components/site-header";
import { StudyStoryEditor } from "@/app/components/study-story-editor";
import { PublishedStudyStory } from "@/app/components/published-study-story";
import { publishedStudyStory } from "@/app/data/study-story-source";

export default function PlanPage() {
  return (
    <main className="app-page plan-page">
      <SiteHeader />
      <div className="page-wrap"><PublishedStudyStory draft={publishedStudyStory} /><StudyStoryEditor initial={publishedStudyStory} /></div>
      <PageFooter />
    </main>
  );
}
