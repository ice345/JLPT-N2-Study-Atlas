"use client";

import { useEffect, useMemo, useState } from "react";
import { JapaneseAudioPlayer } from "@/app/components/japanese-audio-player";
import { JapaneseReading } from "@/app/components/japanese-reading";

export type BenchmarkAsset = {
  src: string;
  duration: number | null;
};

export type BenchmarkSample = {
  id: string;
  label: string;
  displayText: string;
  ttsText: string;
  checks: string[];
  asset?: BenchmarkAsset;
};

export type BenchmarkCandidate = {
  key: string;
  label: string;
  gender: "female" | "male";
  genderLabel: string;
  impression: string;
  styleName: string;
  modelVersion: string;
  modelSizeMb: number;
  modelPage: string;
  license: string;
  licenseUrl: string;
  samples: BenchmarkSample[];
};

type VoiceDecision = "favorite" | "keep" | "reject" | null;
type VoiceReview = {
  naturalness: number;
  clarity: number;
  neutrality: number;
  decision: VoiceDecision;
  notes: string;
};

const emptyReview: VoiceReview = { naturalness: 0, clarity: 0, neutrality: 0, decision: null, notes: "" };
const storageKey = "jlpt-audio-benchmark-v1";

function ScoreButtons({ label, value, disabled, onChange }: { label: string; value: number; disabled: boolean; onChange: (value: number) => void }) {
  return (
    <div className="voice-score-row">
      <span>{label}</span>
      <div>
        {[1, 2, 3, 4, 5].map((score) => (
          <button key={score} className={value === score ? "active" : ""} disabled={disabled} type="button" onClick={() => onChange(value === score ? 0 : score)} aria-label={`${label} ${score} 分`} aria-pressed={value === score}>{score}</button>
        ))}
      </div>
    </div>
  );
}

export function AudioBenchmarkLab({ candidates }: { candidates: BenchmarkCandidate[] }) {
  const [gender, setGender] = useState<"all" | "female" | "male">("all");
  const [reviews, setReviews] = useState<Record<string, VoiceReview>>({});
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const stored = window.localStorage.getItem(storageKey);
        if (stored) {
          const persisted = JSON.parse(stored) as Record<string, VoiceReview>;
          setReviews(persisted);
        }
      } catch {
        // Benchmark playback remains available if local storage is restricted.
      } finally {
        setLoaded(true);
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      window.localStorage.setItem(storageKey, JSON.stringify(reviews));
    } catch {
      // Keep the in-memory review for this session.
    }
  }, [loaded, reviews]);

  function updateReview(key: string, patch: Partial<VoiceReview>) {
    setReviews((current) => {
      return { ...current, [key]: { ...emptyReview, ...current[key], ...patch } };
    });
  }

  const visibleCandidates = useMemo(
    () => candidates.filter((candidate) => gender === "all" || candidate.gender === gender),
    [candidates, gender],
  );
  const reviewedCount = Object.values(reviews).filter((review) => review.naturalness || review.clarity || review.neutrality || review.notes || review.decision).length;

  return (
    <section className="audio-benchmark-shell">
      <div className="audio-benchmark-toolbar">
        <div className="audio-gender-filter" aria-label="候选声音筛选">
          <span>VOICE SET</span>
          <button className={gender === "all" ? "active" : ""} onClick={() => setGender("all")} type="button">全部 <b>6</b></button>
          <button className={gender === "female" ? "active" : ""} onClick={() => setGender("female")} type="button">女声 <b>3</b></button>
          <button className={gender === "male" ? "active" : ""} onClick={() => setGender("male")} type="button">男声 <b>3</b></button>
        </div>
        <p><strong>{loaded ? reviewedCount : 0} / 6</strong> 已留下试听记录。所有候选使用相同三句话与相同生成参数。</p>
      </div>

      <div className="audio-compare-guide">
        <span>试听顺序</span>
        <ol>
          <li><b>01</b>先听 1.0× 的问句语调</li>
          <li><b>02</b>再听正式长句的切分</li>
          <li><b>03</b>用 0.8× 检查汉字读音</li>
          <li><b>04</b>记录自然度、清晰度与中性度</li>
        </ol>
      </div>

      <div className="voice-candidate-list">
        {visibleCandidates.map((candidate) => {
          const review = { ...emptyReview, ...reviews[candidate.key] };
          const sequence = candidates.findIndex((item) => item.key === candidate.key) + 1;
          return (
            <article className={`voice-candidate-card gender-${candidate.gender}`} key={candidate.key}>
              <header>
                <div className="voice-candidate-number">{String(sequence).padStart(2, "0")}</div>
                <div>
                  <span>{candidate.genderLabel} · {candidate.styleName}</span>
                  <h2>{candidate.label}</h2>
                  <p>{candidate.impression}</p>
                </div>
                <dl>
                  <div><dt>MODEL</dt><dd>v{candidate.modelVersion}</dd></div>
                  <div><dt>SIZE</dt><dd>{candidate.modelSizeMb.toFixed(2)} MB</dd></div>
                  <div><dt>LICENSE</dt><dd><a href={candidate.licenseUrl} target="_blank" rel="noreferrer">{candidate.license} ↗</a></dd></div>
                </dl>
                <a className="voice-source-link" href={candidate.modelPage} target="_blank" rel="noreferrer">AivisHub 模型页 ↗</a>
              </header>

              <div className="voice-sample-stack">
                {candidate.samples.map((sample, sampleIndex) => (
                  <section className="voice-sample-row" key={sample.id}>
                    <div className="voice-sample-copy">
                      <span>{String(sampleIndex + 1).padStart(2, "0")} · {sample.label}</span>
                      <p lang="ja"><JapaneseReading text={sample.displayText} /></p>
                      <small>检查：{sample.checks.join(" / ")}</small>
                    </div>
                    <JapaneseAudioPlayer
                      compact
                      src={sample.asset?.src}
                      duration={sample.asset?.duration}
                      text={sample.ttsText}
                      label="试听"
                    />
                  </section>
                ))}
              </div>

              <footer className="voice-review-panel">
                <div className="voice-score-grid">
                  <ScoreButtons label="自然度" value={review.naturalness} disabled={!loaded} onChange={(naturalness) => updateReview(candidate.key, { naturalness })} />
                  <ScoreButtons label="清晰度" value={review.clarity} disabled={!loaded} onChange={(clarity) => updateReview(candidate.key, { clarity })} />
                  <ScoreButtons label="中性度" value={review.neutrality} disabled={!loaded} onChange={(neutrality) => updateReview(candidate.key, { neutrality })} />
                </div>
                <label className="voice-note-field">
                  <span>试听笔记</span>
                  <textarea value={review.notes} disabled={!loaded} onChange={(event) => updateReview(candidate.key, { notes: event.target.value })} placeholder="例如：问句自然，但「出次第」停顿略长……" rows={3} />
                </label>
                <div className="voice-decision-controls" aria-label={`${candidate.label} 候选结论`}>
                  <span>暂定结论</span>
                  {([
                    ["favorite", "优先"],
                    ["keep", "保留"],
                    ["reject", "排除"],
                  ] as const).map(([value, label]) => (
                    <button className={review.decision === value ? "active" : ""} disabled={!loaded} onClick={() => updateReview(candidate.key, { decision: review.decision === value ? null : value })} type="button" aria-pressed={review.decision === value} key={value}>{label}</button>
                  ))}
                </div>
              </footer>
              <span className="voice-candidate-index">CANDIDATE {String(sequence).padStart(2, "0")}</span>
            </article>
          );
        })}
      </div>
    </section>
  );
}
