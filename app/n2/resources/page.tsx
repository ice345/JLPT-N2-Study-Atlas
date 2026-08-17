import { Breadcrumbs, PageFooter, SiteHeader } from "@/app/components/site-header";
import { ResourceExplorer } from "@/app/components/resource-explorer";

export default function ResourcesPage() {
  return (
    <main className="app-page resources-page"><SiteHeader /><div className="page-wrap"><Breadcrumbs items={[{ label: "N2", href: "/n2" }, { label: "资料索引" }]} /><section className="resource-hero"><div><span className="eyebrow">SOURCE LIBRARY · LOCAL INDEX</span><h1>来源在旁边，<br />但不打断学习。</h1><p>这里记录 Markdown、Typst、PDF、HTML 与真题文件的关系。真题和听力原文只展示元信息，不在站点公开复制全文。</p></div><div className="resource-counts"><span><strong>213</strong>索引资源</span><span><strong>29</strong>真题 PDF</span><span><strong>31</strong>听力原文</span></div></section><ResourceExplorer /></div><PageFooter /></main>
  );
}
