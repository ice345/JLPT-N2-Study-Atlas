import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { AivisClient } from "./aivis-client.mjs";

const projectRoot = resolve(import.meta.dirname, "../..");
const config = JSON.parse(await readFile(resolve(projectRoot, "config/audio-voices.json"), "utf8"));
const client = new AivisClient(process.env.AIVIS_ENGINE_URL ?? config.engine.baseUrl);
const [version, speakers, models] = await Promise.all([client.version(), client.speakers(), client.models()]);

console.log(`AivisSpeech Engine ${typeof version === "string" ? version : JSON.stringify(version)}`);
for (const [key, voice] of Object.entries(config.voices)) {
  const installed = Boolean(models[voice.modelUuid]);
  if (!installed) {
    console.log(`${key}: not installed`);
    continue;
  }
  const resolved = client.resolveStyleId(voice, speakers);
  console.log(`${key}: installed, styleId=${resolved.styleId}, ${resolved.speakerName} / ${resolved.styleName}`);
}
