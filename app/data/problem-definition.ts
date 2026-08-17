import type { StudyDomain } from "@/app/lib/study-store";

export type StudyConcept = {
  cue: string;
  signal: string;
  direction: string;
  variants?: string[];
  example?: string;
  exampleMeaning?: string;
  wrong?: string;
};

export type StudyTrap = {
  title: string;
  contrast: string;
};

export type StudyDrill = {
  id: string;
  cue: string;
  choices: string[];
  answer: number;
  reason: string;
};

export type StudyUnitDefinition = {
  id: string;
  slug: string;
  number: string;
  title: string;
  japanese: string;
  estimatedMinutes: number;
  objective: string;
  summary: string[];
  coverage: string[];
  noteInsight: string;
  concepts: StudyConcept[];
  traps: StudyTrap[];
  drills: StudyDrill[];
  relatedContentIds?: string[];
  sourceRefs: string[];
};

export type StudyCoverageGroup = {
  title: string;
  japanese: string;
  items: string[];
};

export type ProblemDefinition = {
  id: string;
  slug: string;
  domain: StudyDomain;
  number: string;
  title: string;
  japanese: string;
  heroTitle: string;
  description: string;
  quickSummary: string[];
  sourceSummary: {
    documents: number;
    sections: number;
    tables: number;
  };
  coverageGroups: StudyCoverageGroup[];
  units: StudyUnitDefinition[];
  practice: {
    slug: "practice";
    title: string;
    description: string;
    cardCount: number;
    estimatedMinutes: number;
    reviewPrefix: string;
  };
  examples: {
    slug: "examples";
    title: string;
    description: string;
    yearRange: string;
  };
  deepNotes: {
    slug: "notes";
    title: string;
    description: string;
  };
  sourceRefs: string[];
};

export type LearnerStudyUnitDefinition = Omit<StudyUnitDefinition, "sourceRefs">;
export type LearnerProblemDefinition = Omit<ProblemDefinition, "units" | "sourceRefs"> & {
  units: LearnerStudyUnitDefinition[];
};

function withoutSourceRefs<T extends { sourceRefs: string[] }>(value: T): Omit<T, "sourceRefs"> {
  const copy: Partial<T> = { ...value };
  delete copy.sourceRefs;
  return copy as Omit<T, "sourceRefs">;
}

export function toLearnerProblemDefinition(definition: ProblemDefinition): LearnerProblemDefinition {
  const problem = withoutSourceRefs(definition);
  return {
    ...problem,
    units: definition.units.map(withoutSourceRefs),
  };
}
