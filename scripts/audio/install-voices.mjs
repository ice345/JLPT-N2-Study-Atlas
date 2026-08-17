import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { AivisClient } from "./aivis-client.mjs";

const projectRoot = resolve(import.meta.dirname, "../..");
const config = JSON.parse(await readFile(resolve(projectRoot, "config/audio-voices.json"), "utf8"));
const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const voiceIndex = args.indexOf("--voice");
const requestedVoice = voiceIndex >= 0 ? args[voiceIndex + 1] : null;
const client = new AivisClient(process.env.AIVIS_ENGINE_URL ?? config.engine.baseUrl);

const entries = Object.entries(config.voices)
  .filter(([key, voice]) => voice.enabledForBenchmark && (!requestedVoice || requestedVoice === key));

if (requestedVoice && !entries.length) {
  throw new Error(`Unknown or disabled voice: ${requestedVoice}`);
}

if (dryRun) {
  for (const [key, voice] of entries) console.log(`[dry-run] ${key}: ${voice.modelPage} (${voice.modelSizeMb} MB)`);
  process.exit(0);
}

let installed = await client.models();
for (const [key, voice] of entries) {
  if (installed[voice.modelUuid]) {
    console.log(`skip ${key}: ${voice.label} is already installed`);
    continue;
  }
  console.log(`install ${key}: ${voice.label} (${voice.modelSizeMb} MB)`);
  await client.installModel(voice.modelPage);
  console.log(`installed ${key}`);
  installed = await client.models();
}

const speakers = await client.speakers();
for (const [key, voice] of entries) {
  const resolved = client.resolveStyleId(voice, speakers);
  console.log(`${key}: styleId=${resolved.styleId} speaker=${resolved.speakerName} style=${resolved.styleName}`);
}
