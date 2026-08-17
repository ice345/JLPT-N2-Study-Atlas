export type AiProviderKind = "openai" | "custom";

export type PersonalProviderInput = {
  provider?: AiProviderKind;
  apiKey: string;
  endpoint?: string;
  model?: string;
};

export type ValidatedAiProvider = {
  provider: AiProviderKind;
  apiKey: string;
  endpoint: string;
  model: string;
};

const OPENAI_ENDPOINT = "https://api.openai.com/v1/responses";
const MAX_REQUEST_BYTES = 96_000;
const MAX_RESPONSE_BYTES = 1_000_000;

function ipv4Parts(hostname: string) {
  const match = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/u.exec(hostname);
  if (!match) return null;
  const parts = match.slice(1).map(Number);
  return parts.every((part) => part >= 0 && part <= 255) ? parts : null;
}

function isPrivateIpv4(hostname: string) {
  const parts = ipv4Parts(hostname);
  if (!parts) return false;
  const [first, second] = parts;
  return first === 0 || first === 10 || first === 127 || first >= 224
    || (first === 100 && second >= 64 && second <= 127)
    || (first === 169 && second === 254)
    || (first === 172 && second >= 16 && second <= 31)
    || (first === 192 && second === 0)
    || (first === 192 && second === 168)
    || (first === 198 && (second === 18 || second === 19));
}

function isBlockedIpv6(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/gu, "");
  if (!host.includes(":")) return false;
  if (host === "::" || host === "::1") return true;
  if (/^(?:fc|fd)[0-9a-f]{2}:/u.test(host)) return true;
  if (/^fe[89ab][0-9a-f]:/u.test(host)) return true;
  if (/^ff[0-9a-f]{2}:/u.test(host)) return true;
  const mappedDotted = /^(?:::ffff:|::)?(\d{1,3}(?:\.\d{1,3}){3})$/u.exec(host);
  if (mappedDotted) return isPrivateIpv4(mappedDotted[1]);
  const mappedHex = /^(?:::ffff:|::)([0-9a-f]{1,4}):([0-9a-f]{1,4})$/u.exec(host);
  if (!mappedHex) return false;
  const high = Number.parseInt(mappedHex[1], 16);
  const low = Number.parseInt(mappedHex[2], 16);
  return isPrivateIpv4(`${high >> 8}.${high & 255}.${low >> 8}.${low & 255}`);
}

export function isBlockedEndpointHost(hostname: string) {
  const host = hostname.toLowerCase().replace(/^\[|\]$/gu, "").replace(/\.$/u, "");
  if (!host || (!host.includes(".") && !host.includes(":"))) return true;
  if (["localhost", "metadata.google.internal"].includes(host)) return true;
  if (/\.(?:localhost|local|lan|home|internal|intranet|test|invalid|example|onion)$/u.test(host)) return true;
  return isPrivateIpv4(host) || isBlockedIpv6(host);
}

export function validateProviderInput(value: unknown): ValidatedAiProvider | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as Record<string, unknown>;
  const provider = candidate.provider === "custom" ? "custom" : "openai";
  const apiKey = typeof candidate.apiKey === "string" ? candidate.apiKey.trim() : "";
  const model = typeof candidate.model === "string" ? candidate.model.trim() : "";
  const rawEndpoint = provider === "openai"
    ? OPENAI_ENDPOINT
    : typeof candidate.endpoint === "string" ? candidate.endpoint.trim() : "";
  if (!apiKey || apiKey.length > 512 || model.length > 160 || (provider === "custom" && !model) || !rawEndpoint || rawEndpoint.length > 500) return null;
  try {
    const url = new URL(rawEndpoint);
    if (url.protocol !== "https:" || url.username || url.password || url.hash || isBlockedEndpointHost(url.hostname)) return null;
    return {
      provider,
      apiKey,
      endpoint: url.toString(),
      model: model || (provider === "openai" ? "gpt-5.6-luna" : ""),
    };
  } catch {
    return null;
  }
}

type DnsAnswer = { type?: number; data?: string };

async function dnsAnswers(hostname: string, type: "A" | "AAAA") {
  const url = new URL("https://cloudflare-dns.com/dns-query");
  url.searchParams.set("name", hostname);
  url.searchParams.set("type", type);
  const response = await fetch(url, {
    headers: { accept: "application/dns-json" },
    redirect: "error",
    signal: AbortSignal.timeout(4_000),
  });
  if (!response.ok) throw new Error("DNS validation failed");
  const body = await response.json() as { Answer?: DnsAnswer[] };
  return (body.Answer ?? []).filter((answer) => answer.type === 1 || answer.type === 28).map((answer) => answer.data ?? "");
}

export async function assertPublicProviderEndpoint(provider: ValidatedAiProvider) {
  const hostname = new URL(provider.endpoint).hostname.replace(/^\[|\]$/gu, "");
  if (hostname === "api.openai.com") return;
  if (ipv4Parts(hostname) || hostname.includes(":")) {
    if (isBlockedEndpointHost(hostname)) throw new Error("Provider endpoint is not public");
    return;
  }
  const addresses = [...await dnsAnswers(hostname, "A"), ...await dnsAnswers(hostname, "AAAA")];
  if (!addresses.length || addresses.some(isBlockedEndpointHost)) throw new Error("Provider endpoint is not public");
}

export async function requestResponsesApi(provider: ValidatedAiProvider, payload: unknown) {
  await assertPublicProviderEndpoint(provider);
  const body = JSON.stringify(payload);
  if (new TextEncoder().encode(body).byteLength > MAX_REQUEST_BYTES) throw new Error("AI request is too large");
  const response = await fetch(provider.endpoint, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${provider.apiKey}` },
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
    body,
  });
  const declaredLength = Number(response.headers.get("content-length") ?? "0");
  if (declaredLength > MAX_RESPONSE_BYTES) throw new Error("AI response is too large");
  const responseText = await response.text();
  if (new TextEncoder().encode(responseText).byteLength > MAX_RESPONSE_BYTES) throw new Error("AI response is too large");
  if (!response.ok) throw new Error(`AI provider returned ${response.status}`);
  const parsed = JSON.parse(responseText) as { output_text?: unknown };
  if (typeof parsed.output_text !== "string") throw new Error("AI provider returned an invalid response");
  return parsed.output_text;
}

export const aiProviderDefaults = {
  openaiEndpoint: OPENAI_ENDPOINT,
  maxRequestBytes: MAX_REQUEST_BYTES,
  maxResponseBytes: MAX_RESPONSE_BYTES,
};
