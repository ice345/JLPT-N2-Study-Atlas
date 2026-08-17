import type { CompleteDocument } from "@/app/components/complete-notes";
import type { EvidenceItem } from "@/app/components/evidence-library";

export function buildProblemFourEvidence(sourceDocuments: CompleteDocument[]) {
  const items: EvidenceItem[] = [];
  for (const [documentIndex, document] of sourceDocuments.entries()) {
    for (const [sectionIndex, section] of document.sections.entries()) {
      if (/预测|予測|押题|趨勢|趋势/u.test(section.title)) continue;
      for (const [blockIndex, block] of section.blocks.entries()) {
        if (block.type !== "table") continue;
        for (const [rowIndex, row] of block.rows.entries()) {
          const joined = row.join(" ");
          if (!/[ぁ-んァ-ヶ一-龯]/u.test(joined)) continue;
          const rowYears = Array.from(new Set(joined.match(/20(?:1\d|2[0-5])/gu) ?? []));
          const sectionYears = Array.from(new Set(section.title.match(/20(?:1\d|2[0-5])/gu) ?? []));
          const year = rowYears.length === 1
            ? rowYears[0]
            : sectionYears.length === 1
              ? sectionYears[0]
              : "综合";
          items.push({
            id: `e-${documentIndex}-${sectionIndex}-${blockIndex}-${rowIndex}`,
            year,
            type: block.headers[0] || "对照表",
            function: section.title,
            keyword: row[0] || row[1] || "例句",
            values: row,
            headers: block.headers,
          });
        }
      }
    }
  }
  return items
    .sort((left, right) => (left.year === "综合" ? 1 : 0) - (right.year === "综合" ? 1 : 0))
    .slice(0, 800);
}
