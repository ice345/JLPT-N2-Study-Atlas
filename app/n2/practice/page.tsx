import { Breadcrumbs, PageFooter, SiteHeader } from "@/app/components/site-header";
import { PracticeStudio } from "@/app/components/practice-studio";
import { chatGPTSignInPath, getChatGPTUser } from "@/app/chatgpt-auth";

export const dynamic = "force-dynamic";

export default async function PracticePage({ searchParams }: { searchParams: Promise<{ card?: string }> }) {
  const user = await getChatGPTUser();
  const { card } = await searchParams;
  return <main className="app-page practice-page"><SiteHeader /><div className="page-wrap"><Breadcrumbs items={[{ label: "N2", href: "/n2" }, { label: "练习台" }]} /><section className="practice-hero"><div><span className="eyebrow">N2 PRACTICE LAB · LOCAL FIRST</span><h1>先做题，<br />再决定该回哪一课。</h1><p>不登录也能作答、续做与保存结果。完成后会按语言知识、阅读、听力和具体能力生成学习顺序；课程音频优先使用本站预生成音频，缺失时才使用系统日语语音。</p></div><div className="practice-hero-mark"><span>诊断题库</span><strong>57</strong><small>题 · 覆盖 19 题型</small></div></section><PracticeStudio initialCardId={card} signedIn={Boolean(user)} signInPath={chatGPTSignInPath(`/n2/practice${card ? `?card=${encodeURIComponent(card)}` : ""}`)} /></div><PageFooter /></main>;
}
