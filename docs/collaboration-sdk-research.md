# Collaboration SDK Research — AI Agent + Human Collab UI

> Researched 2026-04-03. Goal: find SDKs to show human + AI agent collaboration in PloyDB's data grid.

---

## TL;DR

| Tool | AI Agent Story | Best For PloyDB | Free Tier |
|---|---|---|---|
| **Liveblocks** | First-class AI agent presence — agents as users with cursors, avatars, status | Agent presence + cursors in the grid | 500 monthly active rooms |
| **CopilotKit** | Human-in-the-loop approve/reject, generative UI, state sync | Korra's dry-run cards, tool call UI | 50 MAUs (open source, self-host unlimited) |
| **assistant-ui** | Multi-agent chat, built-in Diff Viewer, shadcn-compatible | Korra chat panel components | Free / open source |
| **Velt** | No AI agent presence, great comments/presence/cursors for humans | Cell-level comments, multiplayer feel | 100 MADs (dev only) |
| **Tiptap AI Toolkit** | Track-changes UI, edit boundaries, audit logs | Design reference only | Add-on pricing |
| PartyKit | Low-level WebSocket rooms, built-in LLM generation | Overkill for prototype | Free tier |
| SuperViz | **Shutting down** — pivoting to Noira | Don't use | N/A |
| Ably / Pusher | No collaboration UI, just pub/sub | Not relevant | Free tiers |

---

## Velt (velt.dev)

### What It Is
Drop-in collaboration SDK. React package: `@veltdev/react`. Wrap app in `<VeltProvider>`, authenticate users, drop in components.

### Features Relevant to PloyDB

| Feature | Component | How It Helps |
|---|---|---|
| Presence | `<VeltPresence>` | Avatar bubbles of who's viewing the table (including Korra as a "user") |
| Live Cursors | `<VeltCursor>` | See Korra's cursor moving to cells she's editing |
| Live Selection | `data-velt-live-selection-enabled` | Highlight which cell Korra is focused on |
| Popover Comments | `<VeltComments popoverMode>` | Google Sheets-style cell comments — triangle indicator, reply threads per cell |
| Comment Bubbles | `<VeltCommentBubble>` | Unread/reply counts per cell |
| Notifications | `<VeltNotificationsTool>` | Alert when Korra comments on a cell |
| Live State Sync | `useLiveState()` | Sync table state across tabs/users in real-time |
| Huddle | `<VeltHuddle>` | Voice/video while working on data (stretch) |
| Follow Me | Built-in | Follow Korra's viewport during demo |

### What Velt Does NOT Solve
- Cell-level edit attribution (who last edited this cell) — no built-in change tracking
- Audit trail / version timeline UI
- AI reasoning in audit entries
- Dry-run preview cards
- Diff view (red/green/yellow)
- Wave fill animation
- Ploybook/Skill tags

### AI Agent Support — Limited
- **No dedicated AI agent features.** No "agent trail" product found.
- **AI Copilot/Rewriter** — text highlighting + AI rewrite (not what we need)
- **MCP Servers** — lets AI coding agents manage comments via REST API
- **Workaround:** Register Korra as a Velt user (`identify({ userId: "korra-ai", name: "Korra" })`) — she shows up in presence, cursors, comments. Not first-class, but works.

### Pricing
- **Free (Hacker):** 100 Monthly Active Documents — dev environments only
- **Growth / Enterprise:** Custom pricing, usage-based (MADs, not per-seat)

---

## Liveblocks (liveblocks.io) — STRONGEST AI AGENT SUPPORT

### What It Is
Real-time collaboration infrastructure. Direct Velt competitor but with **first-class AI agent APIs** (launched with Liveblocks 3.0).

### AI Agent Features (Dedicated Product)
- **AI Agents product** at `liveblocks.io/ai-agents`
- **Agent Presence API** — `setPresence()` for agent cursor position, status, avatar, color
- **`<AiChat />` component** — drop-in chat UI with backend logic
- **`RegisterAiTool` / `RegisterAiKnowledge`** — React components to give agents tools and context
- **Feeds API** — real-time message lists within rooms for agent communication
- **`useOthers()` hook** — returns both human AND AI users for presence UIs
- Compatible with **LangChain, n8n, CrewAI**, or custom agent setups
- Works with any LLM (OpenAI, Claude, Gemini)

