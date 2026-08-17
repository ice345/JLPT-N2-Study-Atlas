import manifestData from "@/public/audio/manifest.json";

export type AudioAsset = {
  src: string;
  duration: number | null;
  voice?: string;
  voiceName?: string;
  scope?: string;
  text?: string;
  normalizedText?: string;
};

const items = manifestData.items as Record<string, AudioAsset>;

function normalizeLookupText(value: string) {
  return value
    .replace(/[｜|]([^《\n]+)《[^》]+》/gu, "$1")
    .replace(/([一-龯々〆ヵヶぁ-んァ-ヶーA-Za-z0-9]+)《[^》]+》/gu, "$1")
    .replace(/\s+/gu, " ")
    .trim();
}

export function audioAssetForId(id: string): AudioAsset | undefined {
  return items[id];
}

export function audioAssetForText(text: string): AudioAsset | undefined {
  const normalized = normalizeLookupText(text);
  return Object.values(items).find((item) => item.scope !== "benchmark" && (item.normalizedText === normalized || normalizeLookupText(item.text ?? "") === normalized));
}
