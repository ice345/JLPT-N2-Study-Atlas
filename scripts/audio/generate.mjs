import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { access, mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, relative, resolve } from "node:path";
import { AivisClient } from "./aivis-client.mjs";
import { normalizeJapaneseForTts } from "./normalize-japanese.mjs";
import { problemFourAudioItems } from "./p4-content.mjs";

const projectRoot = resolve(import.meta.dirname, "../..");
const voicesPath = resolve(projectRoot, "config/audio-voices.json");
const benchmarksPath = resolve(projectRoot, "config/audio-benchmarks.json");
const manifestPath = resolve(projectRoot, "public/audio/manifest.json");
const workRoot = resolve(projectRoot, ".audio-work/raw-wav");
const voiceConfig = JSON.parse(await readFile(voicesPath, "utf8"));
const benchmarkConfig = JSON.parse(await readFile(benchmarksPath, "utf8"));
const args = process.argv.slice(2);

function argument(name, fallback = null) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

const scope = argument("--scope", "benchmark");
const requestedVoice = argument("--voice");
const requestedId = argument("--id");
const dryRun = args.includes("--dry-run");
const force = args.includes("--force");

if (!["benchmark", "p4", "listening", "language"].includes(scope)) {
  throw new Error(`Unknown scope '${scope}'. Use benchmark, p4, listening, or language.`);
}

const voiceEntries = Object.entries(voiceConfig.voices);
const selectedVoices = voiceEntries.filter(([key, voice]) => scope === "benchmark"
  ? voice.enabledForBenchmark && (!requestedVoice || requestedVoice === key)
  : voice.productionApproved && (!requestedVoice || requestedVoice === key));
const scopedSamples = scope === "benchmark"
  ? benchmarkConfig.samples
  : scope === "p4"
    ? problemFourAudioItems()
    : scope === "listening"
      ? problemFourAudioItems().filter((sample) => sample.category === "response-card")
      : [];
const selectedSamples = scopedSamples
  .filter((sample) => !requestedId || requestedId === sample.id || requestedId === sample.sampleId);
if (!selectedVoices.length) throw new Error(scope === "benchmark"
  ? `No benchmark voice matched '${requestedVoice ?? "enabled voices"}'.`
  : "No production-approved voice is configured. Finish the listening review and set productionApproved before generating course audio.");
if (!selectedSamples.length) throw new Error(`No ${scope} audio item matched '${requestedId ?? "the current content catalog"}'.`);

function commandExists(command) {
  return new Promise((resolvePromise) => {
    const process = spawn(command, ["-version"], { stdio: "ignore" });
    process.on("error", () => resolvePromise(false));
    process.on("exit", (code) => resolvePromise(code === 0));
  });
}

function run(command, commandArgs) {
  return new Promise((resolvePromise, reject) => {
    const process = spawn(command, commandArgs, { stdio: "inherit" });
    process.on("error", reject);
    process.on("exit", (code) => code === 0 ? resolvePromise() : reject(new Error(`${command} exited with ${code}`)));
  });
}

function wavDuration(buffer) {
  if (buffer.toString("ascii", 0, 4) !== "RIFF" || buffer.toString("ascii", 8, 12) !== "WAVE") return null;
  let offset = 12;
  let byteRate = 0;
  let dataSize = 0;
  while (offset + 8 <= buffer.length) {
    const id = buffer.toString("ascii", offset, offset + 4);
    const size = buffer.readUInt32LE(offset + 4);
    if (id === "fmt " && size >= 12) byteRate = buffer.readUInt32LE(offset + 16);
    if (id === "data") dataSize = size;
    offset += 8 + size + (size % 2);
  }
  return byteRate && dataSize ? Number((dataSize / byteRate).toFixed(3)) : null;
}

