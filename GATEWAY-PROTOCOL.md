# OpenClaw Gateway WebSocket Protocol Reference

> **Protocol Version:** 3
> **Transport:** WebSocket (text frames, JSON payloads)
> **Default Endpoint:** `ws://127.0.0.1:18789`
> **Library:** `ws` (Node.js)

This document is the complete reference for the OpenClaw Gateway WebSocket protocol. The Gateway is the single control plane and node transport for OpenClaw. All clients — CLI, Web UI, macOS app, iOS/Android nodes, headless nodes — connect over WebSocket and declare their **role** and **scopes** at handshake time.

---

## Table of Contents

1. [Frame Format](#1-frame-format)
2. [Connection Lifecycle & Handshake](#2-connection-lifecycle--handshake)
3. [Authentication](#3-authentication)
4. [Device Identity & Pairing](#4-device-identity--pairing)
5. [Roles, Scopes & Capabilities](#5-roles-scopes--capabilities)
6. [RPC Methods (Request/Response)](#6-rpc-methods-requestresponse)
7. [Broadcast Events (Server → Client)](#7-broadcast-events-server--client)
8. [Flow Control & Backpressure](#8-flow-control--backpressure)
9. [Error Handling](#9-error-handling)
10. [Reconnection & Keep-Alive](#10-reconnection--keep-alive)
11. [TLS & Certificate Pinning](#11-tls--certificate-pinning)
12. [Protocol Versioning & Schema Generation](#12-protocol-versioning--schema-generation)
13. [Client IDs & Modes](#13-client-ids--modes)

---

## 1. Frame Format

All communication uses three JSON frame types, sent as WebSocket text frames.

### Request (Client → Server)

```json
{
  "type": "req",
  "id": "<unique-string>",
  "method": "<method-name>",
  "params": { ... }
}
```

| Field    | Type     | Required | Description                              |
| -------- | -------- | -------- | ---------------------------------------- |
| `type`   | `"req"`  | Yes      | Discriminator                            |
| `id`     | string   | Yes      | Unique request ID (UUID recommended)     |
| `method` | string   | Yes      | RPC method name                          |
| `params` | unknown  | No       | Method-specific parameters               |

### Response (Server → Client)

```json
{
  "type": "res",
  "id": "<matching-request-id>",
  "ok": true,
  "payload": { ... }
}
```

On error:

```json
{
  "type": "res",
  "id": "<matching-request-id>",
  "ok": false,
  "error": {
    "code": "INVALID_REQUEST",
    "message": "description",
    "details": { ... },
    "retryable": false,
    "retryAfterMs": 5000
  }
}
```

| Field     | Type    | Required | Description                                    |
| --------- | ------- | -------- | ---------------------------------------------- |
| `type`    | `"res"` | Yes      | Discriminator                                  |
| `id`      | string  | Yes      | Matches the request `id`                       |
| `ok`      | boolean | Yes      | `true` on success, `false` on error            |
| `payload` | unknown | No       | Response data (when `ok: true`)                |
| `error`   | object  | No       | Error details (when `ok: false`), see [Errors](#9-error-handling) |

### Event (Server → Client, broadcast)

```json
{
  "type": "event",
  "event": "<event-name>",
  "payload": { ... },
  "seq": 42,
  "stateVersion": { "presence": 5, "health": 3 }
}
```

| Field          | Type      | Required | Description                                |
| -------------- | --------- | -------- | ------------------------------------------ |
| `type`         | `"event"` | Yes      | Discriminator                              |
| `event`        | string    | Yes      | Event name                                 |
| `payload`      | unknown   | No       | Event-specific data                        |
| `seq`          | integer   | No       | Monotonically increasing sequence number (absent on targeted events) |
| `stateVersion` | object    | No       | `{ presence: int, health: int }` for incremental state tracking |

Side-effecting methods require **idempotency keys** in their params.

---

## 2. Connection Lifecycle & Handshake

The handshake is a three-phase process.

### Phase 1: Server sends challenge

Immediately after the WebSocket connection opens, the server sends:

```json
{
  "type": "event",
  "event": "connect.challenge",
  "payload": {
    "nonce": "<server-generated-nonce>",
    "ts": 1737264000000
  }
}
```

The client must echo the `nonce` back in its connect request for remote (non-loopback) connections.

### Phase 2: Client sends connect request

The **first frame** from the client **must** be a `connect` request:

```json
{
  "type": "req",
  "id": "1",
  "method": "connect",
  "params": {
    "minProtocol": 3,
    "maxProtocol": 3,
    "client": {
      "id": "cli",
      "displayName": "My Client",
      "version": "1.2.3",
      "platform": "macos",
      "mode": "backend",
      "instanceId": "optional-uuid",
      "deviceFamily": "optional",
      "modelIdentifier": "optional"
    },
    "role": "operator",
    "scopes": ["operator.read", "operator.write"],
    "caps": [],
    "commands": [],
    "permissions": {},
    "auth": {
      "token": "<gateway-auth-token>",
      "password": "<gateway-password>"
    },
    "locale": "en-US",
    "userAgent": "myclient/1.2.3",
    "pathEnv": "/usr/local/bin:/usr/bin",
    "device": {
      "id": "<device-fingerprint>",
      "publicKey": "<base64url-encoded-public-key>",
      "signature": "<device-signature>",
      "signedAt": 1737264000000,
      "nonce": "<server-challenge-nonce>"
    }
  }
}
```

**ConnectParams fields:**

| Field          | Type     | Required | Description                                      |
| -------------- | -------- | -------- | ------------------------------------------------ |
| `minProtocol`  | integer  | Yes      | Minimum protocol version the client supports     |
| `maxProtocol`  | integer  | Yes      | Maximum protocol version the client supports     |
| `client`       | object   | Yes      | Client identity (see table below)                |
| `role`         | string   | No       | `"operator"` or `"node"` (default: `"operator"`) |
| `scopes`       | string[] | No       | Requested scopes                                 |
| `caps`         | string[] | No       | Node capabilities (e.g., `["camera", "canvas"]`) |
| `commands`     | string[] | No       | Node command allowlist                            |
| `permissions`  | object   | No       | Granular permission toggles (`{ "camera.capture": true }`) |
| `auth`         | object   | No       | Authentication credentials                       |
| `device`       | object   | No       | Device identity for pairing                      |
| `locale`       | string   | No       | Client locale                                    |
| `userAgent`    | string   | No       | User-Agent string                                |
| `pathEnv`      | string   | No       | PATH environment for node exec                   |

**`client` object:**

| Field             | Type   | Required | Description                               |
| ----------------- | ------ | -------- | ----------------------------------------- |
| `id`              | string | Yes      | Client ID (see [Client IDs](#13-client-ids--modes)) |
| `displayName`     | string | No       | Human-readable name                       |
| `version`         | string | Yes      | Client version                            |
| `platform`        | string | Yes      | OS platform (`"macos"`, `"linux"`, `"ios"`, `"android"`, `"windows"`) |
| `mode`            | string | Yes      | Client mode (see [Client Modes](#13-client-ids--modes)) |
| `instanceId`      | string | No       | Instance UUID for disambiguation          |
| `deviceFamily`    | string | No       | Device family string                      |
| `modelIdentifier` | string | No       | Device model identifier                   |

### Phase 3: Server responds with hello-ok

```json
{
  "type": "res",
  "id": "1",
  "ok": true,
  "payload": {
    "type": "hello-ok",
    "protocol": 3,
    "server": {
      "version": "2026.2.9",
      "commit": "abc1234",
      "host": "myhost",
      "connId": "unique-connection-uuid"
    },
    "features": {
      "methods": ["health", "chat.send", "agent", "..."],
      "events": ["agent", "chat", "presence", "tick", "..."]
    },
    "snapshot": {
      "presence": [ { "host": "...", "ts": 1737264000000, "..." : "..." } ],
      "health": { ... },
      "stateVersion": { "presence": 1, "health": 1 },
      "uptimeMs": 12345,
      "configPath": "~/.openclaw/openclaw.json",
      "stateDir": "~/.openclaw/state",
      "sessionDefaults": {
        "defaultAgentId": "default",
        "mainKey": "...",
        "mainSessionKey": "...",
        "scope": "per-sender"
      }
    },
    "canvasHostUrl": "https://localhost:port",
    "auth": {
      "deviceToken": "<token-for-future-connects>",
      "role": "operator",
      "scopes": ["operator.read", "operator.write"],
      "issuedAtMs": 1737264000000
    },
    "policy": {
      "maxPayload": 512000,
      "maxBufferedBytes": 1572864,
      "tickIntervalMs": 30000
    }
  }
}
```

**HelloOk fields:**

| Field          | Type    | Description                                          |
| -------------- | ------- | ---------------------------------------------------- |
| `type`         | string  | Always `"hello-ok"`                                  |
| `protocol`     | integer | Negotiated protocol version                          |
| `server`       | object  | Server version, commit, hostname, connection ID      |
| `features`     | object  | `methods` and `events` arrays advertising available API surface |
| `snapshot`     | object  | Initial state: presence, health, uptime, config path, session defaults |
| `canvasHostUrl`| string  | Canvas host URL (optional)                           |
| `auth`         | object  | Device token issued on first pairing (optional)      |
| `policy`       | object  | Connection limits: `maxPayload`, `maxBufferedBytes`, `tickIntervalMs` |

### Handshake Timeout

The server enforces a **10-second** handshake timeout (configurable via `OPENCLAW_TEST_HANDSHAKE_TIMEOUT_MS` in test environments). If the client does not send a valid `connect` request within this window, the connection is closed with code `1008`.

### Connection Close Codes

| Code   | Meaning                                                    |
| ------ | ---------------------------------------------------------- |
| `1000` | Normal closure                                             |
| `1002` | Protocol error (e.g., version mismatch)                    |
| `1006` | Abnormal closure (no close frame)                          |
| `1008` | Policy violation (invalid handshake, unauthorized, slow consumer) |
| `1012` | Service restart                                            |
| `4000` | Tick timeout (client-initiated when server ticks go silent) |

---

## 3. Authentication

The gateway supports multiple authentication methods, used in the `connect` request's `auth` and `device` fields.

### Token Authentication

```json
{ "auth": { "token": "<gateway-token>" } }
```

The token must match `OPENCLAW_GATEWAY_TOKEN` (or `--token` CLI flag).

### Password Authentication

```json
{ "auth": { "password": "<gateway-password>" } }
```

Matches the configured gateway password.

### Device Token Authentication

After initial pairing, the server issues a **device token** in `hello-ok.auth.deviceToken`. The client should persist this token and use it for subsequent connections. Device tokens are scoped to a specific device + role + scopes combination.

Device tokens can be managed via:
- `device.token.rotate` — Rotate a device's token (requires `operator.pairing` scope)
- `device.token.revoke` — Revoke a device's token (requires `operator.pairing` scope)

### Token Fallback

The client first tries a stored device token. If that fails and a shared gateway token is also configured, it clears the stored device token and retries can use the shared token.

---

## 4. Device Identity & Pairing

All WebSocket clients should include a `device` identity during `connect` (both operator and node roles). The Control UI can omit it only when `gateway.controlUi.allowInsecureAuth` or `gateway.controlUi.dangerouslyDisableDeviceAuth` is enabled.

### Device Auth Payload (Signed)

The device signs a payload to prove identity. Two versions exist:

**v1 (Legacy/Loopback):**
```
v1|<deviceId>|<clientId>|<clientMode>|<role>|<scopes>|<signedAtMs>|<token>
```

**v2 (Nonce-based, required for remote connections):**
```
v2|<deviceId>|<clientId>|<clientMode>|<role>|<scopes>|<signedAtMs>|<token>|<nonce>
```

Fields:
- `deviceId` — Stable device fingerprint derived from keypair
- `clientId` — Client identifier (e.g., `"cli"`, `"openclaw-ios"`)
- `clientMode` — Client mode (e.g., `"backend"`, `"node"`)
- `role` — `"operator"` or `"node"`
- `scopes` — Comma-joined scope list
- `signedAtMs` — Signing timestamp (skew tolerance: 10 minutes)
- `token` — Auth token (empty string if none)
- `nonce` — Server challenge nonce (v2 only)

The payload is signed with the device's private key. The public key is sent as a base64url-encoded value in `device.publicKey`.

### Pairing Flow

1. **New device connects** — If the device ID is unknown, the gateway broadcasts a `device.pair.requested` event to operators with `operator.pairing` scope.
2. **Operator approves/rejects** — Calls `device.pair.approve` or `device.pair.reject` with the `requestId`.
3. **Gateway issues device token** — Returned in `hello-ok.auth.deviceToken`.
4. **Local auto-approval** — Loopback and same-host tailnet connections may be auto-approved.

### Pairing Events

**`device.pair.requested`** (broadcast to operators with `operator.pairing`):
```json
{
  "requestId": "uuid",
  "deviceId": "fingerprint",
  "publicKey": "base64url",
  "displayName": "My iPhone",
  "platform": "ios",
  "clientId": "openclaw-ios",
  "clientMode": "node",
  "role": "node",
  "roles": ["node"],
  "scopes": [],
  "remoteIp": "1.2.3.4",
  "silent": false,
  "isRepair": false,
  "ts": 1737264000000
}
```

**`device.pair.resolved`** (broadcast):
```json
{
  "requestId": "uuid",
  "deviceId": "fingerprint",
  "decision": "approved",
  "ts": 1737264000000
}
```

---

## 5. Roles, Scopes & Capabilities

### Roles

| Role       | Description                                                |
| ---------- | ---------------------------------------------------------- |
| `operator` | Control plane client — CLI, Web UI, automation             |
| `node`     | Capability host — camera, screen, canvas, system execution |

### Operator Scopes

| Scope                | Description                          |
| -------------------- | ------------------------------------ |
| `operator.read`      | Read-only operations                 |
| `operator.write`     | Write operations (send messages, config changes) |
| `operator.admin`     | Full administrative access (implies all other scopes for event filtering) |
| `operator.approvals` | Resolve execution approval requests  |
| `operator.pairing`   | Approve/reject device and node pairing |

### Node Capabilities

Nodes declare capability claims at connect time:

| Field         | Type                    | Description                           |
| ------------- | ----------------------- | ------------------------------------- |
| `caps`        | `string[]`              | High-level categories: `"camera"`, `"canvas"`, `"screen"`, `"location"`, `"voice"` |
| `commands`    | `string[]`              | Command allowlist: `"camera.snap"`, `"canvas.navigate"`, `"screen.record"`, `"location.get"` |
| `permissions` | `Record<string, bool>`  | Granular toggles: `{ "camera.capture": true, "screen.record": false }` |

The Gateway treats these as **claims** and enforces server-side allowlists.

### Event Scope Guards

Certain events are only delivered to clients with specific scopes:

| Event                      | Required Scope(s)                    |
| -------------------------- | ------------------------------------ |
| `exec.approval.requested`  | `operator.approvals` or `operator.admin` |
| `exec.approval.resolved`   | `operator.approvals` or `operator.admin` |
| `device.pair.requested`    | `operator.pairing` or `operator.admin`   |
| `device.pair.resolved`     | `operator.pairing` or `operator.admin`   |
| `node.pair.requested`      | `operator.pairing` or `operator.admin`   |
| `node.pair.resolved`       | `operator.pairing` or `operator.admin`   |

---

## 6. RPC Methods (Request/Response)

All methods are invoked via the request frame format. Parameters marked with `*` are required.

### Health & Status

#### `health`
Returns gateway health status. No params.

#### `status`
Returns system status. No params.

#### `usage.status`
Returns usage statistics. No params.

#### `usage.cost`
Returns cost information. No params.

---

### Chat & Messaging

#### `chat.send`
Send a message in a WebSocket chat session.

| Param            | Type     | Required | Description                      |
| ---------------- | -------- | -------- | -------------------------------- |
| `sessionKey`     | string   | Yes      | Target session key               |
| `message`        | string   | Yes      | Message text                     |
| `thinking`       | string   | No       | Thinking/reasoning mode          |
| `deliver`        | boolean  | No       | Whether to deliver to channel    |
| `attachments`    | array    | No       | Message attachments              |
| `timeoutMs`      | integer  | No       | Execution timeout                |
| `idempotencyKey` | string   | Yes      | Deduplication key                |

#### `chat.history`
Retrieve chat session history.

| Param        | Type    | Required | Description                           |
| ------------ | ------- | -------- | ------------------------------------- |
| `sessionKey` | string  | Yes      | Session key to retrieve history for   |
| `limit`      | integer | No       | Max messages to return (1–1000)       |

#### `chat.abort`
Abort a running chat.

| Param        | Type   | Required | Description                |
| ------------ | ------ | -------- | -------------------------- |
| `sessionKey` | string | Yes      | Session to abort           |
| `runId`      | string | No       | Specific run ID to abort   |

#### `chat.inject`
Inject a system message into a session transcript.

| Param        | Type   | Required | Description                    |
| ------------ | ------ | -------- | ------------------------------ |
| `sessionKey` | string | Yes      | Target session                 |
| `message`    | string | Yes      | Message to inject              |
| `label`      | string | No       | Label (max 100 chars)          |

---

### Agent Operations

#### `agent`
Invoke the agent asynchronously. This is the primary method for sending messages to agents.

| Param               | Type     | Required | Description                                  |
| -------------------- | -------- | -------- | -------------------------------------------- |
| `message`            | string   | Yes      | Message to send to the agent                 |
| `agentId`            | string   | No       | Target agent ID (defaults to default agent)  |
| `to`                 | string   | No       | Delivery target (channel recipient)          |
| `replyTo`            | string   | No       | Reply-to address                             |
| `sessionId`          | string   | No       | Specific session ID                          |
| `sessionKey`         | string   | No       | Session key                                  |
| `thinking`           | string   | No       | Thinking/reasoning level                     |
| `deliver`            | boolean  | No       | Whether to deliver response to a channel     |
| `attachments`        | array    | No       | File attachments                             |
| `channel`            | string   | No       | Source channel                               |
| `replyChannel`       | string   | No       | Reply channel (if different from source)     |
| `accountId`          | string   | No       | Channel account ID                           |
| `replyAccountId`     | string   | No       | Reply channel account ID                     |
| `threadId`           | string   | No       | Thread ID for threaded replies               |
| `groupId`            | string   | No       | Group chat ID                                |
| `groupChannel`       | string   | No       | Group channel                                |
| `groupSpace`         | string   | No       | Group space/workspace                        |
| `timeout`            | integer  | No       | Execution timeout (ms)                       |
| `lane`               | string   | No       | Execution lane                               |
| `extraSystemPrompt`  | string   | No       | Additional system prompt to inject           |
| `idempotencyKey`     | string   | Yes      | Deduplication key                            |
| `label`              | string   | No       | Session label                                |
| `spawnedBy`          | string   | No       | Parent session/agent that spawned this       |

#### `agent.identity.get`
Get agent identity metadata.

| Param        | Type   | Required | Description                  |
| ------------ | ------ | -------- | ---------------------------- |
| `agentId`    | string | No       | Agent ID (defaults to default) |
| `sessionKey` | string | No       | Session key context          |

**Response:**
```json
{
  "agentId": "default",
  "name": "My Agent",
  "avatar": "url-or-path",
  "emoji": "🦞"
}
```

#### `agent.wait`
Wait for an agent run to complete.

| Param       | Type    | Required | Description            |
| ----------- | ------- | -------- | ---------------------- |
| `runId`     | string  | Yes      | Run ID to wait for     |
| `timeoutMs` | integer | No       | Max wait time          |

#### `wake`
Wake the system.

| Param  | Type   | Required | Description                              |
| ------ | ------ | -------- | ---------------------------------------- |
| `mode` | string | Yes      | `"now"` or `"next-heartbeat"`            |
| `text` | string | Yes      | Wake text/reason                         |

---

### Message Sending (Channel Delivery)

#### `send`
Send a message to a messaging channel.

| Param            | Type     | Required | Description                               |
| ---------------- | -------- | -------- | ----------------------------------------- |
| `to`             | string   | Yes      | Recipient address                         |
| `message`        | string   | Yes      | Message text                              |
| `mediaUrl`       | string   | No       | Single media URL                          |
| `mediaUrls`      | string[] | No       | Multiple media URLs                       |
| `gifPlayback`    | boolean  | No       | Send as GIF                               |
| `channel`        | string   | No       | Target channel                            |
| `accountId`      | string   | No       | Channel account ID                        |
| `sessionKey`     | string   | No       | Session to mirror output into transcript  |
| `idempotencyKey` | string   | Yes      | Deduplication key                         |

#### `poll`
Create a poll in a channel.

| Param            | Type     | Required | Description                         |
| ---------------- | -------- | -------- | ----------------------------------- |
| `to`             | string   | Yes      | Recipient/group address             |
| `question`       | string   | Yes      | Poll question                       |
| `options`        | string[] | Yes      | Poll options (2–12 items)           |
| `maxSelections`  | integer  | No       | Max selections (1–12)               |
| `durationHours`  | integer  | No       | Poll duration in hours              |
| `channel`        | string   | No       | Target channel                      |
| `accountId`      | string   | No       | Channel account ID                  |
| `idempotencyKey` | string   | Yes      | Deduplication key                   |

---

### Session Management

#### `sessions.list`
List sessions.

| Param                 | Type    | Required | Description                                    |
| --------------------- | ------- | -------- | ---------------------------------------------- |
| `limit`               | integer | No       | Max sessions to return                         |
| `activeMinutes`       | integer | No       | Only sessions active within N minutes          |
| `includeGlobal`       | boolean | No       | Include global sessions                        |
| `includeUnknown`      | boolean | No       | Include sessions with unknown routing           |
| `includeDerivedTitles`| boolean | No       | Derive titles from first user message (reads 8KB/session) |
| `includeLastMessage`  | boolean | No       | Include last message preview (reads 16KB/session) |
| `label`               | string  | No       | Filter by label                                |
| `spawnedBy`           | string  | No       | Filter by parent session                       |
| `agentId`             | string  | No       | Filter by agent ID                             |
| `search`              | string  | No       | Full-text search                               |

#### `sessions.preview`
Get session content previews.

| Param      | Type     | Required | Description                        |
| ---------- | -------- | -------- | ---------------------------------- |
| `keys`     | string[] | Yes      | Session keys to preview (min 1)    |
| `limit`    | integer  | No       | Messages per session               |
| `maxChars` | integer  | No       | Max characters per preview (min 20)|

#### `sessions.resolve`
Resolve a session by various identifiers.

| Param            | Type    | Required | Description                  |
| ---------------- | ------- | -------- | ---------------------------- |
| `key`            | string  | No       | Session key                  |
| `sessionId`      | string  | No       | Session ID                   |
| `label`          | string  | No       | Session label                |
| `agentId`        | string  | No       | Agent ID                     |
| `spawnedBy`      | string  | No       | Parent session               |
| `includeGlobal`  | boolean | No       | Include global sessions      |
| `includeUnknown` | boolean | No       | Include unknown sessions     |

#### `sessions.patch`
Update session configuration.

| Param             | Type           | Required | Description                          |
| ----------------- | -------------- | -------- | ------------------------------------ |
| `key`             | string         | Yes      | Session key                          |
| `label`           | string\|null   | No       | Set or clear session label           |
| `thinkingLevel`   | string\|null   | No       | Thinking/reasoning level             |
| `verboseLevel`    | string\|null   | No       | Verbose output level                 |
| `reasoningLevel`  | string\|null   | No       | Reasoning level                      |
| `responseUsage`   | string\|null   | No       | `"off"`, `"tokens"`, `"full"`, `"on"` |
| `elevatedLevel`   | string\|null   | No       | Elevated permission level            |
| `execHost`        | string\|null   | No       | Execution host override              |
| `execSecurity`    | string\|null   | No       | Execution security level             |
| `execAsk`         | string\|null   | No       | Execution approval policy            |
| `execNode`        | string\|null   | No       | Execution node override              |
| `model`           | string\|null   | No       | Model override                       |
| `spawnedBy`       | string\|null   | No       | Parent session                       |
| `sendPolicy`      | string\|null   | No       | `"allow"` or `"deny"`               |
| `groupActivation` | string\|null   | No       | `"mention"` or `"always"`           |

#### `sessions.reset`
Reset a session (clear history).

| Param | Type   | Required | Description  |
| ----- | ------ | -------- | ------------ |
| `key` | string | Yes      | Session key  |

#### `sessions.delete`
Delete a session.

| Param              | Type    | Required | Description                         |
| ------------------ | ------- | -------- | ----------------------------------- |
| `key`              | string  | Yes      | Session key                         |
| `deleteTranscript` | boolean | No       | Also delete the transcript file     |

#### `sessions.compact`
Compact a session transcript.

| Param      | Type    | Required | Description              |
| ---------- | ------- | -------- | ------------------------ |
| `key`      | string  | Yes      | Session key              |
| `maxLines` | integer | No       | Maximum lines to keep    |

#### `sessions.usage`
Get session usage statistics.

| Param                 | Type    | Required | Description                             |
| --------------------- | ------- | -------- | --------------------------------------- |
| `key`                 | string  | No       | Specific session (omit for all)         |
| `startDate`           | string  | No       | Range start (`YYYY-MM-DD`)              |
| `endDate`             | string  | No       | Range end (`YYYY-MM-DD`)                |
| `limit`               | integer | No       | Max sessions (default 50)               |
| `includeContextWeight`| boolean | No       | Include system prompt report            |

---

### Agent Management

#### `agents.list`
List all agents. No params.

**Response:**
```json
{
  "defaultId": "default",
  "mainKey": "...",
  "scope": "per-sender",
  "agents": [
    {
      "id": "default",
      "name": "My Agent",
      "identity": {
        "name": "Agent Name",
        "theme": "ocean",
        "emoji": "🦞",
        "avatar": "path",
        "avatarUrl": "url"
      }
    }
  ]
}
```

#### `agents.create`
Create a new agent.

| Param       | Type   | Required | Description              |
| ----------- | ------ | -------- | ------------------------ |
| `name`      | string | Yes      | Agent name               |
| `workspace` | string | Yes      | Workspace directory path |
| `emoji`     | string | No       | Agent emoji              |
| `avatar`    | string | No       | Agent avatar             |

**Response:**
```json
{ "ok": true, "agentId": "new-id", "name": "My Agent", "workspace": "/path" }
```

#### `agents.update`
Update an existing agent.

| Param       | Type   | Required | Description          |
| ----------- | ------ | -------- | -------------------- |
| `agentId`   | string | Yes      | Agent to update      |
| `name`      | string | No       | New name             |
| `workspace` | string | No       | New workspace path   |
| `model`     | string | No       | Model override       |
| `avatar`    | string | No       | New avatar           |

#### `agents.delete`
Delete an agent.

| Param         | Type    | Required | Description                    |
| ------------- | ------- | -------- | ------------------------------ |
| `agentId`     | string  | Yes      | Agent to delete                |
| `deleteFiles` | boolean | No       | Also delete workspace files    |

**Response:**
```json
{ "ok": true, "agentId": "deleted-id", "removedBindings": 3 }
```

#### `agents.files.list`
List files in an agent's workspace.

| Param     | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `agentId` | string | Yes      | Agent ID    |

**Response:**
```json
{
  "agentId": "default",
  "workspace": "/path/to/workspace",
  "files": [
    { "name": "IDENTITY.md", "path": "/full/path", "missing": false, "size": 1234, "updatedAtMs": 1737264000000 }
  ]
}
```

#### `agents.files.get`
Read a specific agent file.

| Param     | Type   | Required | Description |
| --------- | ------ | -------- | ----------- |
| `agentId` | string | Yes      | Agent ID    |
| `name`    | string | Yes      | File name   |

**Response:** Same shape as `agents.files.list` but with `content` field populated.

#### `agents.files.set`
Write a file to an agent's workspace.

| Param     | Type   | Required | Description          |
| --------- | ------ | -------- | -------------------- |
| `agentId` | string | Yes      | Agent ID             |
| `name`    | string | Yes      | File name            |
| `content` | string | Yes      | File content to write|

---

### Configuration

#### `config.get`
Get the current gateway configuration. No params.

#### `config.set`
Overwrite the entire configuration.

| Param      | Type   | Required | Description                        |
| ---------- | ------ | -------- | ---------------------------------- |
| `raw`      | string | Yes      | Full configuration JSON string     |
| `baseHash` | string | No       | Optimistic concurrency check hash  |

#### `config.apply`
Apply configuration with optional restart.

| Param            | Type    | Required | Description                        |
| ---------------- | ------- | -------- | ---------------------------------- |
| `raw`            | string  | Yes      | Configuration JSON string          |
| `baseHash`       | string  | No       | Optimistic concurrency check       |
| `sessionKey`     | string  | No       | Session context                    |
| `note`           | string  | No       | Change note                        |
| `restartDelayMs` | integer | No       | Delay before restart               |

#### `config.patch`
Partially update configuration (merge).

| Param            | Type    | Required | Description                        |
| ---------------- | ------- | -------- | ---------------------------------- |
| `raw`            | string  | Yes      | Partial configuration JSON to merge|
| `baseHash`       | string  | No       | Optimistic concurrency check       |
| `sessionKey`     | string  | No       | Session context                    |
| `note`           | string  | No       | Change note                        |
| `restartDelayMs` | integer | No       | Delay before restart               |

#### `config.schema`
Get the configuration JSON Schema. No params.

**Response:**
```json
{
  "schema": { ... },
  "uiHints": { "channels.telegram.token": { "label": "Bot Token", "sensitive": true, "group": "Telegram" } },
  "version": "2026.2.9",
  "generatedAt": "2026-02-13T..."
}
```

---

### Models & Skills

#### `models.list`
List available AI models. No params.

**Response:**
```json
{
  "models": [
    { "id": "claude-sonnet-4-5-20250929", "name": "Claude Sonnet 4.5", "provider": "anthropic", "contextWindow": 200000, "reasoning": true }
  ]
}
```

#### `skills.status`
Get skill installation status.

| Param     | Type   | Required | Description                       |
| --------- | ------ | -------- | --------------------------------- |
| `agentId` | string | No       | Agent context for skill filtering |

#### `skills.bins`
List skill binary paths. No params.

**Response:**
```json
{ "bins": ["/path/to/skill1", "/path/to/skill2"] }
```

#### `skills.install`
Install a skill.

| Param       | Type    | Required | Description                |
| ----------- | ------- | -------- | -------------------------- |
| `name`      | string  | Yes      | Skill name                 |
| `installId` | string  | Yes      | Installation ID            |
| `timeoutMs` | integer | No       | Install timeout (min 1000) |

#### `skills.update`
Update a skill's configuration.

| Param      | Type                   | Required | Description             |
| ---------- | ---------------------- | -------- | ----------------------- |
| `skillKey` | string                 | Yes      | Skill identifier        |
| `enabled`  | boolean                | No       | Enable/disable          |
| `apiKey`   | string                 | No       | Skill API key           |
| `env`      | Record<string, string> | No       | Environment variables   |

---

### Channels

#### `channels.status`
Get status of all messaging channels.

| Param       | Type    | Required | Description                      |
| ----------- | ------- | -------- | -------------------------------- |
| `probe`     | boolean | No       | Run connection probes            |
| `timeoutMs` | integer | No       | Probe timeout                    |

**Response:**
```json
{
  "ts": 1737264000000,
  "channelOrder": ["telegram", "whatsapp", "discord"],
  "channelLabels": { "telegram": "Telegram" },
  "channelMeta": [{ "id": "telegram", "label": "Telegram", "detailLabel": "Telegram Bot" }],
  "channels": { "telegram": { ... } },
  "channelAccounts": {
    "telegram": [{
      "accountId": "default",
      "enabled": true,
      "configured": true,
      "linked": true,
      "running": true,
      "connected": true,
      "lastConnectedAt": 1737264000000,
      "dmPolicy": "allowlisted",
      "allowFrom": ["user1"]
    }]
  },
  "channelDefaultAccountId": { "telegram": "default" }
}
```

#### `channels.logout`
Logout from a channel.

| Param       | Type   | Required | Description       |
| ----------- | ------ | -------- | ----------------- |
| `channel`   | string | Yes      | Channel name      |
| `accountId` | string | No       | Specific account  |

#### `web-login.start`
Start a web login flow (e.g., for WhatsApp QR code).

| Param       | Type    | Required | Description       |
| ----------- | ------- | -------- | ----------------- |
| `force`     | boolean | No       | Force re-login    |
| `timeoutMs` | integer | No       | Timeout           |
| `verbose`   | boolean | No       | Verbose output    |
| `accountId` | string  | No       | Account ID        |

#### `web-login.wait`
Wait for web login completion.

| Param       | Type    | Required | Description |
| ----------- | ------- | -------- | ----------- |
| `timeoutMs` | integer | No       | Timeout     |
| `accountId` | string  | No       | Account ID  |

#### `talk.mode`
Set talk mode (voice interaction).

| Param     | Type    | Required | Description        |
| --------- | ------- | -------- | ------------------ |
| `enabled` | boolean | Yes      | Enable/disable     |
| `phase`   | string  | No       | Phase identifier   |

---

### Node Operations

#### `node.list`
List connected nodes. No params.

#### `node.describe`
Get detailed info about a node.

| Param    | Type   | Required | Description |
| -------- | ------ | -------- | ----------- |
| `nodeId` | string | Yes      | Node ID     |

#### `node.rename`
Rename a node.

| Param         | Type   | Required | Description    |
| ------------- | ------ | -------- | -------------- |
| `nodeId`      | string | Yes      | Node ID        |
| `displayName` | string | Yes      | New name       |

#### `node.invoke`
Invoke a command on a node.

| Param            | Type    | Required | Description                |
| ---------------- | ------- | -------- | -------------------------- |
| `nodeId`         | string  | Yes      | Target node                |
| `command`        | string  | Yes      | Command to invoke          |
| `params`         | unknown | No       | Command parameters         |
| `timeoutMs`      | integer | No       | Execution timeout          |
| `idempotencyKey` | string  | Yes      | Deduplication key          |

#### `node.invoke.result`
Report the result of a node command invocation (sent by the node).

| Param         | Type    | Required | Description                    |
| ------------- | ------- | -------- | ------------------------------ |
| `id`          | string  | Yes      | Invocation ID                  |
| `nodeId`      | string  | Yes      | Node ID                        |
| `ok`          | boolean | Yes      | Success/failure                |
| `payload`     | unknown | No       | Result data                    |
| `payloadJSON` | string  | No       | JSON-encoded result (alt)      |
| `error`       | object  | No       | `{ code?: string, message?: string }` |

#### `node.event`
Node sends an event to the gateway.

| Param         | Type    | Required | Description            |
| ------------- | ------- | -------- | ---------------------- |
| `event`       | string  | Yes      | Event name             |
| `payload`     | unknown | No       | Event data             |
| `payloadJSON` | string  | No       | JSON-encoded payload   |

### Node Pairing

#### `node.pair.request`
Request node pairing.

| Param             | Type     | Required | Description              |
| ----------------- | -------- | -------- | ------------------------ |
| `nodeId`          | string   | Yes      | Node identifier          |
| `displayName`     | string   | No       | Display name             |
| `platform`        | string   | No       | Platform                 |
| `version`         | string   | No       | Client version           |
| `coreVersion`     | string   | No       | Core version             |
| `uiVersion`       | string   | No       | UI version               |
| `deviceFamily`    | string   | No       | Device family            |
| `modelIdentifier` | string   | No       | Device model             |
| `caps`            | string[] | No       | Capabilities             |
| `commands`        | string[] | No       | Commands                 |
| `remoteIp`        | string   | No       | Remote IP                |
| `silent`          | boolean  | No       | Silent pairing           |

#### `node.pair.list`
List pending node pair requests. No params.

#### `node.pair.approve`
Approve a node pairing.

| Param       | Type   | Required | Description  |
| ----------- | ------ | -------- | ------------ |
| `requestId` | string | Yes      | Request ID   |

#### `node.pair.reject`
Reject a node pairing.

| Param       | Type   | Required | Description  |
| ----------- | ------ | -------- | ------------ |
| `requestId` | string | Yes      | Request ID   |

#### `node.pair.verify`
Verify a node's pairing token.

| Param    | Type   | Required | Description  |
| -------- | ------ | -------- | ------------ |
| `nodeId` | string | Yes      | Node ID      |
| `token`  | string | Yes      | Pairing token|

---

### Device Management

#### `device.pair.list`
List pending device pair requests. No params.

#### `device.pair.approve`
Approve a device pairing.

| Param       | Type   | Required | Description  |
| ----------- | ------ | -------- | ------------ |
| `requestId` | string | Yes      | Request ID   |

#### `device.pair.reject`
Reject a device pairing.

| Param       | Type   | Required | Description  |
| ----------- | ------ | -------- | ------------ |
| `requestId` | string | Yes      | Request ID   |

#### `device.token.rotate`
Rotate a device's authentication token.

| Param      | Type     | Required | Description          |
| ---------- | -------- | -------- | -------------------- |
| `deviceId` | string   | Yes      | Device ID            |
| `role`     | string   | Yes      | Role                 |
| `scopes`   | string[] | No       | New scopes           |

#### `device.token.revoke`
Revoke a device's authentication token.

| Param      | Type   | Required | Description  |
| ---------- | ------ | -------- | ------------ |
| `deviceId` | string | Yes      | Device ID    |
| `role`     | string | Yes      | Role         |

---

### Execution Approvals

#### `exec.approvals.get`
Get current execution approval configuration. No params.

**Response:**
```json
{
  "path": "/path/to/approvals.json",
  "exists": true,
  "hash": "sha256-hash",
  "file": {
    "version": 1,
    "socket": { "path": "...", "token": "..." },
    "defaults": { "security": "...", "ask": "...", "autoAllowSkills": true },
    "agents": {
      "default": {
        "security": "sandbox",
        "ask": "operator",
        "allowlist": [{ "pattern": "git *", "lastUsedAt": 1737264000000 }]
      }
    }
  }
}
```

#### `exec.approvals.set`
Set execution approval configuration.

| Param      | Type   | Required | Description                    |
| ---------- | ------ | -------- | ------------------------------ |
| `file`     | object | Yes      | Full approval config (version 1) |
| `baseHash` | string | No       | Optimistic concurrency hash    |

#### `exec.approvals.node.get`
Get node-specific execution approvals.

| Param    | Type   | Required | Description |
| -------- | ------ | -------- | ----------- |
| `nodeId` | string | Yes      | Node ID     |

#### `exec.approvals.node.set`
Set node-specific execution approvals.

| Param      | Type   | Required | Description               |
| ---------- | ------ | -------- | ------------------------- |
| `nodeId`   | string | Yes      | Node ID                   |
| `file`     | object | Yes      | Approval config           |
| `baseHash` | string | No       | Optimistic concurrency    |

#### `exec.approval.request`
Request execution approval (typically from agent runtime).

| Param          | Type    | Required | Description                    |
| -------------- | ------- | -------- | ------------------------------ |
| `id`           | string  | No       | Approval request ID            |
| `command`      | string  | Yes      | Command to approve             |
| `cwd`          | string  | No       | Working directory              |
| `host`         | string  | No       | Target host                    |
| `security`     | string  | No       | Security level                 |
| `ask`          | string  | No       | Ask policy                     |
| `agentId`      | string  | No       | Agent requesting approval      |
| `resolvedPath` | string  | No       | Resolved executable path       |
| `sessionKey`   | string  | No       | Session context                |
| `timeoutMs`    | integer | No       | Approval timeout               |

#### `exec.approval.resolve`
Resolve an execution approval request.

| Param      | Type   | Required | Description                 |
| ---------- | ------ | -------- | --------------------------- |
| `id`       | string | Yes      | Approval request ID         |
| `decision` | string | Yes      | Decision (approve/deny/...) |

---

### Cron Jobs

#### `cron.list`
List cron jobs.

| Param             | Type    | Required | Description              |
| ----------------- | ------- | -------- | ------------------------ |
| `includeDisabled` | boolean | No       | Include disabled jobs    |

**CronJob shape:**
```json
{
  "id": "uuid",
  "agentId": "default",
  "name": "Daily Summary",
  "description": "Summarize today's activity",
  "enabled": true,
  "deleteAfterRun": false,
  "createdAtMs": 1737264000000,
  "updatedAtMs": 1737264000000,
  "schedule": { "kind": "cron", "expr": "0 9 * * *", "tz": "America/New_York" },
  "sessionTarget": "main",
  "wakeMode": "now",
  "payload": { "kind": "agentTurn", "message": "Give me a daily summary", "deliver": true },
  "delivery": { "mode": "announce", "channel": "last" },
  "state": {
    "nextRunAtMs": 1737350400000,
    "lastRunAtMs": 1737264000000,
    "lastStatus": "ok",
    "lastDurationMs": 5000,
    "consecutiveErrors": 0
  }
}
```

**Schedule types:**
- `{ "kind": "at", "at": "ISO-datetime" }` — One-time at a specific time
- `{ "kind": "every", "everyMs": 3600000, "anchorMs": 0 }` — Repeating interval
- `{ "kind": "cron", "expr": "0 9 * * *", "tz": "America/New_York" }` — Cron expression

**Payload types:**
- `{ "kind": "systemEvent", "text": "..." }` — Inject system event
- `{ "kind": "agentTurn", "message": "...", "deliver": true, ... }` — Trigger agent turn

#### `cron.status`
Get cron scheduler status. No params.

#### `cron.add`
Create a cron job. Takes the same fields as the CronJob shape minus `id`, `createdAtMs`, `updatedAtMs`, and `state`.

#### `cron.update`
Update a cron job.

| Param   | Type   | Required | Description                |
| ------- | ------ | -------- | -------------------------- |
| `id`    | string | Yes      | Job ID (or `jobId`)        |
| `patch` | object | Yes      | Partial update fields      |

#### `cron.remove`
Delete a cron job.

| Param | Type   | Required | Description         |
| ----- | ------ | -------- | ------------------- |
| `id`  | string | Yes      | Job ID (or `jobId`) |

#### `cron.run`
Manually trigger a cron job.

| Param  | Type   | Required | Description                   |
| ------ | ------ | -------- | ----------------------------- |
| `id`   | string | Yes      | Job ID (or `jobId`)           |
| `mode` | string | No       | `"due"` or `"force"`         |

#### `cron.runs`
Get run history for a cron job.

| Param   | Type    | Required | Description                 |
| ------- | ------- | -------- | --------------------------- |
| `id`    | string  | Yes      | Job ID (or `jobId`)         |
| `limit` | integer | No       | Max entries (1–5000)        |

---

### Logs

#### `logs.tail`
Tail the gateway log file.

| Param      | Type    | Required | Description                     |
| ---------- | ------- | -------- | ------------------------------- |
| `cursor`   | integer | No       | Byte offset cursor              |
| `limit`    | integer | No       | Max lines (1–5000)             |
| `maxBytes` | integer | No       | Max bytes to read (1–1000000)  |

**Response:**
```json
{
  "file": "/path/to/log",
  "cursor": 12345,
  "size": 67890,
  "lines": ["line1", "line2"],
  "truncated": false,
  "reset": false
}
```

---

### Wizard (Onboarding)

#### `wizard.start`
Start the setup wizard.

| Param       | Type   | Required | Description                  |
| ----------- | ------ | -------- | ---------------------------- |
| `mode`      | string | No       | `"local"` or `"remote"`     |
| `workspace` | string | No       | Workspace path               |

**Response:**
```json
{
  "sessionId": "wizard-session-id",
  "done": false,
  "step": {
    "id": "step-1",
    "type": "select",
    "title": "Choose a channel",
    "message": "Which messaging platform?",
    "options": [{ "value": "telegram", "label": "Telegram", "hint": "Bot-based" }]
  },
  "status": "running"
}
```

**Step types:** `"note"`, `"select"`, `"text"`, `"confirm"`, `"multiselect"`, `"progress"`, `"action"`

#### `wizard.next`
Advance the wizard with an answer.

| Param       | Type   | Required | Description              |
| ----------- | ------ | -------- | ------------------------ |
| `sessionId` | string | Yes      | Wizard session ID        |
| `answer`    | object | No       | `{ stepId, value }` answer to current step |

#### `wizard.cancel`
Cancel the wizard.

| Param       | Type   | Required | Description       |
| ----------- | ------ | -------- | ----------------- |
| `sessionId` | string | Yes      | Wizard session ID |

#### `wizard.status`
Get wizard status.

| Param       | Type   | Required | Description       |
| ----------- | ------ | -------- | ----------------- |
| `sessionId` | string | Yes      | Wizard session ID |

**Response:**
```json
{ "status": "running" | "done" | "cancelled" | "error", "error": "optional message" }
```

---

### Other Methods

#### `system-presence`
Get all connected client presence. No params.

#### `system-event`
Report a system event. (params vary)

#### `browser.request`
Invoke browser automation. (params vary)

#### `voicewake.get`
Get voice wake configuration. No params.

#### `voicewake.set`
Set voice wake configuration. (params vary)

#### `tts.status`
Get TTS status. No params.

#### `tts.providers`
List TTS providers. No params.

#### `tts.enable`
Enable TTS. (params vary)

#### `tts.disable`
Disable TTS. (params vary)

#### `tts.convert`
Convert text to speech. (params vary)

#### `tts.setProvider`
Set TTS provider. (params vary)

#### `last-heartbeat`
Get last heartbeat time. No params.

#### `set-heartbeats`
Configure heartbeat tracking. (params vary)

#### `update.run`
Trigger a gateway update.

| Param            | Type    | Required | Description               |
| ---------------- | ------- | -------- | ------------------------- |
| `sessionKey`     | string  | No       | Session context           |
| `note`           | string  | No       | Update note               |
| `restartDelayMs` | integer | No       | Delay before restart      |
| `timeoutMs`      | integer | No       | Update timeout            |

---

## 7. Broadcast Events (Server → Client)

Events are pushed to connected clients. Broadcast events carry a monotonically increasing `seq` for gap detection. Targeted events (sent to specific connections) omit `seq`.

### Event Catalog

| Event                      | Description                                    | Scope Guard              |
| -------------------------- | ---------------------------------------------- | ------------------------ |
| `connect.challenge`        | Pre-handshake challenge with nonce             | None (pre-auth)          |
| `agent`                    | Agent execution stream (tool use, responses)   | None                     |
| `chat`                     | Chat message stream (deltas, final, errors)    | None                     |
| `presence`                 | Client connect/disconnect updates              | None                     |
| `tick`                     | Keep-alive heartbeat                           | None                     |
| `talk.mode`                | Talk mode state change                         | None                     |
| `shutdown`                 | Graceful shutdown notification                 | None                     |
| `health`                   | Gateway health status update                   | None                     |
| `heartbeat`                | Extended heartbeat event                       | None                     |
| `cron`                     | Cron job execution updates                     | None                     |
| `node.pair.requested`      | Node pairing request                           | `operator.pairing`       |
| `node.pair.resolved`       | Node pairing approved/rejected                 | `operator.pairing`       |
| `node.invoke.request`      | Command invocation sent to node                | None (targeted to node)  |
| `device.pair.requested`    | Device pairing request                         | `operator.pairing`       |
| `device.pair.resolved`     | Device pairing approved/rejected               | `operator.pairing`       |
| `voicewake.changed`        | Voice wake configuration changed               | None (sent to nodes)     |
| `exec.approval.requested`  | Execution needs operator approval              | `operator.approvals`     |
| `exec.approval.resolved`   | Execution approval decision made               | `operator.approvals`     |

### Event Payloads

#### `agent` event
Streams agent execution events.

```json
{
  "runId": "uuid",
  "seq": 0,
  "stream": "assistant",
  "ts": 1737264000000,
  "data": { ... }
}
```

| Field    | Type    | Description                                           |
| -------- | ------- | ----------------------------------------------------- |
| `runId`  | string  | Unique run identifier                                 |
| `seq`    | integer | Event sequence within the run                         |
| `stream` | string  | Stream type: `"assistant"`, `"tool"`, `"lifecycle"`   |
| `ts`     | integer | Timestamp (ms)                                        |
| `data`   | object  | Stream-specific data                                  |

#### `chat` event
Streams chat responses.

```json
{
  "runId": "uuid",
  "sessionKey": "agent:default:...",
  "seq": 0,
  "state": "delta",
  "message": { ... },
  "usage": { ... },
  "stopReason": "end_turn"
}
```

| Field          | Type    | Description                                               |
| -------------- | ------- | --------------------------------------------------------- |
| `runId`        | string  | Run identifier                                            |
| `sessionKey`   | string  | Session key                                               |
| `seq`          | integer | Sequence within this run                                  |
| `state`        | string  | `"delta"` (streaming), `"final"` (complete), `"aborted"`, `"error"` |
| `message`      | unknown | Message content (optional)                                |
| `errorMessage` | string  | Error description (when `state: "error"`)                 |
| `usage`        | unknown | Token usage information (optional)                        |
| `stopReason`   | string  | Reason for stop (optional)                                |

#### `tick` event
```json
{ "ts": 1737264000000 }
```

#### `shutdown` event
```json
{ "reason": "update", "restartExpectedMs": 5000 }
```

#### `presence` event
Contains an array of presence entries (see [Presence](#presence)).

#### `node.invoke.request` event
Sent to the target node when an operator invokes a command.

```json
{
  "id": "invocation-uuid",
  "nodeId": "node-id",
  "command": "camera.snap",
  "paramsJSON": "{\"resolution\": \"1080p\"}",
  "timeoutMs": 30000,
  "idempotencyKey": "uuid"
}
```

---

## 8. Flow Control & Backpressure

### Server-Side Limits

| Constant              | Default Value | Description                             |
| --------------------- | ------------- | --------------------------------------- |
| `MAX_PAYLOAD_BYTES`   | 512 KB        | Maximum incoming frame size             |
| `MAX_BUFFERED_BYTES`  | 1.5 MB        | Per-connection send buffer limit        |
| `TICK_INTERVAL_MS`    | 30,000 ms     | Tick/heartbeat interval                 |
| `HANDSHAKE_TIMEOUT_MS`| 10,000 ms     | Time allowed for handshake completion   |
| `HEALTH_REFRESH_MS`   | 60,000 ms     | Health snapshot refresh interval        |
| `DEDUPE_TTL_MS`       | 300,000 ms    | Idempotency key deduplication window    |
| `DEDUPE_MAX`          | 1,000         | Max tracked idempotency keys            |

### Client-Side Limits

| Constant          | Default Value | Description                    |
| ----------------- | ------------- | ------------------------------ |
| `maxPayload`      | 25 MB         | Maximum incoming frame size    |

### Slow Consumer Handling

When a client's send buffer exceeds `MAX_BUFFERED_BYTES`:
- Events marked `dropIfSlow: true` are silently dropped for that client
- Other events cause the slow client's connection to be closed with code `1008` ("slow consumer")

---

## 9. Error Handling

### Error Codes

| Code              | Description                              |
| ----------------- | ---------------------------------------- |
| `NOT_LINKED`      | Device not linked                        |
| `NOT_PAIRED`      | Device not paired / pairing required     |
| `AGENT_TIMEOUT`   | Agent execution timed out                |
| `INVALID_REQUEST` | Invalid request or parameters            |
| `UNAVAILABLE`     | Service unavailable                      |

### Error Response Shape

```json
{
  "code": "INVALID_REQUEST",
  "message": "Human-readable error description",
  "details": { ... },
  "retryable": false,
  "retryAfterMs": 5000
}
```

| Field          | Type    | Required | Description                              |
| -------------- | ------- | -------- | ---------------------------------------- |
| `code`         | string  | Yes      | Error code from the table above          |
| `message`      | string  | Yes      | Human-readable description               |
| `details`      | unknown | No       | Additional error context                 |
| `retryable`    | boolean | No       | Whether the request can be retried       |
| `retryAfterMs` | integer | No       | Suggested retry delay in milliseconds    |

---

## 10. Reconnection & Keep-Alive

### Client Reconnection

The reference `GatewayClient` implements exponential backoff reconnection:
- **Initial delay:** 1 second
- **Backoff multiplier:** 2x
- **Maximum delay:** 30 seconds
- **Reset on success:** Backoff resets to 1 second after successful `hello-ok`

### Tick-Based Keep-Alive

1. Server sends `tick` events at the interval specified in `policy.tickIntervalMs` (default: 30 seconds).
2. Client tracks `lastTick` timestamp.
3. If no tick is received within `2 * tickIntervalMs`, the client closes with code `4000` ("tick timeout").
4. Server uses tick responses to detect stale connections.

### Event Sequence Gap Detection

Events carry a monotonically increasing `seq` number. Clients should track `lastSeq` and detect gaps:
```
if (received_seq > last_seq + 1) {
    // Gap detected — events may have been lost
    onGap({ expected: last_seq + 1, received: received_seq })
}
```

### Ack-with-Final Pattern

Some methods (like `agent`) return an immediate `{ "status": "accepted" }` ack, followed later by a final response. When using `expectFinal: true`, the client keeps the request pending past the initial ack and waits for the final response.

---

## 11. TLS & Certificate Pinning

- TLS is supported via `wss://` URLs.
- Clients can pin the gateway certificate by SHA-256 fingerprint.
- Configure via `gateway.tls` in the config, or `gateway.remote.tlsFingerprint` / CLI `--tls-fingerprint`.
- The client validates the fingerprint during the TLS handshake and closes with `1008` on mismatch.

---

## 12. Protocol Versioning & Schema Generation

### Current Version

**Protocol Version: 3** (defined as `PROTOCOL_VERSION` in `src/gateway/protocol/schema/protocol-schemas.ts`)

### Version Negotiation

1. Client sends `minProtocol` and `maxProtocol` in `connect` params.
2. Server checks compatibility and sends negotiated `protocol` in `hello-ok`.
3. On version mismatch, the server closes the socket with code `1002`.

### Schema Generation

All protocol types are defined as [TypeBox](https://github.com/sinclairzx81/typebox) schemas in `src/gateway/protocol/schema/`. Code-generated types are available for multiple languages:

```bash
pnpm protocol:gen        # Generate TypeScript types / JSON Schema
pnpm protocol:gen:swift  # Generate Swift types
pnpm protocol:check      # Validate schemas
```

### Schema File Map

| File                      | Contents                                  |
| ------------------------- | ----------------------------------------- |
| `frames.ts`               | Core frame types, ConnectParams, HelloOk, ErrorShape |
| `agent.ts`                | Agent RPC params and events               |
| `agents-models-skills.ts` | Agent CRUD, models, skills                |
| `channels.ts`             | Channel status and login                  |
| `config.ts`               | Configuration get/set/patch/schema        |
| `cron.ts`                 | Cron job management                       |
| `devices.ts`              | Device pairing events and token management|
| `exec-approvals.ts`       | Execution approval schemas                |
| `logs-chat.ts`            | Log tailing and WebSocket chat methods    |
| `nodes.ts`                | Node invoke, pairing, events              |
| `sessions.ts`             | Session list, preview, patch, reset       |
| `snapshot.ts`             | Presence entries and initial state snapshot|
| `wizard.ts`               | Setup wizard steps and flow               |
| `primitives.ts`           | Shared types (NonEmptyString, etc.)       |
| `error-codes.ts`          | Error code definitions                    |
| `protocol-schemas.ts`     | Master registry of all schemas + `PROTOCOL_VERSION` |

---

## 13. Client IDs & Modes

### Client IDs

These are the recognized `client.id` values in the connect handshake:

| ID                     | Description                    |
| ---------------------- | ------------------------------ |
| `webchat-ui`           | WebChat browser UI             |
| `openclaw-control-ui`  | Control Panel web UI           |
| `webchat`              | WebChat client                 |
| `cli`                  | CLI tool                       |
| `gateway-client`       | Generic gateway client         |
| `openclaw-macos`       | macOS menu bar app             |
| `openclaw-ios`         | iOS node app                   |
| `openclaw-android`     | Android node app               |
| `node-host`            | Generic node host              |
| `test`                 | Test client                    |
| `fingerprint`          | Fingerprint client             |
| `openclaw-probe`       | Health probe                   |

### Client Modes

| Mode      | Description                           |
| --------- | ------------------------------------- |
| `webchat` | WebChat mode                          |
| `cli`     | Command-line interface mode           |
| `ui`      | Graphical UI mode                     |
| `backend` | Backend/automation mode               |
| `node`    | Node (capability host) mode           |
| `probe`   | Health probe (quiet failure, no logs) |
| `test`    | Test mode                             |

---

## Presence

Presence entries are included in the initial `snapshot` and broadcast via `presence` events.

```json
{
  "host": "myhost.local",
  "ip": "192.168.1.10",
  "version": "2026.2.9",
  "platform": "macos",
  "deviceFamily": "MacBookPro",
  "modelIdentifier": "Mac15,3",
  "mode": "backend",
  "lastInputSeconds": 30,
  "reason": "connect",
  "tags": ["active"],
  "text": "status text",
  "ts": 1737264000000,
  "deviceId": "device-fingerprint",
  "roles": ["operator"],
  "scopes": ["operator.read", "operator.write"],
  "instanceId": "uuid"
}
```

Entries are keyed by device identity. A single device may appear with multiple roles (e.g., both `operator` and `node`).

---

## Quick Start Example

### Minimal Operator Connection (pseudocode)

```javascript
const ws = new WebSocket("ws://127.0.0.1:18789");

ws.onmessage = (raw) => {
  const frame = JSON.parse(raw.data);

  if (frame.type === "event" && frame.event === "connect.challenge") {
    // Phase 2: Send connect
    ws.send(JSON.stringify({
      type: "req",
      id: "1",
      method: "connect",
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: "gateway-client",
          version: "1.0.0",
          platform: "linux",
          mode: "backend"
        },
        role: "operator",
        scopes: ["operator.read", "operator.write"],
        auth: { token: "your-gateway-token" }
      }
    }));
    return;
  }

  if (frame.type === "res" && frame.id === "1" && frame.ok) {
    // Phase 3: Connected! hello-ok received
    console.log("Connected:", frame.payload.server);
    console.log("Available methods:", frame.payload.features.methods);

    // Now send an agent message
    ws.send(JSON.stringify({
      type: "req",
      id: "2",
      method: "agent",
      params: {
        message: "Hello, agent!",
        idempotencyKey: crypto.randomUUID()
      }
    }));
    return;
  }

  if (frame.type === "event" && frame.event === "chat") {
    // Streaming agent response
    if (frame.payload.state === "delta") {
      process.stdout.write(frame.payload.message?.text ?? "");
    } else if (frame.payload.state === "final") {
      console.log("\n[Agent response complete]");
    }
    return;
  }

  if (frame.type === "event" && frame.event === "tick") {
    // Keep-alive — track for timeout detection
    return;
  }
};
```

### Node Connection Example

```javascript
ws.send(JSON.stringify({
  type: "req",
  id: "1",
  method: "connect",
  params: {
    minProtocol: 3,
    maxProtocol: 3,
    client: {
      id: "openclaw-ios",
      version: "1.0.0",
      platform: "ios",
      mode: "node",
      deviceFamily: "iPhone",
      modelIdentifier: "iPhone16,2"
    },
    role: "node",
    scopes: [],
    caps: ["camera", "canvas", "screen", "location"],
    commands: ["camera.snap", "canvas.navigate", "screen.record", "location.get"],
    permissions: { "camera.capture": true, "screen.record": true },
    auth: { token: "your-gateway-token" },
    device: {
      id: "device-fingerprint",
      publicKey: "base64url-public-key",
      signature: "signed-payload",
      signedAt: Date.now(),
      nonce: "server-challenge-nonce"
    }
  }
}));
```

---

## Source Files Reference

| Path | Description |
| ---- | ----------- |
| `src/gateway/protocol/schema/frames.ts` | Frame types, ConnectParams, HelloOk, ErrorShape |
| `src/gateway/protocol/schema/protocol-schemas.ts` | Master schema registry, PROTOCOL_VERSION |
| `src/gateway/protocol/schema/agent.ts` | Agent method schemas |
| `src/gateway/protocol/schema/agents-models-skills.ts` | Agent/model/skill CRUD schemas |
| `src/gateway/protocol/schema/channels.ts` | Channel status/login schemas |
| `src/gateway/protocol/schema/config.ts` | Config management schemas |
| `src/gateway/protocol/schema/cron.ts` | Cron job schemas |
| `src/gateway/protocol/schema/devices.ts` | Device pairing schemas |
| `src/gateway/protocol/schema/exec-approvals.ts` | Execution approval schemas |
| `src/gateway/protocol/schema/logs-chat.ts` | Log/chat schemas |
| `src/gateway/protocol/schema/nodes.ts` | Node operation schemas |
| `src/gateway/protocol/schema/sessions.ts` | Session management schemas |
| `src/gateway/protocol/schema/snapshot.ts` | Presence/snapshot schemas |
| `src/gateway/protocol/schema/wizard.ts` | Wizard flow schemas |
| `src/gateway/protocol/schema/primitives.ts` | Shared type primitives |
| `src/gateway/protocol/schema/error-codes.ts` | Error code definitions |
| `src/gateway/protocol/client-info.ts` | Client IDs and modes |
| `src/gateway/client.ts` | Reference client implementation |
| `src/gateway/server-methods-list.ts` | Method and event catalogs |
| `src/gateway/server-broadcast.ts` | Event broadcasting and scope guards |
| `src/gateway/server-constants.ts` | Server constants and limits |
| `src/gateway/device-auth.ts` | Device auth payload builder |
| `docs/gateway/protocol.md` | Official protocol guide |
