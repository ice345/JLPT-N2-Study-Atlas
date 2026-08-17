import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { AivisClient } from "./aivis-client.mjs";

const projectRoot = resolve(import.meta.dirname, "../..");
const voiceConfig = JSON.parse(await readFile(resolve(projectRoot, "config/audio-voices.json"), "utf8"));
const dictionary = JSON.parse(await readFile(resolve(projectRoot, "config/tts-dictionary.json"), "utf8"));
const dryRun = process.argv.includes("--dry-run");
const client = new AivisClient(process.env.AIVIS_ENGINE_URL ?? voiceConfig.engine.baseUrl);

export async function syncDictionary() {
  const response = await client.request("/user_dict");
  const current = await response.json();
  const existing = new Set(Object.values(current).map((entry) => `${entry.surface}\u0000${entry.pronunciation}\u0000${entry.accent_type}`));
  let added = 0;

  for (const entry of dictionary.entries.filter((item) => item.enabled !== false)) {
    const signature = `${entry.surface}\u0000${entry.pronunciation}\u0000${entry.accentType}`;
    if (existing.has(signature)) continue;
    const params = new URLSearchParams({
      surface: entry.surface,
      pronunciation: entry.pronunciation,
      accent_type: String(entry.accentType),
      priority: String(entry.priority ?? 5),
    });
    if (dryRun) {
      console.log(`[dry-run] add ${entry.surface} → ${entry.pronunciation}`);
    } else {
      await client.request(`/user_dict_word?${params}`, { method: "POST" });
      console.log(`added ${entry.surface} → ${entry.pronunciation}`);
    }
    added += 1;
  }

  console.log(`${added} dictionary entr${added === 1 ? "y" : "ies"} ${dryRun ? "would be added" : "added"}; local-only entries were preserved.`);
}

if (process.argv[1] && resolve(process.argv[1]) === resolve(import.meta.filename)) await syncDictionary();
