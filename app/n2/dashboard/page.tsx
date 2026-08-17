import { PageFooter, SiteHeader } from "@/app/components/site-header";
import { StudyDashboard } from "@/app/components/study-dashboard";
import { chatGPTSignInPath, getChatGPTUser } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const user = await getChatGPTUser();
  return <main className="app-page dashboard-page"><SiteHeader /><div className="page-wrap"><StudyDashboard signedIn={Boolean(user)} signInPath={chatGPTSignInPath("/n2/dashboard")} /></div><PageFooter /></main>;
}
