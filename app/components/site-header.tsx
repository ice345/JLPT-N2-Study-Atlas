"use client";

import Link from "next/link";
import { useState } from "react";

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const links = [
    ["学习地图", "/n2"], ["练习台", "/n2/practice"], ["今日复习", "/n2/review"], ["学习进度", "/n2/dashboard"], ["语言知识", "/n2/language"], ["阅读", "/n2/reading"], ["听力", "/n2/listening"], ["分级词库", "/n2/vocabulary"], ["我的经历", "/n2/plan"], ["资料索引", "/n2/resources"], ["检索", "/n2/search"],
  ];
  return (
    <header className="site-header">
      <Link className="wordmark" href="/">
        <span className="wordmark-dot" />
        JLPT <em>Study Garden</em>
      </Link>
      <button className="menu-toggle" type="button" onClick={() => setOpen((value) => !value)} aria-expanded={open} aria-controls="site-navigation">{open ? "关闭" : "菜单"}</button>
      <nav className={open ? "main-nav is-open" : "main-nav"} id="site-navigation" aria-label="主导航">
        {links.map(([label, href]) => <Link href={href} key={href} onClick={() => setOpen(false)}>{label}</Link>)}
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
