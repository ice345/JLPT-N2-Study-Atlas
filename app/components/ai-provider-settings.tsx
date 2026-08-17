"use client";

import { useEffect, useState } from "react";

export type PersonalAiProvider = {
  provider: "openai" | "custom";
  apiKey: string;
  endpoint: string;
  model: string;
  credentialId: string;
};

type SavedCredential = {
  id: string;
  provider: "openai" | "custom";
  endpoint: string;
  model: string;
  maskedKey: string;
  updatedAt: string;
};

export const emptyPersonalAiProvider: PersonalAiProvider = {
  provider: "openai",
  apiKey: "",
  endpoint: "",
  model: "",
  credentialId: "",
};

export function AiProviderSettings({
  value,
  onChange,
  signedIn,
}: {
  value: PersonalAiProvider;
  onChange: (next: PersonalAiProvider) => void;
  signedIn: boolean;
}) {
  const [saved, setSaved] = useState<SavedCredential | null>(null);
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    fetch("/api/study/ai-credentials")
      .then(async (response) => response.ok ? response.json() as Promise<{ credential: SavedCredential | null }> : null)
      .then((body) => {
        if (!active || !body?.credential) return;
        setSaved(body.credential);
        onChange({
          provider: body.credential.provider,
          apiKey: "",
          endpoint: body.credential.provider === "custom" ? body.credential.endpoint : "",
          model: body.credential.model,
          credentialId: body.credential.id,
        });
      })
      .catch(() => undefined);
    return () => { active = false; };
  }, [onChange, signedIn]);

  function change(next: Partial<PersonalAiProvider>) {
    onChange({ ...value, ...next, credentialId: next.credentialId ?? "" });
    setMessage("");
  }

  async function saveSecurely() {
    if (!value.apiKey) {
      setMessage("请先填写 API Key。已有安全保存配置时，无需再次保存。 ");
      return;
    }
    setSaving(true);
    setMessage("");
    try {
      const response = await fetch("/api/study/ai-credentials", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(value),
      });
      const body = await response.json() as { credential?: SavedCredential; error?: string };
      if (!response.ok || !body.credential) throw new Error(body.error ?? "安全保存失败。");
      setSaved(body.credential);
      onChange({ ...value, apiKey: "", credentialId: body.credential.id });
      setMessage(`已安全保存 ${body.credential.maskedKey}；浏览器不会取回明文密钥。`);
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "安全保存失败。");
    } finally {
      setSaving(false);
    }
  }

  async function removeSaved() {
    setSaving(true);
    try {
      const response = await fetch("/api/study/ai-credentials", { method: "DELETE" });
      if (!response.ok) throw new Error("删除失败。");
      setSaved(null);
      onChange({ ...value, credentialId: "" });
      setMessage("已删除安全保存的 AI 配置。 ");
    } catch (reason) {
      setMessage(reason instanceof Error ? reason.message : "删除失败。");
    } finally {
      setSaving(false);
    }
  }

  return <details className="ai-provider-settings">
    <summary>AI 学习计划（可选）</summary>
    <p>规则诊断无需 AI。若使用个人密钥，可选择“仅使用一次”：密钥只在当前页面内存与本次请求中存在。登录后也可选择加密保存，浏览器只会看到末四位。</p>
    <div className="ai-provider-choice" role="group" aria-label="选择 AI 提供商">
      <button className={value.provider === "openai" ? "active" : ""} type="button" onClick={() => change({ provider: "openai", endpoint: "" })}>OpenAI</button>
    </div>
    {saved && value.credentialId && (
      <div className="ai-saved-credential">
        <div><span>正在使用安全保存配置</span><strong>{saved.maskedKey} · {saved.model}</strong></div>
        <button disabled={saving} type="button" onClick={removeSaved}>删除</button>
      </div>
    )}
    <label>API Key<input autoComplete="off" onChange={(event) => change({ apiKey: event.target.value })} placeholder={saved ? "填写新密钥会替换已保存配置" : "仅在当前页面内存中保留"} type="password" value={value.apiKey} /></label>
    <details className="ai-provider-advanced" open={value.provider === "custom"}>
      <summary>高级设置 · 自定义兼容提供商</summary>
      <p>仅用于支持 Responses API 与严格 JSON Schema 的公开 HTTPS 服务；服务器仍会拦截本机、内网与重定向地址。</p>
      <button className={value.provider === "custom" ? "active" : ""} type="button" onClick={() => change({ provider: value.provider === "custom" ? "openai" : "custom", endpoint: value.provider === "custom" ? "" : value.endpoint })}>{value.provider === "custom" ? "改回 OpenAI" : "启用兼容提供商"}</button>
      {value.provider === "custom" && <label>兼容 Responses API 的公开 HTTPS 地址<input autoComplete="off" inputMode="url" onChange={(event) => change({ endpoint: event.target.value })} placeholder="https://provider.example/v1/responses" type="url" value={value.endpoint} /></label>}
    </details>
    <label>模型名{value.provider === "openai" ? "（可选）" : ""}<input autoComplete="off" onChange={(event) => change({ model: event.target.value })} placeholder={value.provider === "openai" ? "默认使用站点推荐模型" : "填写提供商支持的模型名"} value={value.model} /></label>
    <div className="ai-provider-actions">
      <button type="button" onClick={() => { onChange(emptyPersonalAiProvider); setMessage("已清除此页中的密钥；之后仍可继续使用规则计划。"); }}>清除此页密钥</button>
      {signedIn ? <button disabled={saving || !value.apiKey} type="button" onClick={saveSecurely}>{saving ? "保存中…" : "AES-256-GCM 安全保存"}</button> : <span>当前为“仅使用一次”。登录后才可加密保存。</span>}
    </div>
    {message && <p className="practice-sync-message" role="status">{message}</p>}
  </details>;
}
