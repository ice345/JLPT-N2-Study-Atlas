import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { makeReviewState } from "../app/lib/study-store.ts";
import { decryptCredential, encryptCredential } from "../app/lib/ai/credentials.ts";
import { aiProviderDefaults, validateProviderInput } from "../app/lib/ai/provider.ts";
import { problemFourUnits } from "../app/data/problem-four-course.ts";
import { problemOneUnits, problemTwoUnits } from "../app/data/problem-one-two-course.ts";

test("review scheduling uses the unified mastery states", () => {
  const reviewedAt = new Date("2026-08-16T00:00:00.000Z");
  const input = {
    contentId: "p4-unit-01",
    contentType: "concept",
    domain: "listening",
    skill: "核心反应模型",
  };
  const again = makeReviewState(input, "again", undefined, reviewedAt);
  assert.equal(again.mastery, "learning");
  assert.equal(again.nextReviewAt, "2026-08-16T00:10:00.000Z");

  const firstGood = makeReviewState(input, "good", undefined, reviewedAt);
  const secondGood = makeReviewState(input, "good", firstGood, reviewedAt);
  const thirdGood = makeReviewState(input, "good", secondGood, reviewedAt);
  assert.equal(firstGood.mastery, "review");
  assert.equal(thirdGood.mastery, "mastered");
  assert.equal(thirdGood.reviewCount, 3);
});

test("problem four preserves the audited note coverage inside six learning-first units", () => {
  assert.equal(problemFourUnits.length, 6);
  assert.deepEqual(problemFourUnits.map((unit) => unit.number), ["01", "02", "03", "04", "05", "06"]);
  assert.deepEqual(problemFourUnits.map((unit) => unit.slug), ["core-response", "state-time", "emotion-evaluation", "requests-roles", "scope-conditions", "traps"]);
  for (const unit of problemFourUnits) {
    assert.equal(unit.summary.length, 3, unit.id);
    assert.equal(unit.drills.length, 6, unit.id);
    assert.equal(unit.concepts.length, 7, unit.id);
    assert.ok(unit.coverage.length >= 7, unit.id);
    assert.ok(unit.noteInsight.length > 30, unit.id);
    assert.ok(unit.estimatedMinutes >= 5 && unit.estimatedMinutes <= 12, unit.id);
    assert.ok(unit.sourceRefs.length > 0, unit.id);
  }
});

test("problems one and two each have six independent course routes with full mixed practice", () => {
  for (const [label, units] of [["problem-1", problemOneUnits], ["problem-2", problemTwoUnits]]) {
    assert.equal(units.length, 6, label);
    assert.equal(units.reduce((total, unit) => total + unit.drills.length, 0), 24, label);
    for (const unit of units) {
      assert.equal(unit.summary.length, 3, `${label}:${unit.id}`);
      assert.equal(unit.concepts.length, 5, `${label}:${unit.id}`);
      assert.equal(unit.drills.length, 4, `${label}:${unit.id}`);
      assert.equal(unit.coverage.length, 5, `${label}:${unit.id}`);
      assert.ok(unit.estimatedMinutes >= 5 && unit.estimatedMinutes <= 12, `${label}:${unit.id}`);
    }
  }
});

test("every generated vocabulary example has safe structured furigana", () => {
  const levels = ["n1", "n2", "n3", "n4", "n5"];
  for (const level of levels) {
    const entries = JSON.parse(fs.readFileSync(new URL(`../app/data/vocabulary/${level}.json`, import.meta.url), "utf8"));
    for (const entry of entries) {
      for (const example of entry.examples) {
        assert.ok(["source", "supplement"].includes(example.source), `${level}:${entry.id}`);
        assert.ok(example.furigana.length > 0, `${level}:${entry.id}`);
        assert.equal(example.furigana.map((segment) => segment.text).join(""), example.japanese, `${level}:${entry.id}`);
        assert.ok(example.furigana.every((segment) => !segment.reading || /^[ぁ-ゖー]+$/u.test(segment.reading)), `${level}:${entry.id}`);
      }
    }
  }
});

