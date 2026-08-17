const AAD = new TextEncoder().encode("jlpt-study-garden:ai-credential:v1");

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  return Uint8Array.from(binary, (character) => character.charCodeAt(0));
}

function masterKeyBytes(value: string) {
  const trimmed = value.trim();
  const bytes = /^[0-9a-f]{64}$/iu.test(trimmed)
    ? Uint8Array.from(trimmed.match(/.{2}/gu) ?? [], (pair) => Number.parseInt(pair, 16))
    : base64ToBytes(trimmed);
  if (bytes.byteLength !== 32) throw new Error("AI credential master key must be exactly 32 bytes");
  return bytes;
}

async function importMasterKey(value: string) {
  return crypto.subtle.importKey("raw", masterKeyBytes(value), { name: "AES-GCM" }, false, ["encrypt", "decrypt"]);
}

export async function encryptCredential(plaintext: string, masterKey: string) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const key = await importMasterKey(masterKey);
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-GCM", iv, additionalData: AAD, tagLength: 128 },
    key,
    new TextEncoder().encode(plaintext),
  );
  return { ciphertext: bytesToBase64(new Uint8Array(encrypted)), iv: bytesToBase64(iv), keyVersion: 1 };
}

export async function decryptCredential(ciphertext: string, iv: string, masterKey: string) {
  const key = await importMasterKey(masterKey);
  const plaintext = await crypto.subtle.decrypt(
    { name: "AES-GCM", iv: base64ToBytes(iv), additionalData: AAD, tagLength: 128 },
    key,
    base64ToBytes(ciphertext),
  );
  return new TextDecoder().decode(plaintext);
}
