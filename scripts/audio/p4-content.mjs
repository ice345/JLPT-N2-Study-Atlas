import { problemFourUnits } from "../../app/data/problem-four-course.ts";
import { listeningTriggers } from "../../app/data/content.ts";

export function problemFourAudioItems() {
  const lessonDrills = problemFourUnits.flatMap((unit) => unit.drills.map((drill) => ({
    id: `p4-drill-${drill.id}`,
    sampleId: drill.id,
    category: "lesson-drill",
    displayText: drill.cue,
    ttsText: drill.cue,
    problemId: "problem-4",
    unitId: unit.id,
  })));
  const responseCards = listeningTriggers.map((trigger, index) => ({
    id: `p4-card-${String(index + 1).padStart(2, "0")}`,
    sampleId: `card-${String(index + 1).padStart(2, "0")}`,
    category: "response-card",
    displayText: trigger.cue,
    ttsText: trigger.cue,
    problemId: "problem-4",
    unitId: undefined,
  }));
  return [...lessonDrills, ...responseCards];
}
