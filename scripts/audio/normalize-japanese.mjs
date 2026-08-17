const RUBY_BAR_PATTERN = /[｜|]([^《\n]+)《[^》]+》/gu;
const RUBY_PATTERN = /([一-龯々〆ヵヶぁ-んァ-ヶーA-Za-z0-9]+)《[^》]+》/gu;
const HTML_RUBY_PATTERN = /<ruby[^>]*>([\s\S]*?)<\/ruby>/giu;
const HTML_RT_PATTERN = /<rt[^>]*>[\s\S]*?<\/rt>/giu;
const HTML_RP_PATTERN = /<rp[^>]*>[\s\S]*?<\/rp>/giu;

export function normalizeJapaneseForTts(input, options = {}) {
  const source = options.ttsText ?? input ?? "";
  return String(source)
    .replace(HTML_RUBY_PATTERN, (_match, content) => content
      .replace(HTML_RT_PATTERN, "")
      .replace(HTML_RP_PATTERN, "")
      .replace(/<[^>]+>/gu, ""))
    .replace(RUBY_BAR_PATTERN, "$1")
    .replace(RUBY_PATTERN, "$1")
    .replace(/\[([^\]]+)\]\([^\s)]+\)/gu, "$1")
    .replace(/[*_~`]/gu, "")
    .replace(/[\t\r\n]+/gu, " ")
    .replace(/\s{2,}/gu, " ")
    .trim();
}
