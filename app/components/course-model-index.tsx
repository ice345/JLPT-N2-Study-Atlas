import Link from "next/link";
import { JapaneseReading } from "@/app/components/japanese-reading";
import type { LearnerProblemDefinition } from "@/app/data/problem-definition";

export function CourseModelIndex({ definition }: { definition: LearnerProblemDefinition }) {
  const basePath = `/n2/${definition.domain}/${definition.slug}`;
  return (
    <section className="course-model-index" aria-labelledby="course-model-title">
      <header><span>MODEL INDEX</span><h2 id="course-model-title">{definition.units.length} 类模型，逐项核对信号与方向</h2><p>先快速定位容易混淆的模型，再进入对应短课看例句和练习。</p></header>
      <div>
        {definition.units.map((unit) => (
          <article key={unit.id}>
            <header><span>{unit.number}</span><div><h3>{unit.title}</h3><small lang="ja">{unit.japanese}</small></div><Link href={`${basePath}/${unit.slug}`}>进入短课 →</Link></header>
            <ul>{unit.concepts.map((concept) => <li key={concept.cue}><strong lang="ja"><JapaneseReading text={concept.cue} /></strong><span>{concept.signal}</span><p>{concept.direction}</p></li>)}</ul>
          </article>
        ))}
      </div>
    </section>
  );
}
