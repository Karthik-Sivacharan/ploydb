# Home Dashboard Design

## Two-State Layout

Both states share the same `SidebarProvider` + `Sidebar` + `SidebarInset` shell.

### State 1 — Home (Full-Screen Chat)

```
┌──────────┬──────────────────────────────────┐
│ Sidebar  │                                  │
│          │      SidebarInset                │
│ Home     │      (empty for now —            │
│ Agents ▾ │       Korra chat + templates     │
│  ├ Web   │       will go here later)        │
│  │ Desig │                                  │
│  └ Data  │                                  │
│    Studio│                                  │
│ Ploybooks│                                  │
│ Connected│                                  │
│   Apps   │                                  │
│          │                                  │
│ [user]   │                                  │
└──────────┴──────────────────────────────────┘
```

**Sidebar nav hierarchy:**
- **Home** — workspace landing
- **Agents** (collapsible group, nested items)
  - Web Designer
  - Data Studio
- **Ploybooks** — saved AI workflows / prompt recipes
- **Connected Apps** — integrations (Google Sheets, Airtable, etc.)

### State 2 — Table View (After Template Selected)

```
┌────────────────┬───────────────────────────────┐
│  Korra Chat    │                               │
│  (sidebar      │      Data Grid (table)        │
│   becomes      │      fills SidebarInset       │
│   chat panel)  │                               │
│                │                               │
│  chat history  │                               │
│  carries over  │                               │
│                │                               │
│  input at      │                               │
│  bottom        │                               │
└────────────────┴───────────────────────────────┘
```

Original sidebar content swaps to Korra chat. Same Sidebar shell, different content. Animated crossfade via Motion.

## Components

**shadcn components used:**
- `sidebar` (SidebarProvider, Sidebar variant="inset", SidebarInset, SidebarHeader, SidebarContent, SidebarGroup, SidebarGroupLabel, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarMenuSub, SidebarMenuSubItem, SidebarFooter, SidebarRail, SidebarTrigger)
- `collapsible` (for nested Agents group)
- `avatar` (user footer)
- `separator` (between sidebar sections)
- `tooltip` (collapsed icon hints)

**Already installed:** avatar, badge, button, card, separator, skeleton, scroll-area, tooltip, tabs

**Need to install:** sidebar, collapsible

## Rules

- Only shadcn tokens (semantic: `bg-sidebar`, `text-sidebar-foreground`, etc.) — no hardcoded colors
- Only shadcn components — no custom primitives
- Sidebar variant: `"inset"`
- Collapsible: `"icon"` (collapses to icon-only rail)
