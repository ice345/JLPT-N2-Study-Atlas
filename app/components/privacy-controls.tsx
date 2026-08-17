"use client";

import Link from "next/link";
import { useState } from "react";
import { clearLocalStudyData } from "@/app/lib/study-store";

export function PrivacyControls({ signedIn, signInPath }: { signedIn: boolean; signInPath: string }) {
  const [confirmCloud, setConfirmCloud] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  async function clearLocal() {
    setBusy(true);
    setMessage("");
    try {
      await clearLocalStudyData();
      setMessage("此设备上的学习记录已清除。刷新页面后会从空白状态开始。 ");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "本地记录未能清除。");
    } finally {
      setBusy(false);
    }
  }

  async function clearCloudAndLocal() {
    if (!confirmCloud) {
      setConfirmCloud(true);
      setMessage("请再次点击确认：云端学习记录、学习计划和安全保存的 AI 配置都会删除。 ");
      return;
    }
    setBusy(true);
    try {
      const response = await fetch("/api/study/data", { method: "DELETE" });
      const body = await response.json() as { error?: string };
      if (!response.ok) throw new Error(body.error ?? "云端数据未能删除。");
      await clearLocalStudyData();
      setConfirmCloud(false);
      setMessage("云端学习数据和此设备上的本地记录均已删除。其他设备上的离线副本需要在对应设备单独清除。 ");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "云端数据未能删除。");
    } finally {
      setBusy(false);
    }
  }

  return <section className="privacy-controls" aria-labelledby="privacy-controls-title">
    <div>
      <span>DATA CONTROLS</span>
      <h2 id="privacy-controls-title">你的学习记录，由你决定保留多久。</h2>
      <p>清除操作不可撤销。若只想继续匿名学习，可以只清除云端与当前设备，之后不再登录同步。</p>
    </div>
    <div className="privacy-action-grid">
      <article>
        <span>当前设备</span>
        <h3>清除本地学习记录</h3>
        <p>删除练习场次、作答事件、复习间隔、学习目标与同步游标，不影响云端副本。</p>
        <button disabled={busy} type="button" onClick={clearLocal}>{busy ? "处理中…" : "清除当前设备"}</button>
      </article>
      <article>
        <span>登录同步</span>
        <h3>删除云端学习数据</h3>
        <p>同时删除云端事件、练习、计划、安全保存的 AI 配置与当前设备副本；不会删除 ChatGPT 账号。</p>
        {signedIn
          ? <button className={confirmCloud ? "danger" : ""} disabled={busy} type="button" onClick={clearCloudAndLocal}>{confirmCloud ? "再次点击，确认永久删除" : "删除云端与当前设备数据"}</button>
          : <Link href={signInPath}>登录后管理云端数据 →</Link>}
      </article>
    </div>
    {message && <p className="practice-sync-message" role="status">{message}</p>}
  </section>;
}
