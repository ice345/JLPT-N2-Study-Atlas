import { searchStudyContent } from "@/app/lib/search";

export function GET(request: Request) {
  const query = new URL(request.url).searchParams.get("q") ?? "";
  return Response.json({ results: searchStudyContent(query) });
}
