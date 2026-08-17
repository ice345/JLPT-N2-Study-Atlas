import { drizzle } from "drizzle-orm/d1";
import * as schema from "./schema";

export type StudyRuntimeEnv = {
  DB?: D1Database;
  OPENAI_API_KEY?: string;
  OPENAI_MODEL?: string;
  AI_CREDENTIAL_MASTER_KEY?: string;
};

declare global {
  // The Worker sets this before Vinext dispatches each request. Keeping this
  // bridge local avoids shipping a Cloudflare-only module into the Node artifact
  // verifier while retaining the real Worker bindings at runtime.
  var __jlptStudyRuntimeEnv: StudyRuntimeEnv | undefined;
}

export function getRuntimeEnv() {
  return globalThis.__jlptStudyRuntimeEnv;
}

export function getDb() {
  const env = getRuntimeEnv();
  if (!env?.DB) {
    throw new Error(
      "Cloudflare D1 binding `DB` is unavailable. Set the `d1` field in .openai/hosting.json to `DB` or let your control plane inject the real binding values before using the database."
    );
  }

  return drizzle(env.DB, { schema });
}
