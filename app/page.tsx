import Link from "next/link";
import { SiteHeader } from "./components/site-header";

const levels = [
  { level: "N1", className: "level-n1", href: "/n2/vocabulary?level=N1", label: "词汇开放" },
  { level: "N2", className: "level-n2", active: true },
  { level: "N3", className: "level-n3", href: "/n2/vocabulary?level=N3", label: "词汇开放" },
  { level: "N4", className: "level-n4", href: "/n2/vocabulary?level=N4", label: "词汇开放" },
  { level: "N5", className: "level-n5", href: "/n2/vocabulary?level=N5", label: "词汇开放" },
];

export default function Home() {
  return (
    <main className="home-page">
      <SiteHeader />
      <section className="bubble-landing">
        <div className="staff staff-one" />
        <div className="staff staff-two" />
        <div className="landing-copy">
          <span className="kicker">日本語能力試験 · Study Garden</span>
          <h1>
            今天先完成一小步，
            <br />N2 就会有清晰的下一步。
          </h1>
          <p>从一个学习单元开始，做几道题、留下掌握判断，明天按复习队列继续。</p>
          <Link className="primary-link" href="/n2">
            进入 N2 学习地图 <span>↗</span>
          </Link>
        </div>
        <div className="level-orbit" aria-label="JLPT 级别入口">
          <div className="orbit-line orbit-a" />
          <div className="orbit-line orbit-b" />
          <div className="center-bubble">
            <small>日本語能力試験</small>
            <strong>JLPT</strong>
            <em>Study Garden</em>
          </div>
          {levels.map((item) =>
            item.active ? (
              <Link className={`level-bubble ${item.className} active`} href="/n2" key={item.level}>
                <strong>{item.level}</strong>
                <span>开始学习</span>
              </Link>
            ) : item.href ? (
              <Link className={`level-bubble ${item.className}`} href={item.href} key={item.level}>
                <strong>{item.level}</strong>
                <span>{item.label}</span>
              </Link>
            ) : (
              <div className={`level-bubble ${item.className}`} key={item.level}>
                <strong>{item.level}</strong>
                <span>准备中</span>
              </div>
            ),
          )}
        </div>
        <div className="landing-note">
          <span>15</span>
          <p>分钟就能完成一次“学习 → 练习 → 复习安排”。</p>
        </div>
      </section>
    </main>
  );
}
