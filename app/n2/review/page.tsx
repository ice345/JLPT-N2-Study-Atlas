import { getChatGPTUser } from "@/app/chatgpt-auth";
import { ReviewCenter } from "@/app/components/review-center";
import { Breadcrumbs, PageFooter, SiteHeader } from "@/app/components/site-header";

export const dynamic = "force-dynamic";

export default async function ReviewPage() {
  const user = await getChatGPTUser();
  return (
    <main className="app-page review-page">
      <SiteHeader />
      <div className="page-wrap">
        <Breadcrumbs items={[{ label: "N2", href: "/n2" }, { label: "Review Center" }]} />
        <ReviewCenter signedIn={Boolean(user)} />
      </div>
      <PageFooter />
    </main>
  );
}
