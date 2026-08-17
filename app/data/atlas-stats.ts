import q1 from "@/app/data/complete-notes/q1.json";
import q2 from "@/app/data/complete-notes/q2.json";
import q3 from "@/app/data/complete-notes/q3.json";
import q4 from "@/app/data/complete-notes/q4.json";
import q5 from "@/app/data/complete-notes/q5.json";
import q6 from "@/app/data/complete-notes/q6.json";
import q7 from "@/app/data/complete-notes/q7.json";
import q8 from "@/app/data/complete-notes/q8.json";
import q9 from "@/app/data/complete-notes/q9.json";
import p4 from "@/app/data/complete-notes/listening-p4.json";

type DocumentStats = { sections: number; tables: number; rows: number };

function stats(documents: Array<{ stats: DocumentStats }>) {
  return documents.reduce((result, document) => ({
    sections: result.sections + document.stats.sections,
    tables: result.tables + document.stats.tables,
    rows: result.rows + document.stats.rows,
  }), { sections: 0, tables: 0, rows: 0 });
}

export const languageStatsBySlug = {
  q1: stats(q1), q2: stats(q2), q3: stats(q3), q4: stats(q4), q5: stats(q5),
  q6: stats(q6), q7: stats(q7), q8: stats(q8), q9: stats(q9),
};

export const languageTotalStats = stats([q1, q2, q3, q4, q5, q6, q7, q8, q9].flat());
export const problemFourStats = stats(p4);
