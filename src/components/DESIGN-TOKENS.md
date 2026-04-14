# Design Token System

Three-layer architecture: **Primitives → Semantics → Tailwind classes**.

All tokens defined in `src/app/globals.css`. Never use raw oklch values in components — always use semantic Tailwind classes (`bg-primary`, `text-ai-accent`, etc.).

Primitives are defined in `:root` but NOT registered as Tailwind utilities — this enforces semantic-only usage. You cannot write `bg-neutral-50`; you must use `bg-muted` or `bg-secondary`.

## Component Structure (Atomic Design)

```
components/
├── ui/              # Atoms — shadcn primitives (button, badge, input, etc.)
├── molecules/       # Composed from atoms, single purpose
│   ├── cells/       # Grid cell renderers (status, currency, tags, etc.)
│   ├── chat/        # Chat message elements (message, reasoning, shimmer, etc.)
│   └── tool-cards/  # AI tool result cards
├── organisms/       # Complex self-contained sections
│   ├── grid/        # Data grid system
│   ├── chat/        # Chat panel orchestration
│   ├── layout/      # App sidebar, navbar
│   └── dashboard/   # Home page sections
```

---

## Layer 1: Primitives

Raw color values. Never change between themes. Defined once in `:root`.

### Neutral (achromatic, culori-generated)

| Token | Value | Usage |
|-------|-------|-------|
| `--white` | `oklch(1 0 0)` | Page backgrounds |
| `--neutral-50` | `oklch(0.978 0 0)` | Muted surfaces, foreground-on-dark |
| `--neutral-100` | `oklch(0.936 0 0)` | Borders, inputs |
| `--neutral-200` | `oklch(0.881 0 0)` | Charts |
| `--neutral-300` | `oklch(0.827 0 0)` | — |
| `--neutral-400` | `oklch(0.742 0 0)` | Ring, muted-foreground (dark) |
| `--neutral-500` | `oklch(0.648 0 0)` | Charts |
| `--neutral-600` | `oklch(0.573 0 0)` | Muted foreground, ring (dark) |
| `--neutral-700` | `oklch(0.469 0 0)` | Charts |
| `--neutral-800` | `oklch(0.394 0 0)` | Charts |
| `--neutral-900` | `oklch(0.320 0 0)` | — |
| `--neutral-950` | `oklch(0.238 0 0)` | Dark surfaces, charts |
| `--neutral-975` | `oklch(0.205 0 0)` | Primary, dark cards |
| `--neutral-1000` | `oklch(0.145 0 0)` | Foreground, dark background |
| `--black` | `oklch(0 0 0)` | Anchor (not used directly) |

### Alpha primitives

| Token | Value | Usage |
|-------|-------|-------|
| `--white-a5` through `--white-a15` | White at 5–15% opacity | Dark mode borders, glass overlays |
| `--black-a3` through `--black-a15` | Black at 3–15% opacity | Light mode overlays, glass borders |

### Color scales (Tailwind v4 defaults, 50–950 each)

| Scale | Hue | Mapped to semantic |
|-------|-----|--------------------|
| **Sky** | ~237 | AI / Korra identity |
| **Amber** | ~70–95 | User identity, warnings |
| **Red** | ~17–27 | Destructive / errors |
| **Green** | ~150–156 | Success |
| **Teal** | ~180–192 | Lookup / linked columns |
| **Emerald** | ~163–172 | Source / connected data |

---

## Layer 2: Semantic Tokens

Theme-aware values that reference primitives. Switch between light/dark via `.dark` class.

### Core (shadcn-compatible)

| Semantic | Light | Dark |
|----------|-------|------|
| `--background` | `white` | `neutral-1000` |
| `--foreground` | `neutral-1000` | `neutral-50` |
| `--primary` | `neutral-975` | `neutral-100` |
| `--primary-foreground` | `neutral-50` | `neutral-975` |
| `--secondary` | `neutral-50` | `neutral-950` |
| `--muted` | `neutral-50` | `neutral-950` |
| `--muted-foreground` | `neutral-600` | `neutral-400` |
| `--accent` | `neutral-50` | `neutral-950` |
| `--border` | `neutral-100` | `white-a10` |
| `--input` | `neutral-100` | `white-a15` |
| `--ring` | `neutral-400` | `neutral-600` |

### Status

| Semantic | Light | Dark |
|----------|-------|------|
| `--destructive` | `red-600` | `red-400` |
| `--destructive-muted` | `red-100` | `red-950` |
| `--success` | `green-600` | `green-400` |
| `--success-muted` | `green-100` | `green-950` |
| `--warning` | `amber-400` | `amber-400` |
| `--warning-muted` | `amber-100` | `amber-950` |

### AI identity (Korra)

