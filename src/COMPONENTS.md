# Open Claw — Component Reference

## File Structure

```
src/
  components/
    lobster-hq/          # Pixel art HQ dashboard (canvas-rendered)
      constants.js       # Tile engine config, palette, tilemap, font, bubbles
      helpers.js         # shadeColor, drawPixelText
      renderers.js       # All canvas tile/sprite draw functions
      HudItem.jsx        # Single HUD stat
      Divider.jsx        # Vertical bar separator
      ActivityLog.jsx    # Scrolling event log
      LobsterHQ.jsx      # Main HQ dashboard (canvas + UI)
      index.js           # Barrel exports

    open-claw/           # Standard React components
      constants.js       # Palette (C), CONNECTION_STEPS
      helpers.js         # shadeColor
      styles.js          # Shared inline style objects
      LobsterAvatar.jsx  # Animated pixel lobster (canvas)
      OceanBg.jsx        # Full-screen ambient background
      Spinner.jsx        # CSS loading spinner
      TypingDots.jsx     # Chat typing indicator
      PanelHeader.jsx    # Panel title bar
      Section.jsx        # Labeled section wrapper
      GatewayScreen.jsx  # Gateway connection flow
      AgentCreator.jsx   # Agent spawn form + preview
      AgentChat.jsx      # Agent messaging interface
      OpenClawComponents.jsx  # Demo showcase (wires mock data)
      index.js           # Barrel exports

  data/                  # Mock data (swap for real sources)
    mock-agents.js       # HQ_AGENTS, CHAT_AGENTS, ACTIVITY_LOGS
    mock-gateways.js     # EXISTING_GATEWAYS
    mock-skills.js       # ALL_SKILLS
    mock-responses.js    # RESPONSES
```

---

## Components

### LobsterHQ

**File:** `components/lobster-hq/LobsterHQ.jsx`
**Import:** `import { LobsterHQ } from './components/lobster-hq'`

Full-screen pixel art dashboard. Renders an animated canvas tilemap with lobster agent sprites, a pod roster sidebar, HUD bar, and activity log.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `agents` | `Agent[]` | `[]` | Agents to render on the map and in the roster |
| `logs` | `LogEntry[]` | `[]` | Activity log entries for the tide log panel |

```js
// Agent shape
{ id: string, role: string, task: string, color: string, x: number, y: number, dir: number }

// LogEntry shape
{ agent: string, action: string, color: string, t: number }
```

`t` is a tick offset (0–22, even numbers). The component maintains an internal tick counter and shows logs where `tick % 24 >= t`, displaying the most recent 7.

The HUD pod count is derived from `agents.length`. The tide clock is generated internally from `Date.now()`.

---

### GatewayScreen

**File:** `components/open-claw/GatewayScreen.jsx`
**Import:** `import { GatewayScreen } from './components/open-claw'`

Three-phase gateway connection flow: select → connect (animated progress) → done.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `gateways` | `Gateway[]` | `[]` | Available gateways to display |
| `onConnect` | `(gatewayName: string) => void` | — | Called when connection completes and user clicks "Enter the Reef" |

```js
// Gateway shape
{ id: string, name: string, status: "online" | "offline", agents: number, lastSync: string, region: string }
```

Also includes a "Deploy New Gateway" form with name input and region selector. The connection animation is self-contained (5 steps, ~8s total). Offline gateways are shown but not clickable.

---

### AgentCreator

**File:** `components/open-claw/AgentCreator.jsx`
**Import:** `import { AgentCreator } from './components/open-claw'`

Three-phase agent creation: edit → preview → deployed.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `skills` | `Skill[]` | `[]` | Available skills catalog for the dropdown |
| `onDeploy` | `(agent: NewAgent) => void` | — | Called after deploy confirmation when user clicks "Spawn Another" |

```js
// Skill shape
{ id: string, name: string, icon: string, desc: string, cat: string }

// NewAgent shape (passed to onDeploy)
{ name: string, desc: string, skills: Skill[], color: string }
```

Max 3 skills per agent. Max 12 char name, 160 char description. 8 color options. Skills are searchable by name, category, and description.

---

### AgentChat

**File:** `components/open-claw/AgentChat.jsx`
**Import:** `import { AgentChat } from './components/open-claw'`

Tabbed chat interface with per-agent message history.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `agents` | `ChatAgent[]` | `[]` | Agents available for chat (tabs) |
| `onSendMessage` | `(agentId: string, text: string) => Promise<string>` | — | Send handler. Returns the agent's response text. If omitted, falls back to a generic ack. |

