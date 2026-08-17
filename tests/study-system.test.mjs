import assert from "node:assert/strict";
import fs from "node:fs";
import { execFileSync } from "node:child_process";
import test from "node:test";
import { courseCompletionsFromEvents, makeReviewState } from "../app/lib/study-store.ts";
import { decryptCredential, encryptCredential } from "../app/lib/ai/credentials.ts";
import { aiProviderDefaults, validateProviderInput } from "../app/lib/ai/provider.ts";
import { studyPlanJsonSchema, studyPlanSystemPrompt } from "../app/lib/ai/prompts.ts";
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

test("course completion stays independent from mastery ratings and keeps legacy hierarchy", () => {
  const base = { id: "event-1", clientEventId: "event-1", deviceId: "device-1", contentType: "concept", contentId: "p4-unit-01", domain: "listening", createdAt: "2026-08-17T00:00:00.000Z" };
  const states = courseCompletionsFromEvents([
    { ...base, type: "lesson_started" },
    { ...base, id: "event-2", clientEventId: "event-2", type: "concept_review", rating: "good", createdAt: "2026-08-17T00:01:00.000Z" },
  ]);
  assert.equal(states.length, 1);
  assert.equal(states[0].problemId, "problem-4");
  assert.equal(states[0].status, "in_progress");
  const completed = courseCompletionsFromEvents([...states.length ? [{ ...base, type: "lesson_started" }] : [], { ...base, id: "event-3", clientEventId: "event-3", type: "lesson_completed", createdAt: "2026-08-17T00:02:00.000Z" }]);
  assert.equal(completed[0].status, "completed");
});

test("problem four preserves the audited note coverage inside six learning-first units", () => {
  assert.equal(problemFourUnits.length, 6);
  assert.deepEqual(problemFourUnits.map((unit) => unit.number), ["01", "02", "03", "04", "05", "06"]);
  assert.deepEqual(problemFourUnits.map((unit) => unit.slug), ["core-response", "state-time", "emotion-evaluation", "requests-roles", "scope-conditions", "traps"]);
  for (const unit of problemFourUnits) {
    assert.equal(unit.summary.length, 3, unit.id);
    assert.equal(unit.drills.length, 6, unit.id);
    assert.equal(unit.concepts.length, 7, unit.id);
    assert.equal(new Set(unit.concepts.map((concept) => concept.groupId)).size, 3, unit.id);
    assert.ok(unit.concepts.every((concept) => concept.groupTitle), unit.id);
    assert.ok(unit.coverage.length >= 7, unit.id);
    assert.ok(unit.noteInsight.length > 30, unit.id);
    assert.ok(unit.estimatedMinutes >= 5 && unit.estimatedMinutes <= 12, unit.id);
    assert.ok(unit.sourceRefs.length > 0, unit.id);
  }
  assert.equal(problemFourUnits.reduce((sum, unit) => sum + unit.concepts.length, 0), 42);
  assert.equal(problemFourUnits.reduce((sum, unit) => sum + unit.concepts.reduce((count, concept) => count + (concept.variants?.length ?? 0), 0), 0), 84);
  assert.equal(problemFourUnits.reduce((sum, unit) => sum + unit.concepts.filter((concept) => concept.example).length, 0), 42);
  assert.equal(problemFourUnits.reduce((sum, unit) => sum + unit.traps.length, 0), 25);
  assert.equal(problemFourUnits.reduce((sum, unit) => sum + unit.drills.length, 0), 36);
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

test("AI interpretation schema keeps scoring deterministic and catalog targets constrained", () => {
  assert.equal(studyPlanJsonSchema.additionalProperties, false);
  assert.deepEqual(studyPlanJsonSchema.required, ["summary", "strengths", "risks", "priorities", "needsMoreEvidence", "next7Days"]);
  assert.equal(studyPlanJsonSchema.properties.next7Days.minItems, 7);
  assert.equal(studyPlanJsonSchema.properties.next7Days.maxItems, 7);
  assert.match(studyPlanSystemPrompt, /不得重新计算/u);
  assert.match(studyPlanSystemPrompt, /allowedTargets/u);
  const routeSource = fs.readFileSync(new URL("../app/api/study/ai-plan/route.ts", import.meta.url), "utf8");
  assert.match(routeSource, /lockedEvidence: evidence/u);
  assert.match(routeSource, /normaliseAiDiagnosticInterpretation/u);
  assert.doesNotMatch(routeSource, /recentAttempts:/u);
});

test("Problem 4 production audio is complete, deterministic, and split across approved voices", () => {
  const manifest = JSON.parse(fs.readFileSync(new URL("../public/audio/manifest.json", import.meta.url), "utf8"));
  const items = Object.values(manifest.items).filter((item) => item.scope === "p4");
  assert.equal(items.length, 60);
  assert.equal(items.filter((item) => item.category === "lesson-drill").length, 36);
  assert.equal(items.filter((item) => item.category === "response-card").length, 24);
  assert.equal(items.filter((item) => item.voice === "female-morioki").length, 30);
  assert.equal(items.filter((item) => item.voice === "male-fumifumi").length, 30);
  for (const item of items) {
    assert.equal(item.format, "audio/webm; codecs=opus");
    assert.ok(item.duration > 0);
    assert.ok(fs.existsSync(new URL(`../public${item.src}`, import.meta.url)), item.src);
  }
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
  const migrationThree = new URL("../drizzle/0003_outstanding_miracleman.sql", import.meta.url).pathname;
  const output = execFileSync(
    "sqlite3",
    [":memory:", `.read ${migrationZero}`, `.read ${migrationOne}`, `.read ${migrationTwo}`, `.read ${migrationThree}`, ".tables", "PRAGMA table_info(study_events);", "PRAGMA foreign_key_check;"],
    { encoding: "utf8" },
  );
  assert.match(output, /users/u);
  assert.match(output, /auth_identities/u);
  assert.match(output, /study_events/u);
  assert.match(output, /ai_credentials/u);
  assert.match(output, /problem_id/u);
  assert.match(output, /unit_id/u);
  assert.doesNotMatch(output, /foreign key constraint failed/iu);
});
