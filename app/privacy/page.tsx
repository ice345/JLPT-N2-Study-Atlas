import { chatGPTSignInPath, getChatGPTUser } from "@/app/chatgpt-auth";
import { PrivacyControls } from "@/app/components/privacy-controls";
import { Breadcrumbs, PageFooter, SiteHeader } from "@/app/components/site-header";

export const dynamic = "force-dynamic";

export default async function PrivacyPage() {
  const user = await getChatGPTUser();
  return <main className="app-page privacy-page">
    <SiteHeader />
    <div className="page-wrap">
      <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "隐私与数据" }]} />
      <section className="privacy-hero">
        <span className="eyebrow">PRIVACY · LOCAL FIRST</span>
        <h1>先在你的设备上学习，<br />需要时才同步。</h1>
        <p>匿名学习时，练习、掌握状态与复习时间只保存在当前浏览器。登录后，这些学习事件才会同步到云端，供其他设备继续使用。</p>
      </section>
      <section className="privacy-principles">
        <article><span>01</span><h2>本地记录</h2><p>包括作答、用时、课程完成、复习判断、未完成场次与每日学习时间。清除浏览器数据也可能一并删除它们。</p></article>
        <article><span>02</span><h2>云端同步</h2><p>登录只用于关联内部学习身份并同步学习事件。退出登录不会自动删除当前设备上的记录。</p></article>
        <article><span>03</span><h2>AI 可选</h2><p>规则计划不需要 AI。个人密钥选择“仅使用一次”时不会持久化；安全保存时使用 AES-256-GCM 加密，页面只显示末四位。</p></article>
        <article><span>04</span><h2>学习诊断</h2><p>诊断结果只用于安排本站学习顺序，不是官方 JLPT 成绩、合格预测或医疗、教育资质判断。</p></article>
      </section>
      <PrivacyControls signedIn={Boolean(user)} signInPath={chatGPTSignInPath("/privacy")} />
    </div>
    <PageFooter />
  </main>;
}
