import {
  getDeviceToken,
  getOrCreateIdentity,
  setDeviceToken,
  signConnectPayload,
} from "./device-identity";

const _STATES = [
  "disconnected",
  "connecting",
  "challenged",
  "handshaking",
  "pairing",
  "connected",
];

export default class GatewayClient {
  #ws = null;
  #state = "disconnected";
  #url = "";
  #nextId = 1;
  #pending = new Map();
  #listeners = new Map();
  #onEvent = null;
  #onStateChange = null;
  #helloPayload = null;
  #tickTimer = null;
  #tickIntervalMs = 30000;
  #lastTick = 0;
  #reconnectTimer = null;
  #reconnectDelay = 1000;
  #intentionalClose = false;
  #nonce = null;
  #identity = null;
  #storedDeviceToken = null;
  #gatewayToken = "";
  #gatewayHost = null;

  get state() {
    return this.#state;
  }
  get connected() {
    return this.#state === "connected";
  }
  get pairing() {
    return this.#state === "pairing";
  }
  get helloPayload() {
    return this.#helloPayload;
  }

  constructor({ onEvent, onStateChange } = {}) {
    this.#onEvent = onEvent || null;
    this.#onStateChange = onStateChange || null;
  }

  async connect(url, gatewayToken) {
    this.#intentionalClose = false;
    this.#url = url;
    this.#gatewayToken = gatewayToken || "";
    this.#reconnectDelay = 1000;

    try {
      this.#gatewayHost = new URL(url).host;
    } catch {
      this.#gatewayHost = url;
    }

    this.#identity = await getOrCreateIdentity();
    this.#storedDeviceToken = getDeviceToken(this.#gatewayHost);

    this.#doConnect();
  }

  disconnect() {
    this.#intentionalClose = true;
    clearTimeout(this.#reconnectTimer);
    this.#reconnectTimer = null;
    this.#cleanupTick();
    if (this.#ws) {
      this.#ws.close(1000);
      this.#ws = null;
    }
    this.#rejectAllPending("Disconnected");
    this.#setState("disconnected");
  }

  request(method, params) {
    return new Promise((resolve, reject) => {
      if (!this.#ws || this.#ws.readyState !== WebSocket.OPEN) {
        return reject(new Error("Not connected"));
      }
      const id = String(this.#nextId++);
      const timer = setTimeout(() => {
        this.#pending.delete(id);
        reject(new Error(`Request ${method} timed out`));
      }, 60000);
      this.#pending.set(id, { resolve, reject, timer, method });
      this.#ws.send(JSON.stringify({ type: "req", id, method, params }));
    });
  }

  on(eventName, callback) {
    if (!this.#listeners.has(eventName)) {
      this.#listeners.set(eventName, new Set());
    }
    this.#listeners.get(eventName).add(callback);
    return () => this.#listeners.get(eventName)?.delete(callback);
  }

  // --- private ---

  #doConnect() {
    this.#setState("connecting");
    try {
      this.#ws = new WebSocket(this.#url);
    } catch (_err) {
      this.#setState("disconnected");
      this.#scheduleReconnect();
      return;
    }

    this.#ws.onopen = () => {
      // wait for challenge event
    };

    this.#ws.onmessage = (evt) => {
      let frame;
      try {
        frame = JSON.parse(evt.data);
      } catch {
        return;
      }
      this.#handleFrame(frame);
    };

