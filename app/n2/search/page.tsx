import { Breadcrumbs, PageFooter, SiteHeader } from "@/app/components/site-header";
import { SiteSearch } from "@/app/components/site-search";

export default function SearchPage() {
  return <main className="app-page search-page"><SiteHeader /><div className="page-wrap"><Breadcrumbs items={[{ label: "N2", href: "/n2" }, { label: "站内检索" }]} /><SiteSearch /></div><PageFooter /></main>;
}
