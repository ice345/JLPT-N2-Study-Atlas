import Link from "next/link";
import { Breadcrumbs, PageFooter, SiteHeader } from "@/app/components/site-header";

export default function AboutPage() {
  return <main className="app-page privacy-page"><SiteHeader variant="global" /><div className="page-wrap"><Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "关于" }]} /><section className="privacy-hero"><span className="eyebrow">ABOUT · JLPT STUDY GARDEN</span><h1>把资料变成每天<br />真正能完成的学习动作。</h1><p>Study Garden 将语言知识、阅读、听力、分级词汇、诊断、练习与复习安排连接成一个本地优先的学习系统。课程内容来自对长期学习笔记与练习资料的结构化整理。</p></section><section className="privacy-principles"><article><span>01</span><h2>课程</h2><p>每个题型拆成目标明确的短课，但完整说明、例句、陷阱和训练仍然保留。</p></article><article><span>02</span><h2>练习</h2><p>诊断覆盖 N2 的 19 个题型，答错后可以直接回到相关课程并进入统一复习队列。</p></article><article><span>03</span><h2>词汇</h2><p>N1–N5 共用主动回忆结构；例句支持汉字上方显示平假名，帮助学习者准确朗读。</p></article><article><span>04</span><h2>记录</h2><p>匿名学习先保存在浏览器；登录后才同步到云端。课程完成、掌握度和正确率分别计算。</p></article></section><p className="study-unit-resource-link"><Link href="/n2">进入 N2 学习系统 →</Link></p></div><PageFooter /></main>;
}
