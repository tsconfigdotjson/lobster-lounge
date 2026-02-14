![Lobster Lounge](./github.gif)

A pixel-art control panel for [OpenClaw](https://github.com/openclaw/openclaw). Drag your agents around an underwater tilemap, chat with them, spawn new ones, and manage skills -- all from a cozy lounge on the ocean floor.

Lobster Lounge is a supplemental UI that sits alongside the default OpenClaw Control UI. It connects to your gateway over WebSocket using the same protocol, device pairing, and auth as the built-in interface. The difference is vibes: instead of dashboards and tables, your agents are lobsters wandering around a hand-drawn reef.

## What it does

- **The Reef** -- A 22x16 pixel tilemap rendered on a `<canvas>`. Your agents appear as animated pixel lobsters with snapping claws, bobbing antennae, and name tags. Click one to select it, then click a walkable tile to move it around. The ocean has kelp, coral, shell decorations, floating bubbles, and a lounge building with porthole windows.
- **Agent Chat** -- Collapsible chat panel in the bottom-right corner. Pick an agent tab and talk to it. Messages go through the gateway's `agent` request method and stream back via the ack-with-final pattern. Real typing indicators and everything. Chat history is persisted locally via IndexedDB so conversations survive page refreshes.
- **Spawn Agents** -- Hit "+ SPAWN AGENT" in the status bar. Pick a shell color, give it a designation, preview the deployment specs, and confirm. It calls `agents.create` on the gateway and the new lobster appears on the reef.
- **Edit Agents** -- Select a lobster, click EDIT on the tooltip, change its name or color.
- **Skills Panel** -- Collapsible panel in the bottom-left. Shows all available skills from the gateway, lets you toggle them on/off. Search and filter included.
- **HUD & Tide Log** -- Draggable overlay panels showing mission status, pod size, UTC time, a fake "current strength" indicator, and an activity log of agent events.
- **Draggable Everything** -- Every overlay panel can be grabbed and repositioned. They remember nothing between refreshes and that's fine.
- **Device Pairing** -- On first connect, Lounge generates an Ed25519 keypair, derives a device ID, and goes through the full challenge-response handshake. If the device isn't paired yet, it shows a pairing screen and waits for operator approval. Device tokens are stored per-gateway-host in localStorage.
- **Connection History** -- Recent gateway connections are saved and shown on the login screen for quick reconnect.
- **Multi-language** -- The entire UI is localized into 16 languages: English, Chinese, Hindi, Indonesian, Portuguese, Russian, Spanish, Japanese, Arabic, Vietnamese, German, Bengali, Urdu, Korean, French, and Norwegian. Switch languages from the dropdown in the gateway login header or dashboard. Language preference is saved to localStorage.

## Installation

Lobster Lounge is designed to be dropped into an existing OpenClaw installation. It piggybacks on the gateway's static file server by placing a single `index.html` into a `lounge/` subdirectory of the Control UI root.

```
npx lobster-lounge install
```

That's it. The installer will:

1. Locate your OpenClaw installation (by resolving the `openclaw` binary and walking up to find the package root)
2. Build Lounge into a single self-contained `index.html` (all JS and CSS inlined)
3. Copy it into `<openclaw-root>/dist/control-ui/lounge/`

Then open your gateway in a browser and navigate to `/lounge/` (trailing slash required).

### Manual install

If the automatic installer can't find your OpenClaw installation, you can point it manually:

```
npx lobster-lounge install --openclaw-root /path/to/openclaw
```

Or if you want to build and copy the files yourself:

```
bun run build
cp dist/index.html /path/to/openclaw/dist/control-ui/lounge/index.html
```

### After OpenClaw upgrades

Rebuilding or upgrading OpenClaw will wipe `dist/control-ui/`, which means your Lounge files get deleted. Just run the installer again:

```
npx lobster-lounge install
```

## Development

```
bun install
bun run dev
```

This starts Vite's dev server with hot reload. Lounge will render the login screen where you can enter your gateway's WebSocket URL (e.g. `ws://127.0.0.1:18789`). For development you're connecting directly to the gateway -- no need to install into OpenClaw's file tree.

You'll need to allow the dev server origin in your gateway config:

```
openclaw config set gateway.controlUi.allowedOrigins '["http://localhost:5173"]'
```

### Build

```
bun run build
```

Output goes to `dist/`. The build inlines all JS and CSS into a single `index.html` so the gateway only needs to serve one file.

### Lint / Format

```
bun run check
```

Uses [Biome](https://biomejs.dev/) for linting and formatting.

## How it works

Lounge is a single-page React app (React 19, TypeScript, Vite) with zero runtime dependencies beyond React. All the pixel art, animations, and UI are built from scratch with `<canvas>` and inline styles.

The gateway connection is managed by a custom `GatewayClient` class that handles the full OpenClaw WebSocket protocol: challenge-response auth, Ed25519 device signatures, request/response with timeout, event subscriptions, tick keepalive, and automatic reconnection with exponential backoff. During pairing it reconnects on a fixed 3-second interval until the operator approves the device.

The tilemap is a hardcoded 22x16 grid where each cell type (ocean, sand, deep water, lounge wall, shell roof, door, porthole, coral, kelp, shell deco) has its own pixel renderer. Agents move one axis at a time with smooth interpolation. Positions and colors are persisted to localStorage so your lobsters stay where you put them. Chat messages are stored in IndexedDB (keyed by gateway URL and agent ID) so conversations persist across refreshes, with automatic pruning to keep the database from growing indefinitely.

## URL note

Because Lounge lives inside the gateway's existing SPA, only the exact path `/lounge/` (with trailing slash) will serve the Lounge `index.html`. All internal routing uses hash-based navigation (`/lounge/#/...`) to avoid collisions with the parent SPA's catch-all fallback.

## License

MIT
