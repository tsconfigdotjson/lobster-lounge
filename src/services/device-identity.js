const KEYPAIR_KEY = "openclaw-device-keypair";
const DEVICE_ID_KEY = "openclaw-device-id";
const TOKEN_PREFIX = "openclaw-device-token:";

function base64url(arrayBuffer) {
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function getOrCreateIdentity() {
  const stored = localStorage.getItem(KEYPAIR_KEY);

  let publicKey, privateKey;

  if (stored) {
    const jwk = JSON.parse(stored);
    publicKey = await crypto.subtle.importKey(
      "jwk", jwk.publicKey, { name: "ECDSA", namedCurve: "P-256" }, true, ["verify"]
    );
    privateKey = await crypto.subtle.importKey(
      "jwk", jwk.privateKey, { name: "ECDSA", namedCurve: "P-256" }, true, ["sign"]
    );
  } else {
    const keyPair = await crypto.subtle.generateKey(
      { name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"]
    );
    publicKey = keyPair.publicKey;
    privateKey = keyPair.privateKey;

    const pubJwk = await crypto.subtle.exportKey("jwk", publicKey);
    const privJwk = await crypto.subtle.exportKey("jwk", privateKey);
    localStorage.setItem(KEYPAIR_KEY, JSON.stringify({ publicKey: pubJwk, privateKey: privJwk }));
  }

  const rawPubKey = await crypto.subtle.exportKey("raw", publicKey);
  const hash = await crypto.subtle.digest("SHA-256", rawPubKey);
  const deviceId = base64url(hash);
  const publicKeyB64 = base64url(rawPubKey);

  localStorage.setItem(DEVICE_ID_KEY, deviceId);

  return { deviceId, publicKeyB64, privateKey };
}

export async function signConnectPayload(privateKey, { deviceId, nonce, token }) {
  const signedAt = Date.now();
  const payloadStr = `v2|${deviceId}|openclaw-control-ui|ui|operator|operator.read,operator.write|${signedAt}|${token || ""}|${nonce || ""}`;
  const payloadBytes = new TextEncoder().encode(payloadStr);
  const sigBuf = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" }, privateKey, payloadBytes
  );
  return { signature: base64url(sigBuf), signedAt };
}

export function getDeviceToken(host) {
  return localStorage.getItem(TOKEN_PREFIX + host) || null;
}

export function setDeviceToken(host, token) {
  localStorage.setItem(TOKEN_PREFIX + host, token);
}

export function clearDeviceToken(host) {
  localStorage.removeItem(TOKEN_PREFIX + host);
}