    this.#ws.onerror = () => {
      // onclose will fire after this
    };

    this.#ws.onclose = (_evt) => {
      this.#cleanupTick();
      this.#ws = null;
      const wasPairing = this.#state === "pairing";
      this.#setState("disconnected");
      this.#rejectAllPending("Connection closed");
      if (!this.#intentionalClose) {
        if (wasPairing) {
          // Fixed 3s reconnect during pairing (waiting for operator approval)
          this.#reconnectTimer = setTimeout(() => {
            this.#reconnectTimer = null;
            if (!this.#intentionalClose) {
              this.#doConnect();
            }
          }, 3000);
        } else {
          this.#scheduleReconnect();
        }
      }
    };
  }

  #handleFrame(frame) {
    if (frame.type === "event") {
      this.#handleEvent(frame);
    } else if (frame.type === "res") {
      this.#handleResponse(frame);
    }
  }

  #handleEvent(frame) {
    const { event, payload } = frame;

    if (event === "connect.challenge") {
      this.#nonce = payload?.nonce;
      this.#setState("challenged");
      this.#sendHandshake();
      return;
    }

    if (event === "tick") {
      this.#lastTick = Date.now();
      return;
    }

    // dispatch to listeners
    const cbs = this.#listeners.get(event);
    if (cbs) {
      for (const cb of cbs) {
        cb(payload, frame);
      }
    }
    if (this.#onEvent) {
      this.#onEvent(event, payload, frame);
    }
  }

  #handleResponse(frame) {
    const { id, ok, payload, error } = frame;
    const entry = this.#pending.get(id);
    if (!entry) {
      return;
    }

    // ack-with-final pattern: if status=accepted, keep pending
    if (ok && payload?.status === "accepted") {
      return;
    }

    // NOT_PAIRED — enter pairing state
    if (!ok && error?.code === "NOT_PAIRED") {
      clearTimeout(entry.timer);
      this.#pending.delete(id);
      this.#setState("pairing");
      return;
    }

    clearTimeout(entry.timer);
    this.#pending.delete(id);

    if (ok) {
      // hello-ok handshake response
      if (payload?.type === "hello-ok") {
        // Store device token if present
        if (payload?.auth?.deviceToken) {
          setDeviceToken(this.#gatewayHost, payload.auth.deviceToken);
          this.#storedDeviceToken = payload.auth.deviceToken;
        }
        this.#helloPayload = payload;
        this.#tickIntervalMs = payload.policy?.tickIntervalMs || 30000;
        this.#startTick();
        this.#reconnectDelay = 1000;
        this.#setState("connected");
      }
      entry.resolve(payload);
    } else {
      entry.reject(new Error(error?.message || "Request failed"));
    }
  }

  async #sendHandshake() {
    this.#setState("handshaking");
    const id = String(this.#nextId++);
    const params = {
      minProtocol: 3,
      maxProtocol: 3,
      client: {
        id: "openclaw-control-ui",
        version: "1.0.0",
        platform: "web",
        mode: "ui",
      },
      role: "operator",
      scopes: ["operator.read", "operator.write", "operator.admin"],
    };
    // Device identity — prefer stored device token, fall back to gateway token
    const authToken = this.#storedDeviceToken || this.#gatewayToken || "";
    const { signature, signedAt } = await signConnectPayload(
      this.#identity.privateKey,
      {
        deviceId: this.#identity.deviceId,
        nonce: this.#nonce,
        token: authToken,
      },
    );
    params.device = {
      id: this.#identity.deviceId,
      publicKey: this.#identity.publicKeyB64,
      signature,
      signedAt,
      nonce: this.#nonce,
    };
    if (authToken) {
      params.auth = { token: authToken };
    }

    const timer = setTimeout(() => {
      this.#pending.delete(id);
      if (this.#ws) {
        this.#ws.close(1008);
      }
    }, 10000);

    this.#pending.set(id, {
      resolve: (_payload) => {
        /* handled in #handleResponse */
      },
      reject: (err) => {
        this.#onEvent?.("error", { message: err.message });
      },
      timer,
      method: "connect",
    });

    this.#ws.send(
      JSON.stringify({ type: "req", id, method: "connect", params }),
    );
  }

  #startTick() {
    this.#lastTick = Date.now();
    this.#cleanupTick();
    this.#tickTimer = setInterval(() => {
      if (Date.now() - this.#lastTick > this.#tickIntervalMs * 2) {
        // tick timeout
        if (this.#ws) {
          this.#ws.close(4000, "Tick timeout");
        }
      }
    }, this.#tickIntervalMs);
  }

  #cleanupTick() {
    if (this.#tickTimer) {
      clearInterval(this.#tickTimer);
      this.#tickTimer = null;
    }
  }

  #scheduleReconnect() {
    if (this.#intentionalClose) {
      return;
    }
    this.#reconnectTimer = setTimeout(() => {
      this.#reconnectTimer = null;
      if (!this.#intentionalClose) {
        this.#doConnect();
      }
    }, this.#reconnectDelay);
    this.#reconnectDelay = Math.min(this.#reconnectDelay * 2, 30000);
  }

  #setState(s) {
    if (this.#state === s) {
      return;
    }
    this.#state = s;
    this.#onStateChange?.(s);
  }

  #rejectAllPending(reason) {
    for (const [_id, entry] of this.#pending) {
      clearTimeout(entry.timer);
      entry.reject(new Error(reason));
    }
    this.#pending.clear();
  }
}
