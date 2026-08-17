import Link from "next/link";
import { Breadcrumbs, PageFooter, SiteHeader } from "@/app/components/site-header";
import { languageModules, similarWordGroups } from "@/app/data/content";
import { languageProblemDefinitions } from "@/app/data/language-course";

export default function LanguageIndex() {
  return (
    <main className="app-page">
      <SiteHeader />
      <div className="page-wrap">
        <Breadcrumbs items={[{ label: "N2", href: "/n2" }, { label: "语言知识" }]} />
        <section className="section-hero language-hero">
          <div><span className="eyebrow">文字・語彙・文法</span><h1>問題1–9<br />学习路线</h1></div>
          <p>从读音、表记和构词开始，逐步进入语境词汇、用法、文法、排序与文章语法。每次只完成一个短单元，随后立刻练习。</p>
          <div className="hero-stats"><span><strong>9</strong>个题型</span><span><strong>{languageProblemDefinitions.reduce((total, item) => total + item.units.length, 0)}</strong>个短单元</span><span><strong>{languageProblemDefinitions.reduce((total, item) => total + item.practice.cardCount, 0)}</strong>道单元练习</span></div>
        </section>

        <section className="module-grid">
          {languageModules.map((module) => (
            <Link className={`module-card accent-${module.accent}`} href={`/n2/language/${module.slug}`} key={module.slug}>
              <div><span>{module.number}</span><em>{module.japanese}</em></div>
              <h2>{module.title}</h2>
              <p>{module.description}</p>
              <footer><span>{languageProblemDefinitions.find((item) => item.slug === module.slug)?.units.length} 个学习单元 · 含练习</span><b>进入学习路线 ↗</b></footer>
            </Link>
          ))}
        </section>

        <section className="similar-preview">
          <div className="section-heading light">
            <div><span>QUICK COMPARISON</span><h2>相近词要成组比较</h2></div>
            <p>先区分方向和搭配，再回到对应题型练习。</p>
          </div>
          <div className="similar-columns">
            {similarWordGroups.map((group) => (
              <article key={group.title}>
                <span>{group.hint}</span><h3>{group.title}</h3>
                {group.items.slice(0, 4).map((item) => (
                  <div key={item[0]}><strong>{item[0]}</strong><p>{item[1]}</p></div>
                ))}
              </article>
            ))}
          </div>
        </section>
      </div>
      <PageFooter />
    </main>
  );
}
