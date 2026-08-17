import {
  parseVocabularyLevel,
  queryVocabulary,
} from "@/app/lib/vocabulary-catalog";
import type { VocabularySourceKind } from "@/app/lib/vocabulary-types";

const exampleFilters = new Set(["all", "with", "without"]);
const sourceFilters = new Set(["all", "level", "merged", "legacy"]);
const orderOptions = new Set(["source", "random"]);

export function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const examples = params.get("examples") ?? "all";
  const source = params.get("source") ?? "all";
  const order = params.get("order") ?? "source";
  const result = queryVocabulary({
    level: parseVocabularyLevel(params.get("level")),
    query: params.get("q") ?? "",
    group: params.get("group") ?? "全部",
    examples: (exampleFilters.has(examples) ? examples : "all") as
      | "all"
      | "with"
      | "without",
    source: (sourceFilters.has(source) ? source : "all") as
      | "all"
      | VocabularySourceKind,
    order: (orderOptions.has(order) ? order : "source") as "source" | "random",
    seed: params.get("seed") ?? "study-garden",
    page: Number.parseInt(params.get("page") ?? "1", 10),
    pageSize: Number.parseInt(params.get("pageSize") ?? "18", 10),
  });

  return Response.json(result, {
    headers: { "cache-control": "public, max-age=60, stale-while-revalidate=300" },
  });
}
