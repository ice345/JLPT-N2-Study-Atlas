import Link from "next/link";
import { Breadcrumbs, PageFooter, SiteHeader } from "@/app/components/site-header";

const listeningModules = [
  { number: "1", title: "課題理解", cn: "接下来要做什么", status: "6 单元 · 24 练习", href: "/n2/listening/problem-1" },
  { number: "2", title: "ポイント理解", cn: "真正理由与重点", status: "6 单元 · 24 练习", href: "/n2/listening/problem-2" },
  { number: "3", title: "概要理解", cn: "把握说话人的主张", status: "4 单元 · 12 练习", href: "/n2/listening/problem-3" },
  { number: "4", title: "即時応答", cn: "3 秒选自然回应", status: "6 单元 · 即时训练", href: "/n2/listening/problem-4", active: true },
  { number: "5", title: "統合理解", cn: "综合多段信息", status: "4 单元 · 12 练习", href: "/n2/listening/problem-5" },
];

export default function ListeningIndex() {
  return (
    <main className="app-page listening-page">
      <SiteHeader />
      <div className="page-wrap">
        <Breadcrumbs items={[{ label: "N2", href: "/n2" }, { label: "听力" }]} />
        <section className="section-hero listening-hero">
          <div><span className="eyebrow">聴解 · LISTENING</span><h1>耳朵先抓功能，<br />不要逐字翻译。</h1></div>
          <p>問題1–5都按“先学一个判断 → 立即练习 → 标记掌握 → 回到复习”的顺序组织。先选题型，再完成一个短单元。</p>
          <div className="sound-wave" aria-hidden="true">{Array.from({ length: 15 }).map((_, i) => <i key={i} />)}</div>
        </section>

        <section className="listening-index">
          {listeningModules.map((item) => (
            <Link className={item.active ? "active" : ""} href={item.href} key={item.number}>
              <span>{item.number.padStart(2, "0")}</span><div><small>問題 {item.number}</small><h2>{item.title}</h2></div>
              <p>{item.cn}</p><em>{item.status}</em><b>↗</b>
            </Link>
          ))}
        </section>

        <section className="method-banner">
          <div><span>○</span><p>已经完成</p></div><div><span>×</span><p>被否定</p></div><div><span>→</span><p>接下来行动</p></div><div><span>★</span><p>真正理由</p></div>
          <article><small>問題1・2 速记法</small><h2>先选任务链或重点链，再进入独立短课。</h2><Link href="/n2/listening/problem-1-2">比较两种题型 →</Link></article>
        </section>
      </div>
      <PageFooter />
    </main>
  );
}