| Semantic | Light | Dark | Tailwind class |
|----------|-------|------|----------------|
| `--ai` | `sky-600` | `sky-600` | `bg-ai` |
| `--ai-accent` | `sky-500` | `sky-400` | `text-ai-accent` |
| `--ai-muted` | `sky-100` | `sky-900` | `bg-ai-muted` |
| `--ai-muted-foreground` | `sky-700` | `sky-300` | `text-ai-muted-foreground` |
| `--ai-surface` | `sky-50` | `sky-950` | `bg-ai-surface` |
| `--ai-border` | `sky-200` | `sky-800` | `border-ai-border` |
| `--ai-shimmer` | `sky-400` | `sky-500` | `via-ai-shimmer` |

### User identity

| Semantic | Light | Dark | Tailwind class |
|----------|-------|------|----------------|
| `--user` | `amber-500` | `amber-500` | `bg-user` |
| `--user-muted` | `amber-100` | `amber-900` | `bg-user-muted` |
| `--user-muted-foreground` | `amber-700` | `amber-300` | `text-user-muted-foreground` |

### Lookup (linked columns)

| Semantic | Light | Dark | Tailwind class |
|----------|-------|------|----------------|
| `--lookup` | `teal-600` | `teal-600` | `bg-lookup` |
| `--lookup-accent` | `teal-500` | `teal-400` | `text-lookup-accent` |
| `--lookup-muted` | `teal-100` | `teal-900` | `bg-lookup-muted` |
| `--lookup-muted-foreground` | `teal-700` | `teal-300` | `text-lookup-muted-foreground` |
| `--lookup-surface` | `teal-50` | `teal-950` | `bg-lookup-surface` |
| `--lookup-border` | `teal-200` | `teal-800` | `border-lookup-border` |

### Source (connected data)

| Semantic | Light | Dark | Tailwind class |
|----------|-------|------|----------------|
| `--source` | `emerald-500` | `emerald-500` | `bg-source` |
| `--source-muted` | `emerald-100` | `emerald-900` | `bg-source-muted` |
| `--source-muted-foreground` | `emerald-700` | `emerald-300` | `text-source-muted-foreground` |
| `--source-surface` | `emerald-50` | `emerald-950` | `bg-source-surface` |
| `--source-border` | `emerald-200` | `emerald-800` | `border-source-border` |

---

## Layer 3: Usage in Components

### Common patterns

```tsx
// Korra avatar badge
<AvatarFallback className="bg-ai-muted text-ai-muted-foreground">

// User avatar badge
<AvatarFallback className="bg-user-muted text-user-muted-foreground">

// AI tool card icon
<Icon className="text-ai-accent" />

// Lookup column icon
<Link2Icon className="text-lookup-accent" />

// Lookup column row tint (with opacity)
"bg-lookup-muted/50 dark:bg-lookup-muted/20"

// Source tag badge
"border-source-border bg-source-surface text-source-muted-foreground"

// Autopilot toggle
"data-[state=checked]:bg-ai"

// Attribution indicator dot
isKorra ? "bg-ai-accent" : "bg-user"

// Featured template card
"border-ai-border bg-ai-surface/50 hover:bg-ai-surface"

// Filter/sort count badge (Korra vs user attribution)
attribution === "korra"
  ? "bg-ai-muted text-ai-muted-foreground"
  : "bg-user-muted text-user-muted-foreground"
```

### Status cell (data-driven colors)

Status cells use `color-mix()` for tinted backgrounds, supporting both hex (from data) and CSS vars (fallback):

```tsx
style={{
  backgroundColor: `color-mix(in oklch, ${displayColor} 8%, transparent)`,
  color: displayColor,
}}
```

Fallback color: `var(--neutral-600)`. Data colors (hex from API/Faker) are intentionally outside the token system.

---

## Other tokens

| Category | Tokens | Defined in |
|----------|--------|-----------|
| Typography | `--font-size-caption` through `--font-size-heading-xl` (10 steps) | `@theme inline` |
| Z-index | `--z-base`, `--z-raised`, `--z-popup`, `--z-modal` | `@theme inline` |
| Icon sizes | `--icon-xs` (14px) through `--icon-lg` (24px) | `@theme inline` |
| Layout | `--layout-sidebar-width`, `--layout-header-height`, `--layout-panel-gap` | `@theme inline` |
| Focus ring | `--focus-ring-width`, `--focus-ring-offset`, `--focus-ring-color` | `@theme inline` |
| Border radius | `--radius-sm` through `--radius-4xl` (calculated from `--radius`) | `@theme inline` |
| Motion (CSS) | 3 easings + 6 durations | `@theme inline` |
| Motion (JS) | Easings, durations, springs, transitions, fade, scaleIn, slideUp, stagger | `src/lib/motion.ts` |
| Glass surfaces | `surface-translucent`, `surface-inset`, `surface-overlay`, `border-glass`, `border-subtle` | globals.css (defined, not yet used) |
| Shadows | `shadow-glass`, `shadow-glow-blue`, `shadow-glow-green`, `shadow-elevated` | globals.css (defined, not yet used) |
| Glows | `glow-accent`, `glow-success` | globals.css (defined, not yet used) |