### How It Maps to PloyDB

| Feature | PloyDB Use |
|---|---|
| Agent in `useOthers()` | Korra's avatar in the presence bar alongside human users |
| Agent cursor via `setPresence()` | Korra's cursor visibly moves through cells as she edits them |
| Agent status | "Korra is thinking..." / "Korra is editing Priority column" |
| `<AiChat />` | Could replace custom Korra panel (or use alongside) |
| `RegisterAiTool` | Define editCells, filterBy, sortBy as agent tools |
| Feeds API | Activity feed of agent actions |

### Pricing
- **Free:** 500 monthly active rooms (AI Agents included)
- **Pro:** ~$29/mo
- **Enterprise:** Custom

---

## CopilotKit (copilotkit.ai) — BEST FOR IN-APP AI AGENT UX

### What It Is
Open-source (MIT) framework for building in-app AI copilots. React + Next.js + Vue. Created the **AG-UI protocol** (adopted by Google, LangChain, AWS, Microsoft, Mastra, PydanticAI).

### Features Directly Relevant to PloyDB

| Feature | PloyDB Mapping |
|---|---|
| **Human-in-the-loop** | Built-in approve/reject flows → dry-run preview cards |
| **Generative UI** (5 flavors) | Tool results render as custom React components → diff cards, edit summaries |
| **`useCopilotAction()`** | Define Korra's tools (editCells, filterBy, addColumn) |
| **`useCopilotReadable()`** | Expose grid state/data to Korra |
| **State synchronization** | Agent and UI share application state |
| **CLHF** | Agents learn from user corrections (Step 3 of happy path) |
| **Observability** | Visualize agent event streams, trace decisions |

### What It Does NOT Do
- No presence/cursors/comments (not a collaboration SDK)
- No multiplayer features
- Focused purely on the AI agent UX layer

### Pricing
- **Free:** 50 MAUs (self-host = unlimited, open source)
- **Teams:** Per-seat
- **Enterprise:** From $5K/mo

---

## assistant-ui (assistant-ui.com) — BEST CHAT UI COMPONENTS

### What It Is
Open-source TypeScript/React library for AI chat interfaces. Composable primitives inspired by **shadcn/ui** (same design system as PloyDB).

### Features Directly Relevant to PloyDB

| Feature | PloyDB Mapping |
|---|---|
| **Diff Viewer component** | Built-in before/after diff display → edit summary cards |
| **Multi-agent support** | Show Korra + user in same thread |
| **Generative UI** | Custom React components in messages |
| **Message branching** | Explore alternate Korra responses |
| **Real-time streaming** | Auto-scroll, streaming text |
| **Vercel AI SDK adapter** | Works with your existing `useChat` setup |
| **shadcn-compatible** | Same design tokens, same component style |

### What It Does NOT Do
- No presence/cursors (not a collaboration SDK)
- No grid/table features
- Chat panel only

### Pricing
- **Free / open source**

---

## Tiptap AI Toolkit (tiptap.dev) — DESIGN REFERENCE

### What It Is
Rich text editor with AI editing features. Not directly usable for data grids, but the **trust signal patterns are the gold standard**.

### Patterns to Steal for PloyDB
- **Track-changes UI** — review all AI edits before accepting (red/green diff inline)
- **Edit boundaries** — define what AI can/cannot edit (map to locked columns)
- **Contextual comments** — AI explains its modifications inline
- **Version history + instant rollback**
- **Audit logs** of all changes with attribution
- **Real-time streaming** of AI edits visible to other users

---

## Ideas: Combining Tools for PloyDB

### Idea 1: Liveblocks + assistant-ui (Full Demo Impact)
- **Liveblocks** for: Korra's cursor in the grid, presence avatar, agent status
- **assistant-ui** for: Chat panel with diff viewer, streaming, shadcn compatibility
- **Custom (Motion)** for: Wave animation, cell attribution badges, audit trail
- Result: Korra feels like a real collaborator — her cursor moves, her avatar is present, her edits stream in

