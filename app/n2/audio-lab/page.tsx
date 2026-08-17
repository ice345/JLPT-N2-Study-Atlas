import type { Metadata } from "next";
import { AudioBenchmarkLab, type BenchmarkCandidate } from "@/app/components/audio-benchmark-lab";
import { Breadcrumbs, PageFooter, SiteHeader } from "@/app/components/site-header";
import benchmarkConfig from "@/config/audio-benchmarks.json";
import voiceConfig from "@/config/audio-voices.json";
import manifestData from "@/public/audio/manifest.json";

export const metadata: Metadata = {
  title: "Aivis 声线试听室",
  description: "用相同 JLPT 日语句子比较 3 种自然女声与 3 种自然男声。",
};

type ManifestItem = { src: string; duration: number | null };
const manifestItems = manifestData.items as Record<string, ManifestItem>;

export default function AudioLabPage() {
  const candidates: BenchmarkCandidate[] = Object.entries(voiceConfig.voices)
    .filter(([, voice]) => voice.enabledForBenchmark)
    .map(([key, voice]) => ({
      key,
      label: voice.label,
      gender: voice.gender as "female" | "male",
      genderLabel: voice.genderLabel,
      impression: voice.impression,
      styleName: voice.styleName,
      modelVersion: voice.modelVersion,
      modelSizeMb: voice.modelSizeMb,
      modelPage: voice.modelPage,
      license: voice.license,
      licenseUrl: voice.licenseUrl,
      samples: benchmarkConfig.samples.map((sample) => {
        const asset = manifestItems[`benchmark-${key}-${sample.id}`];
        return { ...sample, asset: asset ? { src: asset.src, duration: asset.duration } : undefined };
      }),
    }));

  return (
    <main className="app-page audio-lab-page">
      <SiteHeader />
      <div className="page-wrap">
        <Breadcrumbs items={[{ label: "N2", href: "/n2" }, { label: "听力", href: "/n2/listening" }, { label: "Aivis 声线试听室" }]} />
        <section className="audio-lab-hero">
          <div>
            <span className="eyebrow">AUDIO BENCHMARK · 01</span>
            <h1>先选一把能长期听下去的声音。</h1>
            <p>3 种自然女声与 3 种自然男声，全部由本地 AivisSpeech 离线生成。这里先比较声线、读音和节奏，不会因此批量生成整个网站。</p>
          </div>
          <aside>
            <div><strong>6</strong><span>候选声线</span></div>
            <div><strong>18</strong><span>对照音频</span></div>
            <div><strong>0</strong><span>在线 TTS 请求</span></div>
          </aside>
          <div className="audio-hero-wave" aria-hidden="true">{Array.from({ length: 27 }).map((_, index) => <i key={index} />)}</div>
        </section>

        <section className="audio-lab-principle">
          <span>生成方式</span>
          <p><strong>浏览器只播放静态 WebM / Opus。</strong> AivisSpeech Engine 仅在内容制作阶段运行；即使本地引擎关闭，页面上的已生成音频仍能播放。</p>
          <dl>
            <div><dt>语速</dt><dd>0.96×</dd></div>
            <div><dt>响度</dt><dd>−18 LUFS</dd></div>
            <div><dt>格式</dt><dd>Opus 48k</dd></div>
          </dl>
        </section>

        <AudioBenchmarkLab candidates={candidates} />

        <section className="audio-license-note">
          <span>LICENSE REVIEW</span>
          <div><h2>这六个试听候选均为 ACML 1.0。</h2><p>许可允许非营利与营利用途，署名为可选；仍需遵守不得冒充本人、不得损害话者形象等使用限制。本页只用于 JLPT 学习场景的声线评估，尚未把任何候选标记为正式课程音色。</p></div>
          <a href="https://github.com/Aivis-Project/ACML/blob/master/ACML-1.0.md" target="_blank" rel="noreferrer">查看完整许可 ↗</a>
        </section>
      </div>
      <PageFooter />
    </main>
  );
}
