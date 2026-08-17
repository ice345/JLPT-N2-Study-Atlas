import Link from "next/link";
import { PageFooter, SiteHeader } from "@/app/components/site-header";
import { N2ActionHome } from "@/app/components/n2-action-home";

const tracks = [
  {
    index: "01",
    title: "语言知识",
    jp: "文字・語彙・文法",
    detail: "問題1–9",
    copy: "从读音、表记和词义，到语法、排序与文章文法，按 40 个能力单元逐步学习。",
    href: "/n2/language",
    status: "40 单元 · 120 练习",
  },
  {
    index: "02",
    title: "阅读",
    jp: "読解",
    detail: "問題10–14",
    copy: "短文、中文、比较、长文与信息检索各有固定读法、代表场景与考场检查。",
    href: "/n2/reading",
    status: "5 套读法 · 完成检查",
  },
  {
    index: "03",
    title: "听力",
    jp: "聴解",
    detail: "問題1–5",
    copy: "按任务、重点、概要、即时应答与综合判断学习信号词、记法和最终决定。",
    href: "/n2/listening",
    status: "26 单元 · 5 个题型",
  },
];

export default function N2Home() {
  return (
    <main className="app-page">
      <SiteHeader />
      <section className="n2-hero page-wrap">
        <div className="n2-mark">
          <span>LEVEL</span>
          <strong>N2</strong>
        </div>
        <div>
          <p className="eyebrow">N2 STUDY MAP · 2010—2025</p>
          <h1>今天学一课，<br />做完就知道下一步。</h1>
          <p className="hero-lead">语言知识、阅读与听力共 19 个题型。你可以先做标准诊断，也可以直接选择最想补强的一条路线。</p>
          <div className="hero-actions">
            <Link className="primary-link" href="/n2/practice">开始 38 题标准诊断</Link>
            <Link className="text-link" href="/n2/dashboard">查看我的学习进度 →</Link>
            <Link className="text-link" href="/n2/plan">看看我是怎样备考的 →</Link>
          </div>
        </div>
        <div className="hero-progress">
          <span>COMPLETE N2 MAP</span>
          <strong>19</strong>
          <p>个题型学习页</p>
          <div><i /><i /><i /><i /></div>
        </div>
      </section>

      <N2ActionHome />

      <section className="coverage-panel page-wrap">
        <div><span>PROBLEM TYPES</span><strong>19</strong><p>语言 9 · 阅读 5 · 听力 5</p></div>
        <div><span>LANGUAGE UNITS</span><strong>40</strong><p>每课含例句、陷阱与微训练</p></div>
        <div><span>LISTENING UNITS</span><strong>26</strong><p>从任务判断到综合理解</p></div>
        <div><span>DIAGNOSTIC BANK</span><strong>57</strong><p>可选快速、标准或深入模式</p></div>
        <p className="coverage-note">建议第一次先做标准诊断；之后每天完成一个薄弱单元、一次主动回忆和一组专项题，学习记录会自动进入复习中心。</p>
      </section>

      <section className="track-section page-wrap">
        <div className="section-heading">
          <div><span>LEARNING ROUTES</span><h2>三条主线，每一课都有明确完成点</h2></div>
          <p>按「先理解判断 → 看例句 → 做微训练 → 评价掌握」前进。</p>
        </div>
        <div className="track-list">
          {tracks.map((track) => (
            <Link className="track-row" href={track.href} key={track.index}>
              <span className="track-index">{track.index}</span>
              <div className="track-title"><small>{track.jp}</small><h3>{track.title}</h3></div>
              <strong>{track.detail}</strong>
              <p>{track.copy}</p>
              <em>{track.status}</em>
              <b>↗</b>
            </Link>
          ))}
        </div>
      </section>

      <section className="quick-study page-wrap">
        <div className="quick-main">
          <span className="eyebrow">QUICK REVIEW</span>
          <h2>15 分钟，也能完成一次闭环。</h2>
          <ol>
            <li><span>03 min</span>回忆 8 个詞语，不会的直接标记</li>
            <li><span>07 min</span>做一组問題4即时回应</li>
            <li><span>05 min</span>复盘“为什么另一个选项不自然”</li>
          </ol>
        </div>
        <div className="quick-links">
          <Link href="/vocabulary"><small>11,568 WORDS · N1–N5</small><strong>分级遮挡回忆词库</strong><span>进入 →</span></Link>
          <Link href="/n2/plan"><small>STUDY STORY</small><strong>我的备考经历</strong><span>阅读与填写 →</span></Link>
          <Link href="/n2/review"><small>TODAY REVIEW</small><strong>继续今日复习</strong><span>开始 →</span></Link>
        </div>
      </section>
      <section className="product-roles page-wrap">
        <div><span>HOW TO USE THIS SITE</span><h2>三个区域，各做一件事。</h2></div>
        <Link href="/n2/plan"><small>01 · EXPERIENCE</small><strong>我的备考经历</strong><p>看真实的起点、取舍和复盘方式，决定你的学习节奏。</p><em>阅读经历 →</em></Link>
        <Link href="/n2/language"><small>02 · LEARN</small><strong>题型与能力课程</strong><p>按题型学习判断模型、例句、易错对比和考场动作。</p><em>进入学习地图 →</em></Link>
        <Link href="/n2/practice"><small>03 · PRACTICE</small><strong>诊断与专项练习</strong><p>找出薄弱能力，完成练习后直接回到对应学习单元。</p><em>开始练习 →</em></Link>
      </section>
      <PageFooter />
    </main>
  );
}