### Idea 2: CopilotKit + Velt (AI Logic + Collaboration Feel)
- **CopilotKit** for: Human-in-the-loop, generative UI, tool definitions, state sync
- **Velt** for: Cell-level comments (Korra leaves reasoning), presence bar, notifications
- **Custom (Motion)** for: Wave animation, attribution badges, audit trail
- Result: Strong AI UX patterns (approve/reject) + collaboration feel (comments, presence)

### Idea 3: Lightweight — Vercel AI SDK + assistant-ui + Custom (Fastest to Build)
- **Vercel AI SDK** (already in stack) for: Agent communication, tool calling
- **assistant-ui** for: Chat panel, diff viewer
- **Custom React + Motion** for: Everything else (presence simulation, cursors, attribution, audit trail)
- Result: Least dependencies, most control, fastest iteration. Simulate multiplayer feel without real collab infrastructure.

### Idea 4: Liveblocks Only (Simplest Single-SDK Path)
- Liveblocks has presence, cursors, AI agents, comments, notifications, AND `<AiChat />`
- One SDK for everything collaborative
- Still need custom: attribution badges, diff view, audit trail, wave animation
- Result: Single vendor, clean integration, AI-first design

---

## Specific Feature Ideas Using These Tools

### Korra's Live Cursor (Liveblocks)
When Korra edits 200 rows, her cursor visibly moves through cells via `setPresence({ cursor: { x, y } })`. Combined with wave animation = "I can see the AI working."

### Cell Comments as AI Reasoning (Velt)
Korra leaves popover comments on cells she edits: "Set to High — VP title at 500+ company." Triangle indicator appears. Click to see reasoning **where the data lives.**

### Approve/Reject with Generative UI (CopilotKit)
Dry-run preview renders as a custom React component in chat (not just text). Shows a mini-table with 5 rows. Approve button triggers bulk execution. Reject asks for corrections.

### Diff Viewer in Chat (assistant-ui)
After bulk edit, render a `<DiffViewer>` component inline in chat showing red/green/yellow per cell. Already built — just wire to your edit data.

### Follow Mode During Demo (Velt or Liveblocks)
During happy path demo, Korra's viewport actions (filter, sort, scroll) automatically followed by the user. Creates a "guided tour" feel.

### Human Override → Comment Thread (Velt)
User changes Korra's value → auto-create comment thread:
- Korra: "I set this to Low based on company size"
- You: *(changed to High)*
- Korra: "Got it — applying to all healthcare contacts"

### Notifications: "Korra updated 47 cells" (Velt or Liveblocks)
Push notification when Korra completes bulk operations. Click → scroll to affected rows.

---

## Recommendation (UPDATED)

~~**Previous:** Vercel AI SDK + assistant-ui + custom Motion animations.~~

**Final decision: Skip assistant-ui. Use Vercel AI Elements instead.**

---

## Vercel AI Elements — Official shadcn Chat Components

> Discovered 2026-04-03. This replaces the need for assistant-ui entirely.

Vercel's own team ships a **shadcn registry** of chat UI components built specifically for the AI SDK. They install as owned source files (same pattern as tablecn). No extra dependency.

### Install

```bash
npx shadcn@latest add https://elements.ai-sdk.dev/api/registry/all.json
# or individual:
npx shadcn@latest add @ai-elements/prompt-input
npx shadcn@latest add @ai-elements/conversation
npx shadcn@latest add @ai-elements/message
npx shadcn@latest add @ai-elements/suggestion
```

### Components Available

