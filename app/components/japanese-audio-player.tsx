"use client";

import { useEffect, useId, useRef, useState } from "react";

type PlaybackState = "idle" | "loading" | "playing" | "paused" | "error";

export type JapaneseAudioPlayerProps = {
  src?: string | null;
  text: string;
  label?: string;
  duration?: number | null;
  allowSystemFallback?: boolean;
  compact?: boolean;
};

function formatDuration(duration?: number | null) {
  if (!duration) return "--:--";
  const minutes = Math.floor(duration / 60);
  const seconds = Math.round(duration % 60).toString().padStart(2, "0");
  return `${minutes}:${seconds}`;
}

export function JapaneseAudioPlayer({
  src,
  text,
  label = "播放日语",
  duration,
  allowSystemFallback = true,
  compact = false,
}: JapaneseAudioPlayerProps) {
  const instanceId = useId();
  const audioRef = useRef<HTMLAudioElement>(null);
  const [state, setState] = useState<PlaybackState>("idle");
  const [rate, setRate] = useState<0.8 | 1>(1);
  const [assetFailed, setAssetFailed] = useState(false);
  const [usingSystemVoice, setUsingSystemVoice] = useState(false);

  useEffect(() => {
    const pauseOtherPlayers = (event: Event) => {
      const customEvent = event as CustomEvent<string>;
      if (customEvent.detail === instanceId) return;
      if (usingSystemVoice) window.speechSynthesis.cancel();
      audioRef.current?.pause();
      if (state === "playing") setState("paused");
    };
    window.addEventListener("jlpt-audio-play", pauseOtherPlayers);
    return () => window.removeEventListener("jlpt-audio-play", pauseOtherPlayers);
  }, [instanceId, state, usingSystemVoice]);

  function speakWithSystemVoice() {
    if (!("speechSynthesis" in window)) {
      setState("error");
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ja-JP";
    utterance.rate = rate;
    utterance.onstart = () => setState("playing");
    utterance.onend = () => setState("idle");
    utterance.onerror = () => setState("error");
    setUsingSystemVoice(true);
    window.dispatchEvent(new CustomEvent("jlpt-audio-play", { detail: instanceId }));
    window.speechSynthesis.speak(utterance);
  }

  async function togglePlayback() {
    const audio = audioRef.current;
    if (state === "playing") {
      if (usingSystemVoice) window.speechSynthesis.pause();
      else audio?.pause();
      setState("paused");
      return;
    }
    if (usingSystemVoice && state === "paused") {
      window.dispatchEvent(new CustomEvent("jlpt-audio-play", { detail: instanceId }));
      window.speechSynthesis.resume();
      setState("playing");
      return;
    }
    if (!src || assetFailed) {
      if (allowSystemFallback) speakWithSystemVoice();
      else setState("error");
      return;
    }
    if (!audio) return;
    setState("loading");
    audio.playbackRate = rate;
    window.dispatchEvent(new CustomEvent("jlpt-audio-play", { detail: instanceId }));
    try {
      await audio.play();
    } catch {
      setAssetFailed(true);
      setState("error");
    }
  }

  async function replay() {
    if (usingSystemVoice || !src || assetFailed) {
      speakWithSystemVoice();
      return;
    }
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = 0;
    audio.playbackRate = rate;
    setState("loading");
    window.dispatchEvent(new CustomEvent("jlpt-audio-play", { detail: instanceId }));
    try {
      await audio.play();
    } catch {
      setAssetFailed(true);
      setState("error");
    }
  }

  function changeRate(nextRate: 0.8 | 1) {
    setRate(nextRate);
    if (audioRef.current) audioRef.current.playbackRate = nextRate;
  }

  const stateLabel = usingSystemVoice
    ? "系统语音"
    : state === "loading"
      ? "载入中"
      : state === "playing"
        ? "播放中"
        : state === "paused"
          ? "已暂停"
          : state === "error"
            ? "音频不可用"
            : "Aivis 课程音频";

  return (
    <div className={`japanese-audio-player ${compact ? "is-compact" : ""} ${state === "playing" ? "is-playing" : ""}`}>
      {src && (
        <audio
          onCanPlay={() => state === "loading" && setState("paused")}
          onEnded={() => setState("idle")}
          onError={() => { setAssetFailed(true); setState("error"); }}
          onPause={() => state === "playing" && setState("paused")}
          onPlay={() => { setUsingSystemVoice(false); setState("playing"); }}
          preload="metadata"
          ref={audioRef}
          src={src}
        />
      )}
      <button
        className="audio-primary-control"
        type="button"
        onClick={togglePlayback}
        aria-label={`${state === "playing" ? "暂停" : label}：${text}`}
      >
        <span aria-hidden="true">{state === "playing" ? "Ⅱ" : "▶"}</span>
        {state === "playing" ? "暂停" : state === "loading" ? "载入" : label}
      </button>
      <button className="audio-replay-control" type="button" onClick={replay} aria-label={`重新播放：${text}`}>↺ <span>重播</span></button>
      <div className="audio-rate-controls" aria-label="播放速度">
        {([0.8, 1] as const).map((value) => (
          <button className={rate === value ? "active" : ""} key={value} onClick={() => changeRate(value)} type="button" aria-pressed={rate === value}>{value.toFixed(1)}×</button>
        ))}
      </div>
      <span className={`audio-source-state ${usingSystemVoice ? "is-fallback" : ""}`}>{stateLabel}</span>
      <time>{formatDuration(duration)}</time>
    </div>
  );
}
