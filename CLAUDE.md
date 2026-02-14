# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This Is

Lobster Lounge is a pixel-art control panel UI for OpenClaw, an AI agent orchestration platform. It connects to an OpenClaw gateway over WebSocket and lets operators manage AI agents visualized as animated pixel lobsters on a canvas tilemap. Single-page React app distributed as a single inlined HTML file.

## Commands

- **Dev server**: `bun run dev` (Vite with hot reload)
- **Build**: `bun run build` (TypeScript compile + Vite build + single-file inlining)
- **Format**: `bun run format` (Biome)
- **Lint**: `bun run lint` (Biome)
- **Check (format+lint)**: `bun run check`
- **Fix (format+lint)**: `bun run fix`
- **CI pipeline**: `bun run ci` (format → lint → build)

No test suite exists.

## Architecture

**Entry flow**: `main.tsx` → `App.tsx` (wraps in `GatewayProvider`) → either `GatewayScreen` (login) or `DashboardView` (main UI), based on `connectionPhase`.

**State management**: Single React Context (`context/GatewayContext.tsx`) — no Redux/Zustand. Holds all connection state, agent lists, chat messages, skills, and activity log. Heavy use of localStorage for persistence (device identity, auth tokens, agent positions/colors, connection history).

**Gateway communication** (`services/gateway-client.ts`): Custom WebSocket client class with state machine (`disconnected` → `connecting` → `challenged` → `handshaking` → `pairing`/`connected`). Protocol uses request/response with 60s timeout, event subscriptions, and ack-with-final streaming. Keepalive ticks at 30s.

**Auth** (`services/device-identity.ts`): Ed25519 keypair generation via Web Crypto API. Challenge-response handshake with nonce signing. Per-host device tokens stored in localStorage.

**Canvas rendering** (`components/LobsterHQ.tsx` + `renderers.ts` + `helpers.ts`): 22×16 tilemap at 16px tiles with 3× upscale. All pixel art drawn via `<canvas>` 2D context, not DOM/SVG. Agents are clickable/draggable with smooth interpolation movement. Animation via requestAnimationFrame.

**Data mapping** (`services/data-mappers.ts`): Transforms gateway agent format into HQ (tilemap) and Chat display formats. 12-color rotation palette, positions/colors persisted to localStorage.

**Single-file build** (`vite-plugin-single-file.ts`): Custom Vite plugin inlines all JS and CSS into one `index.html` for gateway deployment at `/lounge/`.

## Code Style & Conventions

- **Biome** enforces: 2-space indent, double quotes, always semicolons
- **Strict TypeScript**: `noExplicitAny`, `noUnusedVariables`, `noUnusedImports`, `noUnusedFunctionParameters` are all errors
- **Inline styles** throughout — no CSS modules, no Tailwind classes, no component library. Color constants in `components/constants.ts` (the `C` object)
- **Functional components only**, all hooks-based
- **Zero external UI dependencies** beyond React and `marked` (for markdown)
- **Hash-based routing** (`#/...`) to avoid conflicts with parent SPA
