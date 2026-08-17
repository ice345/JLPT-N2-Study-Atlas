import Link from "next/link";
import { Breadcrumbs, PageFooter, SiteHeader } from "@/app/components/site-header";
import { problemOneDefinition, problemTwoDefinition } from "@/app/data/problem-one-two-course";

const definitions = [problemOneDefinition, problemTwoDefinition];

export default function ListeningProblemSelector() {
  return (
    <main className="app-page listening-detail problem-selector-page">
      <SiteHeader />
      <div className="page-wrap">
        <Breadcrumbs items={[{ label: "N2", href: "/n2" }, { label: "听力", href: "/n2/listening" }, { label: "問題1・2" }]} />
        <header className="problem-selector-hero">
          <span>問題1・2 · ROUTE SELECTOR</span>
          <h1>先分清在找“下一步”，<br />还是在找“真正重点”。</h1>
          <p>問題1追踪“下一步动作”，問題2寻找“最后重点”。先选择判断目标，再进入对应的短课、例句、练习与扩展说明。</p>
        </header>

        <section className="problem-selector-grid" aria-label="选择問題1或問題2">
          {definitions.map((definition) => (
            <article key={definition.id}>
              <div><span>問題</span><strong>{definition.number}</strong></div>
              <header><small>{definition.japanese}</small><h2>{definition.title}</h2><p>{definition.description}</p></header>
              <ol>{definition.quickSummary.map((item, index) => <li key={item}><span>{index + 1}</span>{item}</li>)}</ol>
              <ul>{definition.units.map((unit) => <li key={unit.id}>{unit.title}</li>)}</ul>
              <Link href={`/n2/listening/${definition.slug}`}>进入{definition.japanese}学习 Hub →</Link>
            </article>
          ))}
        </section>

        <section className="problem-selector-memory" aria-label="問題1和問題2速记符号">
          <div><strong>○</strong><span>已完成，排除</span></div>
          <div><strong>×</strong><span>被否定，删除</span></div>
          <div><strong>→</strong><span>問題1 下一步</span></div>
          <div><strong>★</strong><span>問題2 真正重点</span></div>
        </section>
      </div>
      <PageFooter />
    </main>
  );
}
