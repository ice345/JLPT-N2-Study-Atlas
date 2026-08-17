"use client";

import Link from "next/link";
import { useState } from "react";

export function SiteHeader({ variant = "n2" }: { variant?: "global" | "n2" }) {
  const [open, setOpen] = useState(false);
  const [group, setGroup] = useState<"study" | "more" | null>(null);
  const globalLinks = [["首页", "/"], ["JLPT 等级", "/#jlpt-levels"], ["N2 学习系统", "/n2"], ["N1–N5 词库", "/vocabulary"], ["关于", "/about"], ["隐私", "/privacy"]];
  return (
    <header className="site-header">
      <Link className="wordmark" href="/">
        <span className="wordmark-dot" />
        JLPT <em>Study Garden</em>
      </Link>
      <button className="menu-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="site-navigation">{open ? "关闭" : "菜单"}</button>
      <nav className={open ? "main-nav is-open" : "main-nav"} id="site-navigation" aria-label={variant === "global" ? "全站导航" : "N2 学习导航"}>
        {variant === "global" ? globalLinks.map(([label, href]) => <Link href={href} key={href} onClick={() => setOpen(false)}>{label}</Link>) : <>
          <Link href="/n2" onClick={() => setOpen(false)}>学习地图</Link>
          <div className="nav-group"><button aria-expanded={group === "study"} onClick={() => setGroup((value) => value === "study" ? null : "study")} type="button">学习⌄</button><div className={group === "study" ? "nav-popover is-open" : "nav-popover"}><Link href="/n2/language" onClick={() => setOpen(false)}>语言知识</Link><Link href="/n2/reading" onClick={() => setOpen(false)}>阅读</Link><Link href="/n2/listening" onClick={() => setOpen(false)}>听力</Link></div></div>
          <Link href="/n2/practice" onClick={() => setOpen(false)}>练习台</Link>
          <Link href="/n2/review" onClick={() => setOpen(false)}>今日复习</Link>
          <Link href="/n2/dashboard" onClick={() => setOpen(false)}>学习进度</Link>
          <Link href="/vocabulary" onClick={() => setOpen(false)}>分级词库</Link>
          <div className="nav-group"><button aria-expanded={group === "more"} onClick={() => setGroup((value) => value === "more" ? null : "more")} type="button">更多⌄</button><div className={group === "more" ? "nav-popover is-open" : "nav-popover"}><Link href="/n2/plan" onClick={() => setOpen(false)}>备考经历</Link><Link href="/n2/resources" onClick={() => setOpen(false)}>资料索引</Link><Link href="/n2/search" onClick={() => setOpen(false)}>站内检索</Link></div></div>
        </>}
      </nav>
    </header>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return (
    <nav className="breadcrumbs" aria-label="面包屑">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`}>
          {index > 0 && <i>/</i>}
          {item.href ? <Link href={item.href}>{item.label}</Link> : item.label}
        </span>
      ))}
    </nav>
  );
}

export function PageFooter() {
  return (
    <footer className="page-footer">
      <span>JLPT Study Garden</span>
      <p>不登录也能完整学习；本地记录保存在当前设备，登录后可选择跨设备同步。 <Link href="/privacy">隐私与数据</Link></p>
    </footer>
  );
}