async function exists(path) {
  try {
    await access(path, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}

function audioHash(text, voiceKey, voice, settings) {
  return createHash("sha256")
    .update(JSON.stringify({ text, voiceKey, modelVersion: voice.modelVersion, modelUuid: voice.modelUuid, settings }))
    .digest("hex");
}

const ffmpeg = process.env.AUDIO_FFMPEG_BIN ?? "ffmpeg";
if (!dryRun && !(await commandExists(ffmpeg))) {
  throw new Error("ffmpeg was not found. Install it (macOS: brew install ffmpeg) or set AUDIO_FFMPEG_BIN.");
}

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
manifest.items ??= {};
const settings = voiceConfig.generationDefaults;
const jobs = [];
for (const [sampleIndex, sample] of selectedSamples.entries()) {
  const voicesForSample = scope === "benchmark" ? selectedVoices : [selectedVoices[sampleIndex % selectedVoices.length]];
  for (const [voiceKey, voice] of voicesForSample) {
    const text = normalizeJapaneseForTts(sample.displayText, { ttsText: sample.ttsText });
    const assetId = scope === "benchmark" ? `benchmark-${voiceKey}-${sample.id}` : sample.id;
    const target = scope === "benchmark"
      ? resolve(projectRoot, `public/audio/benchmark/${voiceKey}/${sample.id}.webm`)
      : resolve(projectRoot, `public/audio/problem-4/${sample.category}/${sample.id}.webm`);
    const textHash = audioHash(text, voiceKey, voice, settings);
    const current = manifest.items[assetId];
    const shouldGenerate = force || !current || current.textHash !== textHash || !(await exists(target));
    jobs.push({ assetId, sample, text, textHash, target, voiceKey, voice, shouldGenerate });
  }
}

for (const job of jobs) console.log(`${job.shouldGenerate ? "generate" : "skip"} ${job.assetId}`);
if (dryRun) {
  console.log(`${jobs.filter((job) => job.shouldGenerate).length}/${jobs.length} ${scope} files would be generated.`);
  process.exit(0);
}

const client = new AivisClient(process.env.AIVIS_ENGINE_URL ?? voiceConfig.engine.baseUrl);
const speakers = await client.speakers();
await mkdir(workRoot, { recursive: true });

let generated = 0;
for (const job of jobs.filter((item) => item.shouldGenerate)) {
  const resolvedStyle = client.resolveStyleId(job.voice, speakers);
  const wav = await client.synthesize(job.text, resolvedStyle.styleId, settings);
  const wavPath = resolve(workRoot, `${job.assetId}.wav`);
  await mkdir(dirname(job.target), { recursive: true });
  await writeFile(wavPath, wav);
  await run(ffmpeg, [
    "-hide_banner", "-loglevel", "error", "-y",
    "-i", wavPath,
    "-af", `loudnorm=I=${settings.loudnessTargetLufs}:LRA=11:TP=${settings.truePeakDb}`,
    "-c:a", "libopus", "-b:a", settings.opusBitrate, "-vbr", "on", "-application", "audio",
    job.target,
  ]);
  await rm(wavPath, { force: true });
  manifest.items[job.assetId] = {
    textHash: job.textHash,
    scope,
    sampleId: job.sample.id,
    problemId: job.sample.problemId,
    unitId: job.sample.unitId,
    category: job.sample.category,
    text: job.sample.displayText,
    normalizedText: job.text,
    voice: job.voiceKey,
    voiceName: job.voice.label,
    src: `/${relative(resolve(projectRoot, "public"), job.target)}`,
    duration: wavDuration(wav),
    provider: "aivis",
    generatedAt: new Date().toISOString(),
    modelVersion: job.voice.modelVersion,
    modelUuid: job.voice.modelUuid,
    styleId: resolvedStyle.styleId,
    styleName: resolvedStyle.styleName,
    speedScale: settings.speedScale,
    intonationScale: settings.intonationScale,
    tempoDynamicsScale: settings.tempoDynamicsScale,
    format: "audio/webm; codecs=opus",
    license: job.voice.license,
  };
  generated += 1;
  console.log(`wrote ${relative(projectRoot, job.target)}`);
}

manifest.generatedAt = new Date().toISOString();
const temporaryManifest = `${manifestPath}.tmp`;
await writeFile(temporaryManifest, `${JSON.stringify(manifest, null, 2)}\n`);
await rename(temporaryManifest, manifestPath);
console.log(`Generated ${generated}; skipped ${jobs.length - generated}; manifest has ${Object.keys(manifest.items).length} items.`);