test("supplements close the complete N1, N3, N4, and N5 example gaps", () => {
  const metadata = JSON.parse(fs.readFileSync(new URL("../app/data/vocabulary/meta.json", import.meta.url), "utf8"));
  for (const level of ["N1", "N3", "N4", "N5"]) {
    assert.equal(metadata.levels[level].exampleEntries, metadata.levels[level].total, level);
  }
  assert.equal(metadata.levels.N2.supplementedExampleEntries, 80);
  const n1 = JSON.parse(fs.readFileSync(new URL("../app/data/vocabulary/n1.json", import.meta.url), "utf8"));
  const chancellor = n1.find((entry) => entry.word === "学長");
  assert.equal(chancellor.examples[0].source, "supplement");
  assert.match(chancellor.examples[0].japanese, /入学式/u);
});

test("AI provider validation permits OpenAI and blocks local or private endpoints", () => {
  const openai = validateProviderInput({ provider: "openai", apiKey: "sk-test" });
  assert.equal(openai?.endpoint, aiProviderDefaults.openaiEndpoint);
  assert.equal(openai?.model, "gpt-5.6-luna");

  const blocked = [
    "http://api.example.com/v1/responses",
    "https://localhost/v1/responses",
    "https://127.0.0.1/v1/responses",
    "https://10.0.0.1/v1/responses",
    "https://169.254.169.254/v1/responses",
    "https://192.168.1.10/v1/responses",
    "https://[::1]/v1/responses",
    "https://[fd00::1]/v1/responses",
    "https://[fe80::1]/v1/responses",
    "https://[::ffff:127.0.0.1]/v1/responses",
    "https://user:pass@api.example.com/v1/responses",
  ];
  for (const endpoint of blocked) {
    assert.equal(validateProviderInput({ provider: "custom", apiKey: "secret", endpoint, model: "model" }), null, endpoint);
  }

  const providerSource = fs.readFileSync(new URL("../app/lib/ai/provider.ts", import.meta.url), "utf8");
  assert.match(providerSource, /authorization: `Bearer \$\{provider\.apiKey\}`/u);
  assert.match(providerSource, /redirect: "error"/u);
  assert.match(providerSource, /AbortSignal\.timeout\(15_000\)/u);
});

test("saved AI credentials are randomized AES-GCM ciphertext and decrypt correctly", async () => {
  const masterKey = "00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff";
  const plaintext = "sk-personal-secret";
  const first = await encryptCredential(plaintext, masterKey);
  const second = await encryptCredential(plaintext, masterKey);
  assert.notEqual(first.iv, second.iv);
  assert.notEqual(first.ciphertext, second.ciphertext);
  assert.doesNotMatch(first.ciphertext, /sk-personal-secret/u);
  assert.equal(await decryptCredential(first.ciphertext, first.iv, masterKey), plaintext);
});

test("D1 migrations create the internal identity and idempotent event tables", () => {
  const migrationZero = new URL("../drizzle/0000_same_veda.sql", import.meta.url).pathname;
  const migrationOne = new URL("../drizzle/0001_many_fenris.sql", import.meta.url).pathname;
  const migrationTwo = new URL("../drizzle/0002_hesitant_killmonger.sql", import.meta.url).pathname;
  const output = execFileSync(
    "sqlite3",
    [":memory:", `.read ${migrationZero}`, `.read ${migrationOne}`, `.read ${migrationTwo}`, ".tables", "PRAGMA foreign_key_check;"],
    { encoding: "utf8" },
  );
  assert.match(output, /users/u);
  assert.match(output, /auth_identities/u);
  assert.match(output, /study_events/u);
  assert.match(output, /ai_credentials/u);
  assert.doesNotMatch(output, /foreign key constraint failed/iu);
});
