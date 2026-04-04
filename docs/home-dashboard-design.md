# Home Dashboard Design

## Two-State Layout

Both states share the same `SidebarProvider` + `Sidebar` + `SidebarInset` shell.

### State 1 — Home (Sidebar + Empty Content) ✅

```
┌──────────┬──────────────────────────────────┐
│ Sidebar  │                                  │
│          │      SidebarInset                │
│ Home     │      (placeholder content)       │
│ Agents ▾ │                                  │
│  ├ Web   │                                  │
│  │ Desig │                                  │
│  └ Data  │                                  │
│    Studio│                                  │
│ Ploybooks│                                  │
│ Connected│                                  │
│   Apps   │                                  │
│ [theme]  │                                  │
│ [user]   │                                  │
└──────────┴──────────────────────────────────┘
```

**Sidebar nav hierarchy:**
- **Home** — workspace landing (plain button, no dropdown) ✅
- **Agents** (collapsible group, nested items) ✅
  - Web Designer
  - Data Studio
- **Connected Apps** (plain button, no dropdown) ✅
- **Ploybooks** section (4 items, no menus) ✅
  - Web Design Audit
  - Client Health Assessment
  - Lead Prioritization
  - Deal Pipeline Review
- **Theme toggle** (Dark/Light mode, hydration-safe) ✅
- **User profile** (Karthik) ✅

### State 2 — Database View (Chat + Table side by side)

```
┌──────────┬────────────────┬───────────────────────┐
│ Sidebar  │  Chat Panel    │    Data Grid           │
│ (nav)    │  (fixed width, │    (flex-1, fills      │
│          │   resizable)   │     remaining space)   │
│          │                │                        │
│          │  messages...   │    table rows...        │
│          │                │                        │
│          │  [input]       │                        │
└──────────┴────────────────┴───────────────────────┘
```

Triggered when user clicks Data Studio or selects a database template. Sidebar stays as nav. Inside SidebarInset, a flex row with chat panel (fixed width) + data grid (flex-1).

### State 3 — Home with Korra Chat (future)

Full-screen chat centered in SidebarInset with template cards below input. Selecting a template transitions to State 2.

---

## Completed ✅

- [x] shadcn sidebar-07 block installed and customized
- [x] Fix Tailwind v4 CSS variable syntax (`w-[--var]` → `w-[var(--var)]`)
- [x] Sidebar nav: Home, Agents (Web Designer, Data Studio), Connected Apps
- [x] Ploybooks section (4 items, no dropdown menus)
- [x] "Ploy" branding in sidebar header with Hexagon icon
- [x] Theme toggle in sidebar footer (hydration-safe, collapses to icon)
- [x] User profile in sidebar footer
- [x] Dynamic breadcrumb header (shows "Home")
- [x] Dashboard is now root page (`/`), data grid moved to `/database`
- [x] Collapsible sidebar (icon-only mode)
- [x] Deployed to Vercel

## Remaining

### Home Content (State 1 polish)
- [ ] Korra chat centered in SidebarInset (Vercel AI SDK `useChat`)
- [ ] Template cards below chat input ("Prioritize stale leads", "Clean up contacts", etc.)
- [ ] Clicking template populates chat and transitions to State 2

### Database View (State 2)
- [ ] Extract data grid into self-contained `DatabaseView` client component
- [ ] `activeView` client state to toggle between home and database view
- [ ] Chat panel inside SidebarInset (left of data grid, fixed/resizable width)
- [ ] Sidebar nav clicks (Data Studio) switch to database view

### Chat Panel (Korra)
- [ ] Chat message list with streaming text
- [ ] Korra avatar + typing indicator
- [ ] Input area with send button
- [ ] MockModel for pre-scripted demo responses
- [ ] Tool call bridge to data grid (editCells, filterBy, sortBy, etc.)

### Korra Personality Animations (Nice-to-Have)
- [ ] Subtle waterbending/spirit-world-inspired animations (particles, glows, shaders) to give the AI agent Korra's personality from The Legend of Korra — see `docs/korra-animation-research.md`

### Routing
- [ ] Wire sidebar nav items to actual views (currently all `#`)
- [ ] Breadcrumb updates based on active view

---

## Routes

| Path | Content |
|---|---|
| `/` | Home dashboard (sidebar + SidebarInset) |
| `/database` | Standalone data grid (legacy, kept as fallback) |

---

## Rules

- Only shadcn tokens (semantic: `bg-sidebar`, `text-sidebar-foreground`, etc.) — no hardcoded colors
- Only shadcn components — no custom primitives
- Sidebar collapsible: `"icon"` (collapses to icon-only rail)
- Tailwind v4: use `w-[var(--css-var)]` not `w-[--css-var]` for CSS variable references
