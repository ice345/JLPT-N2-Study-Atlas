import Link from "next/link";
import { Breadcrumbs, PageFooter, SiteHeader } from "@/app/components/site-header";

const reading = [
  ["10", "内容理解・短文", "先看设问，再定位判断依据", "5类文本模型"],
  ["11", "内容理解・中文", "给每段标注功能，不逐句翻译", "6类设问模型"],
  ["12", "統合理解", "把两篇材料的共同点与差异表格化", "A／B比较矩阵"],
  ["13", "主張理解・長文", "追踪作者态度变化与最终主张", "5节点论证地图"],
  ["14", "情報検索", "先列条件，再扫描数字、对象与时间", "6类检索条件"],
];

export default function ReadingPage() {
  return (
    <main className="app-page reading-page"><SiteHeader /><div className="page-wrap"><Breadcrumbs items={[{ label: "N2", href: "/n2" }, { label: "阅读" }]} /><section className="section-hero reading-hero"><div><span className="eyebrow">読解 · STRUCTURE FIRST</span><h1>五个阅读题型，<br />五种稳定读法。</h1></div><p>从短文定位、中文段落功能，到双文比较、长文论证与信息检索。每页只训练一个清晰目标，完成后标记掌握状态。</p><div className="hero-stats"><span><strong>5</strong>题型</span><span><strong>26</strong>判断模型</span><span><strong>5</strong>完成检查表</span></div><div className="reading-line" /></section><section className="reading-list">{reading.map((item) => <Link href={`/n2/reading/q${item[0]}`} key={item[0]}><span>問題 {item[0]}</span><h2>{item[1]}</h2><p>{item[2]}</p><em>{item[3]}</em></Link>)}</section><section className="reading-method"><span>READING LOOP</span><h2>设问 → 段落功能 → 答案依据 → 错项原因</h2><p>先从問題10建立定位习惯，再按顺序练到信息检索。</p><Link className="primary-link" href="/n2/reading/q10">从問題10开始 →</Link></section></div><PageFooter /></main>
  );
}