| Component | Subcomponents | Purpose |
|---|---|---|
| **PromptInput** | `PromptInputTextarea`, `PromptInputFooter`, `PromptInputTools`, `PromptInputSubmit`, `PromptInputButton`, `PromptInputActionMenu`, `PromptInputSelect` | Auto-resizing textarea + action bar (skills, attachment, send) |
| **Conversation** | `ConversationContent`, `ConversationEmptyState`, `ConversationScrollButton` | Auto-scrolling message container with empty state |
| **Message** | `MessageContent`, `MessageResponse` (markdown + GFM + math), `MessageActions` (copy, retry, like/dislike), `MessageBranch` | Message rendering with actions |
| **Suggestion** | — | Clickable suggestion chips (horizontal scroll) |
| **Reasoning** | — | Collapsible chain-of-thought / thinking UI |
| **Confirmation** | — | Approve/reject cards (dry-run previews) |
| **Sources** | — | Citation display |

### Mapping: PloyDB Homepage (Linear/Gumloop style) → Components

| UI Element | Component | From |
|---|---|---|
| "Hey Karthik, how can I help?" heading | Plain `<h1>` | HTML/Tailwind |
| Large auto-resizing textarea | **`PromptInput`** + `PromptInputTextarea` | AI Elements |
| Action bar (Skills, attachment, @, send) | **`PromptInputFooter`** + `PromptInputTools` + `PromptInputSubmit` | AI Elements |
| Template cards ("Prioritize stale leads") | **`Suggestion`** | AI Elements |
| Connected apps banner | `Badge` + `Avatar` | shadcn (already installed) |
| Recent chats list | `Button variant="ghost"` in a stack | shadcn (already installed) |

### Mapping: Korra Chat Panel (after transition) → Components

| UI Element | Component | From |
|---|---|---|
| Streaming message list + auto-scroll | **`Conversation`** + `ConversationContent` | AI Elements |
| Empty state | **`ConversationEmptyState`** | AI Elements |
| Message bubbles (user + Korra) | **`Message`** + `MessageContent` + `MessageResponse` | AI Elements |
| Message actions (copy, retry) | **`MessageActions`** | AI Elements |
| Korra's reasoning/thinking | **`Reasoning`** | AI Elements |
| Dry-run approve/reject card | **`Confirmation`** | AI Elements |
| Tool call results (filter, sort, edit) | Custom components in `message.parts` switch | Your code (React + shadcn) |
| Diff view for edit summaries | Custom mini-table component | Your code |
| Ploybook/Skill tags near input | `Badge` + `DropdownMenu` inside `PromptInputTools` | shadcn |

### Why AI Elements over assistant-ui

| Concern | AI Elements | assistant-ui |
|---|---|---|
| Made by | Vercel (same team as `useChat`) | Third-party |
| Extra dependency | None | `@assistant-ui/react` + adapter |
| shadcn source files | Yes (registry install) | Yes |
| `useChat` integration | Native | Via adapter layer |
| Approve/reject | `Confirmation` component | `addResult()` API |
| Reasoning/thinking | `Reasoning` component | `Reasoning` component |

### Vercel AI SDK (`useChat`) — What It Provides

`useChat` from `@ai-sdk/react` is purely hooks — no UI. It returns:

| Property | Purpose |
|---|---|
| `messages` | Full conversation (with typed parts: text, tool calls, reasoning) |
| `sendMessage()` | Submit user message |
| `status` | `ready` / `submitted` / `streaming` / `error` |
| `stop()` | Abort streaming |
| `addToolOutput()` | Provide client-side tool result |
| `addToolApprovalResponse()` | Approve/deny tool execution (dry-run flow) |

Tool calls appear as typed parts in messages with states: `input-streaming` → `input-available` → `approval-requested` → `output-available`. The `approval-requested` state is exactly the dry-run preview flow.

---

## Final Stack Decision

```
State:       useChat (Vercel AI SDK) — agent communication, tool calling, streaming
Chat UI:     AI Elements (shadcn registry) — PromptInput, Conversation, Message, Suggestion, Confirmation, Reasoning
Primitives:  shadcn/ui (already installed) — Badge, Avatar, Card, Button, DropdownMenu, etc.
Animation:   Motion (already installed) — layout transitions, wave fill, cell highlights
Grid Collab: Custom React + Motion — Korra cursor, cell highlights, attribution badges, cell comments, audit trail
```

No Liveblocks, no CopilotKit, no assistant-ui, no Velt. Zero new dependencies beyond what Vercel AI SDK + shadcn already provide.
