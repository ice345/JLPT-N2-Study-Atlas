import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs, PageFooter, SiteHeader } from "@/app/components/site-header";
import { ReadingMastery } from "@/app/components/reading-mastery";
import { getReadingModule, readingModules } from "@/app/data/reading-content";

export function generateStaticParams() {
  return readingModules.map((module) => ({ slug: module.slug }));
}

export default async function ReadingDetail({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const lesson = getReadingModule(slug);
  if (!lesson) notFound();

  const index = readingModules.findIndex((item) => item.slug === slug);
  const previous = readingModules[index - 1];
  const next = readingModules[index + 1];

  return (
    <main className="app-page reading-detail-page">
      <SiteHeader />
      <div className="page-wrap lesson-wrap">
        <Breadcrumbs items={[{ label: "N2", href: "/n2" }, { label: "阅读", href: "/n2/reading" }, { label: `問題${lesson.number}` }]} />

        <section className="content-detail-hero reading-detail-hero">
          <div className="content-detail-badge"><span>問題</span><strong>{lesson.number}</strong></div>
          <div>
            <p className="eyebrow">読解 · {lesson.japanese}</p>
            <h1>{lesson.title}</h1>
            <p>{lesson.lead}</p>
          </div>
        </section>

        <section className="metric-strip content-metrics">
          {lesson.metrics.map((metric) => <div key={metric.label}><strong>{metric.value}</strong><span>{metric.label}</span></div>)}
        </section>

        <nav className="reading-section-map" aria-label="本页学习步骤">
            <span>本页学习步骤</span>
            <a href="#flow">解题顺序</a>
            <a href="#models">题型模型</a>
            <a href="#evidence">代表场景</a>
            <a href="#traps">易错陷阱</a>
            <a href="#check">考场检查</a>
        </nav>

          <div className="lesson-content reading-lesson-content">
            <section className="lesson-section" id="flow">
              <div className="content-heading"><span>01</span><div><small>READING FLOW</small><h2>固定顺序</h2></div></div>
              <ol className="decision-flow reading-flow">
                {lesson.flow.map((step, stepIndex) => <li key={step}><span>{String(stepIndex + 1).padStart(2, "0")}</span><p>{step}</p></li>)}
              </ol>
            </section>

            <section className="lesson-section" id="models">
              <div className="content-heading"><span>02</span><div><small>QUESTION MODELS</small><h2>看到这些信号，就执行对应动作</h2></div></div>
              <div className="signal-grid">
                {lesson.models.map((model, modelIndex) => (
                  <article key={model.title}>
                    <span>{String(modelIndex + 1).padStart(2, "0")}</span>
                    <h3>{model.title}</h3>
                    <strong>{model.signal}</strong>
                    <p>{model.action}</p>
                  </article>
                ))}
              </div>
            </section>

            <section className="lesson-section" id="evidence">
              <div className="content-heading"><span>03</span><div><small>REPRESENTATIVE PATTERNS</small><h2>典型场景如何体现这个判断</h2></div></div>
              <p className="section-context">先看设问焦点，再观察应该保留哪一层信息；不要背场景表面词汇。</p>
              <div className="evidence-table">
                <div className="evidence-head"><strong>来源场景</strong><strong>设问焦点</strong><strong>应该留下的判断</strong></div>
                {lesson.evidence.map((item) => <div className="evidence-row" key={`${item.case}-${item.question}`}><strong>{item.case}</strong><span>{item.question}</span><p>{item.takeaway}</p></div>)}
              </div>
            </section>

            <section className="lesson-section" id="traps">
              <div className="content-heading"><span>04</span><div><small>TRAP CONTRAST</small><h2>错误读法与正确动作</h2></div></div>
              <div className="confusion-grid reading-traps">
                {lesson.traps.map((trap, trapIndex) => (
                  <article key={trap.title}>
                    <span>TRAP {String(trapIndex + 1).padStart(2, "0")}</span>
                    <h3>{trap.title}</h3>
                    <div className="wrong-line"><i>×</i><strong>{trap.wrong}</strong></div>
                    <div className="correct-line"><i>○</i><strong>{trap.correct}</strong></div>
                  </article>
                ))}
              </div>
            </section>

            <section className="lesson-section" id="check">
              <div className="content-heading"><span>05</span><div><small>FINAL CHECK</small><h2>交卷前 20 秒检查</h2></div></div>
              <div className="checklist-grid">
                {lesson.checklist.map((item, itemIndex) => <div key={item}><span>{String(itemIndex + 1).padStart(2, "0")}</span><strong>{item}</strong></div>)}
              </div>
            </section>

            <ReadingMastery slug={lesson.slug} title={`問題${lesson.number} · ${lesson.japanese}`} />

            <p className="study-unit-resource-link"><Link href="/n2/resources">资料与内容说明 →</Link></p>
          </div>

        <nav className="lesson-pagination">
          {previous ? <Link href={`/n2/reading/${previous.slug}`}><span>← 上一题</span><strong>問題{previous.number} · {previous.japanese}</strong></Link> : <Link href="/n2/reading"><span>← 返回</span><strong>阅读总览</strong></Link>}
          {next ? <Link href={`/n2/reading/${next.slug}`}><span>下一题 →</span><strong>問題{next.number} · {next.japanese}</strong></Link> : <Link href="/n2/listening"><span>下一部分 →</span><strong>进入听力</strong></Link>}
        </nav>
      </div>
      <PageFooter />
    </main>
  );
}
