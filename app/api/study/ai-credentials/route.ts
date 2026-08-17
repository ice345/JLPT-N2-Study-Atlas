import { eq } from "drizzle-orm";
import { apiUnauthorized, jsonError, requireApiUser } from "@/app/lib/api";
import { encryptCredential } from "@/app/lib/ai/credentials";
import { assertPublicProviderEndpoint, validateProviderInput } from "@/app/lib/ai/provider";
import { getDb, getRuntimeEnv } from "@/db";
import { aiCredentials } from "@/db/schema";

function publicCredential(row: typeof aiCredentials.$inferSelect) {
  return {
    id: row.id,
    provider: row.provider,
    endpoint: row.endpoint,
    model: row.model,
    maskedKey: `•••• ${row.lastFour}`,
    updatedAt: row.updatedAt,
  };
}

export async function GET() {
  const user = await requireApiUser();
  if (!user) return apiUnauthorized();
  const rows = await getDb().select().from(aiCredentials).where(eq(aiCredentials.userId, user.id)).limit(1);
  return Response.json({ credential: rows[0] ? publicCredential(rows[0]) : null });
}

export async function POST(request: Request) {
  const user = await requireApiUser();
  if (!user) return apiUnauthorized();
  const masterKey = getRuntimeEnv()?.AI_CREDENTIAL_MASTER_KEY;
  if (!masterKey) return jsonError("安全保存暂未配置；仍可选择仅使用一次。", 503);
  let input: unknown;
  try {
    input = await request.json();
  } catch {
    return jsonError("AI 配置格式无效。");
  }
  const provider = validateProviderInput(input);
  if (!provider) return jsonError("请填写有效的 API Key、模型和公开 HTTPS 地址。");
  try {
    await assertPublicProviderEndpoint(provider);
    const encrypted = await encryptCredential(provider.apiKey, masterKey);
    const now = new Date().toISOString();
    const id = crypto.randomUUID();
    const values = {
      id,
      userId: user.id,
      provider: provider.provider,
      endpoint: provider.endpoint,
      model: provider.model,
      ciphertext: encrypted.ciphertext,
      iv: encrypted.iv,
      keyVersion: encrypted.keyVersion,
      lastFour: provider.apiKey.slice(-4),
      createdAt: now,
      updatedAt: now,
    };
    await getDb().insert(aiCredentials).values(values).onConflictDoUpdate({
      target: aiCredentials.userId,
      set: {
        provider: values.provider,
        endpoint: values.endpoint,
        model: values.model,
        ciphertext: values.ciphertext,
        iv: values.iv,
        keyVersion: values.keyVersion,
        lastFour: values.lastFour,
        updatedAt: now,
      },
    });
    const rows = await getDb().select().from(aiCredentials).where(eq(aiCredentials.userId, user.id)).limit(1);
    return Response.json({ credential: publicCredential(rows[0]) });
  } catch {
    return jsonError("无法安全保存此配置。请确认地址可公开访问，或改用“仅使用一次”。", 400);
  }
}

export async function DELETE() {
  const user = await requireApiUser();
  if (!user) return apiUnauthorized();
  await getDb().delete(aiCredentials).where(eq(aiCredentials.userId, user.id));
  return Response.json({ deleted: true });
}
