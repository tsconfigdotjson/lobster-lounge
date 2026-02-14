const KEYPAIR_KEY = "openclaw-device-keypair";
const DEVICE_ID_KEY = "openclaw-device-id";
const TOKEN_PREFIX = "openclaw-device-token:";

function base64url(arrayBuffer: ArrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function hexEncode(arrayBuffer: ArrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

export async function getOrCreateIdentity() {
  const stored = localStorage.getItem(KEYPAIR_KEY);

  let publicKey: CryptoKey, privateKey: CryptoKey;

  if (stored) {
    const jwk = JSON.parse(stored);
    publicKey = await crypto.subtle.importKey(
      "jwk",
      jwk.publicKey,
      { name: "Ed25519" },
      true,
      ["verify"],
    );
    privateKey = await crypto.subtle.importKey(
      "jwk",
      jwk.privateKey,
      { name: "Ed25519" },
      true,
      ["sign"],
    );
  } else {
    // Clear any old ECDSA keypair from a previous version
    localStorage.removeItem(KEYPAIR_KEY);
    localStorage.removeItem(DEVICE_ID_KEY);

    const keyPair = await crypto.subtle.generateKey("Ed25519", true, [
      "sign",
      "verify",
    ]);
    publicKey = keyPair.publicKey;
    privateKey = keyPair.privateKey;

    const pubJwk = await crypto.subtle.exportKey("jwk", publicKey);
    const privJwk = await crypto.subtle.exportKey("jwk", privateKey);
    localStorage.setItem(
      KEYPAIR_KEY,
      JSON.stringify({ publicKey: pubJwk, privateKey: privJwk }),
    );
  }

  const rawPubKey = await crypto.subtle.exportKey("raw", publicKey);
  const hash = await crypto.subtle.digest("SHA-256", rawPubKey);
  const deviceId = hexEncode(hash);
  const publicKeyB64 = base64url(rawPubKey);

  localStorage.setItem(DEVICE_ID_KEY, deviceId);

  return { deviceId, publicKeyB64, privateKey };
}

export async function signConnectPayload(
  privateKey: CryptoKey,
  {
    deviceId,
    nonce,
    token,
  }: { deviceId: string; nonce: string | null; token: string },
) {
  const signedAt = Date.now();
  const payloadStr = `v2|${deviceId}|openclaw-control-ui|ui|operator|operator.read,operator.write,operator.admin|${signedAt}|${token || ""}|${nonce || ""}`;
  const payloadBytes = new TextEncoder().encode(payloadStr);
  const sigBuf = await crypto.subtle.sign("Ed25519", privateKey, payloadBytes);
  return { signature: base64url(sigBuf), signedAt };
}

export function getDeviceToken(host: string) {
  return localStorage.getItem(TOKEN_PREFIX + host) || null;
}

export function setDeviceToken(host: string, token: string) {
  localStorage.setItem(TOKEN_PREFIX + host, token);
}

export function clearDeviceToken(host: string) {
  localStorage.removeItem(TOKEN_PREFIX + host);
}
