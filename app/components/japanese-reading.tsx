import { Fragment } from "react";

const readingPattern = /｜([^《》]+)《([^《》]+)》/gu;

export function JapaneseReading({ text }: { text: string }) {
  const parts: Array<{ text: string; reading?: string }> = [];
  let cursor = 0;

  for (const match of text.matchAll(readingPattern)) {
    const index = match.index ?? 0;
    if (index > cursor) parts.push({ text: text.slice(cursor, index) });
    parts.push({ text: match[1], reading: match[2] });
    cursor = index + match[0].length;
  }
  if (cursor < text.length) parts.push({ text: text.slice(cursor) });

  return parts.map((part, index) => part.reading ? (
    <ruby key={`${part.text}-${part.reading}-${index}`}>
      {part.text}<rt>{part.reading}</rt>
    </ruby>
  ) : <Fragment key={`${part.text}-${index}`}>{part.text}</Fragment>);
}