```js
// ChatAgent shape
{ id: string, role: string, color: string, status: "active" | "busy" | "idle" }
```

Message history is stored in component state keyed by agent ID. The component shows a typing indicator while awaiting `onSendMessage` resolution. Status colors: active=green, busy=amber, idle=dim.

---

### ActivityLog

**File:** `components/lobster-hq/ActivityLog.jsx`
**Import:** `import { ActivityLog } from './components/lobster-hq'`

Compact scrolling event feed.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `logs` | `LogEntry[]` | `[]` | Full log array |
| `tick` | `number` | — | Current tick counter (drives which entries are visible) |

---

### HudItem

**File:** `components/lobster-hq/HudItem.jsx`

Single stat display for the HUD bar.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | Small label text above the value |
| `value` | `string` | — | Display value |
| `color` | `string` | — | CSS color for the value |
| `pulse` | `boolean` | — | Enables pulse animation |

---

### Divider

**File:** `components/lobster-hq/Divider.jsx`

Vertical 1px separator, 28px tall. No props.

---

### LobsterAvatar

**File:** `components/open-claw/LobsterAvatar.jsx`
**Import:** `import { LobsterAvatar } from './components/open-claw'`

Animated 16x16 pixel lobster rendered on a canvas, scaled up.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `string` | — | Base hex color for the lobster |
| `size` | `number` | `48` | Display size in px (canvas scales via CSS) |
| `style` | `object` | — | Additional inline styles merged onto the canvas |

Runs its own `requestAnimationFrame` loop. Renders body, claws (with snap animation), antennae (sway), legs (walk cycle), eye stalks.

---

### OceanBg

**File:** `components/open-claw/OceanBg.jsx`

Fixed full-viewport animated ocean background. No props. Renders as `position: fixed`, `z-index: 0`, `pointer-events: none`, `opacity: 0.5`. Uses its own canvas with bubbles and caustic light effects.

---

### Spinner

**File:** `components/open-claw/Spinner.jsx`

14px CSS border spinner.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `string` | — | Spinner color |

---

### TypingDots

**File:** `components/open-claw/TypingDots.jsx`

Three bouncing dots.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `color` | `string` | — | Dot color |

---

### PanelHeader

**File:** `components/open-claw/PanelHeader.jsx`

Icon + title bar with bottom border.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | `string` | — | Emoji or character |
| `title` | `string` | — | Header text (rendered uppercase, letter-spaced) |

---

### Section

**File:** `components/open-claw/Section.jsx`

Centered label + description + children wrapper. Used in the showcase page.

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | — | Section title |
| `desc` | `string` | — | Subtitle text |
| `children` | `ReactNode` | — | Content |

---

### OpenClawComponents

**File:** `components/open-claw/OpenClawComponents.jsx`

Demo showcase page. Imports mock data from `src/data/` and wires it into GatewayScreen, AgentCreator, and AgentChat. Includes OceanBg and Section wrappers. No props — this is the development/demo entry point.

---

## Mock Data Files

| File | Export | Used By | Shape |
|------|--------|---------|-------|
| `data/mock-agents.js` | `HQ_AGENTS` | LobsterHQ | `Agent[]` (6 agents with map positions) |
| `data/mock-agents.js` | `CHAT_AGENTS` | AgentChat | `ChatAgent[]` (6 agents with statuses) |
| `data/mock-agents.js` | `ACTIVITY_LOGS` | ActivityLog | `LogEntry[]` (12 entries, t: 0–22) |
| `data/mock-gateways.js` | `EXISTING_GATEWAYS` | GatewayScreen | `Gateway[]` (3 gateways, 2 online + 1 offline) |
| `data/mock-skills.js` | `ALL_SKILLS` | AgentCreator | `Skill[]` (12 skills across 5 categories) |
| `data/mock-responses.js` | `RESPONSES` | OpenClawComponents | `Record<agentId, string[]>` (2 responses per agent) |

---

## Shared Internals

**Palettes:** Each component group has its own `C` object in its `constants.js`. They share most colors but differ in a few UI-specific values (HQ has `uiBorderAlt`, open-claw has `inputBg`, `chatUser`, `chatAgent`, etc.).

**Styles:** `components/open-claw/styles.js` exports `panelStyle`, `labelStyle`, `inputStyle`, `counterStyle`, `btnPrimaryStyle(color)`, `btnSecondaryStyle`. These are used by GatewayScreen, AgentCreator, and AgentChat.

**Renderers:** `components/lobster-hq/renderers.js` exports all canvas draw functions. These are only used by LobsterHQ and are tightly coupled to its tilemap constants.
