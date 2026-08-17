import { readFile } from "node:fs/promises";
import { build } from "esbuild";

const baseline = JSON.parse(await readFile(new URL("../config/content-regression-baseline.json", import.meta.url), "utf8"));
const source = `
import { languageProblemDefinitions } from "./app/data/language-course.ts";
import { problemFourDefinition } from "./app/data/problem-four-course.ts";
import { problemOneTwoDefinitions } from "./app/data/problem-one-two-course.ts";
import { problemThreeFiveDefinitions } from "./app/data/listening-three-five-course.ts";
import { readingModules } from "./app/data/reading-content.ts";

const definitions = [
  ...languageProblemDefinitions,
  ...problemOneTwoDefinitions,
  problemThreeFiveDefinitions[0],
  problemFourDefinition,
  problemThreeFiveDefinitions[1],
];
const counts = definitions.map((definition) => ({
  problemId: definition.slug,
  concepts: definition.units.reduce((total, unit) => total + unit.concepts.length, 0),
  variants: definition.units.reduce((total, unit) => total + unit.concepts.reduce((sum, concept) => sum + (concept.variants?.length ?? 0), 0), 0),
  examples: definition.units.reduce((total, unit) => total + unit.concepts.filter((concept) => concept.example).length, 0),
  traps: definition.units.reduce((total, unit) => total + unit.traps.length, 0),
  drills: definition.units.reduce((total, unit) => total + unit.drills.length, 0),
}));
for (const module of readingModules) counts.push({
  problemId: module.slug,
  concepts: module.models.length,
  variants: 0,
  examples: module.evidence.length,
  traps: module.traps.length,
  drills: module.checklist.length,
});
export default counts;
`;

const bundled = await build({
  stdin: { contents: source, loader: "ts", resolveDir: process.cwd(), sourcefile: "content-audit.ts" },
  bundle: true,
  platform: "node",
  format: "esm",
  write: false,
  logLevel: "silent",
  tsconfig: "tsconfig.json",
});
const moduleUrl = `data:text/javascript;base64,${Buffer.from(bundled.outputFiles[0].contents).toString("base64")}`;
const actual = new Map((await import(moduleUrl)).default.map((item) => [item.problemId, item]));
const metrics = ["concepts", "variants", "examples", "traps", "drills"];
const failures = [];
for (const [problemId, expected] of Object.entries(baseline.problems)) {
  const current = actual.get(problemId);
  if (!current) {
    failures.push(`${problemId}: missing`);
    continue;
  }
  for (const metric of metrics) if (current[metric] < expected[metric]) {
    failures.push(`${problemId}.${metric}: ${current[metric]} < ${expected[metric]}`);
  }
}
if (actual.size !== Object.keys(baseline.problems).length) failures.push(`problem count: ${actual.size} != ${Object.keys(baseline.problems).length}`);
if (failures.length) throw new Error(`Content regression detected:\n${failures.join("\n")}`);
console.log(`Content regression audit passed: ${actual.size} problems × ${metrics.length} metrics.`);
