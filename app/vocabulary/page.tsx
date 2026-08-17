import type { Metadata } from "next";
import { Breadcrumbs, PageFooter, SiteHeader } from "@/app/components/site-header";
import { VocabLab } from "@/app/components/vocab-lab";
import { parseVocabularyLevel, queryVocabulary, vocabularyMetadata } from "@/app/lib/vocabulary-catalog";

export const metadata: Metadata = {
  title: "N1–N5 分级回忆词库",
  description: "11,568 个 JLPT N1–N5 词条，支持遮挡回忆、例句、平假名标注与设备本地学习记录。",
};

function formatCount(value: number) {
  return new Intl.NumberFormat("zh-CN").format(value);
}

export default async function VocabularyPage({ searchParams }: { searchParams: Promise<{ level?: string }> }) {
  const { level } = await searchParams;
  const initialLevel = parseVocabularyLevel(level);
  const initialResult = queryVocabulary({ level: initialLevel });
  const exampleSentenceCount = Object.values(vocabularyMetadata.levels).reduce((sum, item) => sum + item.exampleSentences, 0);
  return <main className="app-page vocab-page">
    <SiteHeader variant="global" />
    <div className="page-wrap">
      <Breadcrumbs items={[{ label: "首页", href: "/" }, { label: "N1–N5 分级词库" }]} />
      <section className="vocab-hero"><div><span className="eyebrow">ACTIVE RECALL · N1—N5</span><h1>先从脑中叫出来，<br />再放进句子里记住。</h1><p>五个等级共用同一套遮挡回忆体验：可按假名分类、双向回忆、搜索例句，并在每次确认后留下“不会 / 模糊 / 会了”的本地记录。</p></div><aside><strong>{formatCount(vocabularyMetadata.total)}</strong><span>个可学习词条 · N1–N5</span><p>{formatCount(exampleSentenceCount)} 个日中对照例句；例句中的汉字可显示平假名读音。</p></aside></section>
      <VocabLab initialLevel={initialLevel} initialResult={initialResult} metadata={vocabularyMetadata} />
      <section className="source-box vocab-source-box"><div><span>LEVEL MAP · CHOOSE YOUR RANGE</span><h2>按当前目标选等级，不需要一次背完。</h2><p>每次随机抽 18 词，先回忆再揭晓；不熟悉的词会进入复习队列。准备 N2 时可以主学 N2，并用 N3、N4 检查基础词汇。</p></div><ul><li>N1 词库 — 4,044 条</li><li>N2 词库 — 4,142 条</li><li>N3 词库 — 1,818 条</li><li>N4 词库 — 757 条</li><li>N5 词库 — 807 条</li></ul></section>
    </div>
    <PageFooter />
  </main>;
}
