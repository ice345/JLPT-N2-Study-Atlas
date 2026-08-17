import test from "node:test";
import assert from "node:assert/strict";
import { normalizeJapaneseForTts } from "../scripts/audio/normalize-japanese.mjs";

test("strips Study Garden ruby syntax without speaking the reading twice", () => {
  assert.equal(
    normalizeJapaneseForTts("｜準備《じゅんび》は｜済《す》んでいます。"),
    "準備は済んでいます。",
  );
});

test("strips HTML ruby annotations", () => {
  assert.equal(
    normalizeJapaneseForTts("<ruby>結果<rp>（</rp><rt>けっか</rt><rp>）</rp></ruby>が出た。"),
    "結果が出た。",
  );
});

test("uses reviewed ttsText override", () => {
  assert.equal(
    normalizeJapaneseForTts("表示用", { ttsText: "読み上げ用" }),
    "読み上げ用",
  );
});
