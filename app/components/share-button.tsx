"use client";

import { useState } from "react";

export function ShareButton({ title, text }: { title: string; text: string }) {
  const [done, setDone] = useState(false);

  async function share() {
    const data = { title, text, url: window.location.href };
    try {
      if (navigator.share) await navigator.share(data);
      else await navigator.clipboard.writeText(`${text}\n${window.location.href}`);
      setDone(true);
      window.setTimeout(() => setDone(false), 1800);
    } catch {
      // A dismissed native share sheet should not show an error state.
    }
  }

  return <button className="share-button" type="button" onClick={share}>{done ? "已复制链接" : "分享此页"}</button>;
}
