import { languageProblemDefinitions } from "@/app/data/language-course";
import { problemFourDefinition } from "@/app/data/problem-four-course";
import { problemOneTwoDefinitions } from "@/app/data/problem-one-two-course";
import { problemThreeFiveDefinitions } from "@/app/data/listening-three-five-course";
import { practiceQuestions } from "@/app/data/practice";
import { readingModules } from "@/app/data/reading-content";
import type { ProblemDefinition } from "@/app/data/problem-definition";
import type { StudyDomain, StudyEvent } from "@/app/lib/study-store";

export type LearningCatalogEntry = {
  id: string;
  domain: StudyDomain;
  title: string;
  japanese: string;
  href: string;
  problemId: string;
  unitId?: string;
  description: string;
  skillTags: string[];
};

export const courseDefinitions: ProblemDefinition[] = [
  ...languageProblemDefinitions,
  ...problemOneTwoDefinitions,
  problemThreeFiveDefinitions[0],
  problemFourDefinition,
  problemThreeFiveDefinitions[1],
];

function courseBasePath(definition: ProblemDefinition) {
  return `/n2/${definition.domain}/${definition.slug}`;
}

export const problemCatalog: LearningCatalogEntry[] = [
  ...languageProblemDefinitions.map((definition) => ({
    id: definition.slug,
    problemId: definition.slug,
    domain: definition.domain,
    title: `${definition.japanese} · ${definition.title}`,
    japanese: definition.japanese,
    href: courseBasePath(definition),
    description: definition.description,
    skillTags: definition.coverageGroups.flatMap((group) => group.items),
  })),
  ...readingModules.map((module) => ({
    id: module.slug,
    problemId: module.slug,
    domain: "reading" as const,
    title: `問題${module.number} · ${module.japanese}`,
    japanese: module.japanese,
    href: `/n2/reading/${module.slug}`,
    description: module.lead,
    skillTags: module.models.map((model) => model.title),
  })),
  ...[
    ...problemOneTwoDefinitions,
    problemThreeFiveDefinitions[0],
    problemFourDefinition,
    problemThreeFiveDefinitions[1],
  ].map((definition) => ({
    id: definition.slug,
    problemId: definition.slug,
    domain: definition.domain,
    title: `${definition.japanese} · ${definition.title}`,
    japanese: definition.japanese,
    href: courseBasePath(definition),
    description: definition.description,
    skillTags: definition.coverageGroups.flatMap((group) => group.items),
  })),
];

export const unitCatalog: LearningCatalogEntry[] = courseDefinitions.flatMap((definition) =>
  definition.units.map((unit) => ({
    id: unit.id,
    problemId: definition.slug,
    unitId: unit.id,
    domain: definition.domain,
    title: unit.title,
    japanese: unit.japanese,
    href: `${courseBasePath(definition)}/${unit.slug}`,
    description: unit.objective,
    skillTags: unit.coverage,
  })),
);

const problemById = new Map(problemCatalog.map((entry) => [entry.problemId, entry]));
const unitById = new Map(unitCatalog.map((entry) => [entry.unitId!, entry]));
const questionById = new Map(practiceQuestions.map((question) => [question.id, question]));

export function getProblemCatalogEntry(problemId?: string) {
  return problemId ? problemById.get(problemId) : undefined;
}

export function getUnitCatalogEntry(unitId?: string) {
  return unitId ? unitById.get(unitId) : undefined;
}

export function problemIdForEvent(event: StudyEvent) {
  if (event.problemId) return event.problemId;
  if (event.unitId) return unitById.get(event.unitId)?.problemId;
  const unit = unitById.get(event.contentId);
  if (unit) return unit.problemId;
  const question = questionById.get(event.contentId);
  if (question) return question.problem;
  if (problemById.has(event.contentId)) return event.contentId;
  return undefined;
}

export function unitIdForEvent(event: StudyEvent) {
  if (event.unitId) return event.unitId;
  if (unitById.has(event.contentId)) return event.contentId;
  const question = questionById.get(event.contentId);
  return question?.relatedContentIds.find((id) => unitById.has(id));
}

export function resolveEventCatalogEntry(event: StudyEvent) {
  const unit = getUnitCatalogEntry(unitIdForEvent(event));
  if (unit) return unit;
  return getProblemCatalogEntry(problemIdForEvent(event));
}

export const problemTargets: Record<StudyDomain, number> = {
  language: problemCatalog.filter((entry) => entry.domain === "language").length,
  reading: problemCatalog.filter((entry) => entry.domain === "reading").length,
  listening: problemCatalog.filter((entry) => entry.domain === "listening").length,
};

export function isCatalogProblemId(value: unknown): value is string {
  return typeof value === "string" && problemById.has(value);
}

export function isCatalogHref(value: unknown): value is string {
  return typeof value === "string" && [...problemCatalog, ...unitCatalog].some((entry) => entry.href === value);
}
