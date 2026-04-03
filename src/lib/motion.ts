/**
 * PloyDB Motion Design System
 *
 * Architecture: Tokens → Transitions → Variants → Presets
 *
 * 1. TOKENS      — raw values (easing curves, durations, springs)
 * 2. TRANSITIONS — composable transition objects built from tokens
 * 3. VARIANTS    — reusable enter/exit/state patterns (the building blocks)
 * 4. PRESETS     — feature-specific compositions for PloyDB surfaces
 *
 * Principles (from animations.dev):
 * - ease-out for enter/exit, ease-in-out for on-screen movement, ease for hover
 * - Never scale from 0 — always 0.95+ so elements have visible shape
 * - Exit 20% faster than enter
 * - Never animate keyboard navigation (arrow keys, Tab, Enter in the grid)
 * - CRM is used 100+ times/day — speed over spectacle
 */

import type { Transition, Variants } from "motion/react";

type Bezier = [number, number, number, number];

// ============================================================================
// 1. TOKENS — raw design values, single source of truth
// ============================================================================

/** Easing curves sorted weak → strong per category. */
export const easing = {
  /** Enter/exit: dropdowns, modals, tooltips, panels, cell popovers */
  out: {
    quad: [0.25, 0.46, 0.45, 0.94] as Bezier,
    cubic: [0.215, 0.61, 0.355, 1] as Bezier,
    quart: [0.165, 0.84, 0.44, 1] as Bezier,
    quint: [0.23, 1, 0.32, 1] as Bezier,
    expo: [0.19, 1, 0.22, 1] as Bezier,
  },
  /** On-screen movement: panel resize, column drag, row reorder */
  inOut: {
    quad: [0.455, 0.03, 0.515, 0.955] as Bezier,
    cubic: [0.645, 0.045, 0.355, 1] as Bezier,
    quart: [0.77, 0, 0.175, 1] as Bezier,
  },
  /** Hover states, color transitions, ambient state changes */
  ease: [0.25, 0.1, 0.25, 1] as Bezier,
} as const;

/** Duration tokens in seconds (Motion's native unit). */
export const dur = {
  instant: 0.1,
  micro: 0.15,
  fast: 0.2,
  normal: 0.25,
  slow: 0.3,
  ambient: 0.6,
} as const;

/** Spring presets using Apple's duration+bounce model. */
export const spring = {
  snappy: { type: "spring" as const, duration: 0.25, bounce: 0.05 },
  default: { type: "spring" as const, duration: 0.35, bounce: 0.1 },
  gentle: { type: "spring" as const, duration: 0.5, bounce: 0.15 },
  playful: { type: "spring" as const, duration: 0.6, bounce: 0.3 },
} as const;

// ============================================================================
// 2. TRANSITIONS — composable objects built from tokens
//    Pick one per animation. Exit gets a faster variant automatically.
// ============================================================================

function enterExit(
  enterDur: number,
  ease: Bezier,
): { enter: Transition; exit: Transition } {
  return {
    enter: { duration: enterDur, ease },
    exit: { duration: enterDur * 0.8, ease },
  };
}

export const transitions = {
  /** Micro-interactions: badge color, checkbox, cell focus ring */
  micro: enterExit(dur.instant, easing.ease),
  /** Standard UI: tooltips, dropdowns, cell edit popovers, select menus */
  fast: enterExit(dur.fast, easing.out.quart),
  /** Panels, modals, sheets: Korra panel, row detail, dialogs */
  normal: enterExit(dur.normal, easing.out.quint),
  /** Large surfaces: full overlays, page-level transitions */
  slow: enterExit(dur.slow, easing.out.quart),
  /** On-screen movement: column drag, row reorder, panel resize */
  move: enterExit(dur.fast, easing.inOut.cubic),
  /** Ambient: AI pulse, highlight fade, non-blocking background effects */
  ambient: enterExit(dur.ambient, easing.out.quad),
  /** Color/hover: status badge, tag tint, hover background */
  color: enterExit(dur.micro, easing.ease),
  /** Expand/collapse: diff view, accordion, collapsible sections */
  expand: {
    enter: {
      height: { duration: dur.normal, ease: easing.out.quart },
      opacity: { duration: dur.micro, delay: dur.instant, ease: easing.ease },
    },
    exit: {
      height: { duration: dur.fast, ease: easing.inOut.cubic },
      opacity: { duration: dur.instant, ease: easing.ease },
    },
  },
} as const;

// ============================================================================
// 3. VARIANTS — reusable animation patterns (the building blocks)
//    Each is a pure Motion `Variants` object. Combine them for features.
// ============================================================================

// -- Enter/Exit primitives ---------------------------------------------------

/** Fade only. Overlays, backdrops, skeleton→content crossfade. */
export const fade: Variants = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
};

/** Fade + scale from 0.95. Popovers, tooltips, dropdowns, context menus. */
export const scaleIn: Variants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 },
};

/** Fade + slide up. Chat messages, toast notifications, list items. */
export const slideUp: Variants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: 8 },
};

/** Fade + slide from left. Timeline entries, sidebar items. */
export const slideLeft: Variants = {
  initial: { opacity: 0, x: -12 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -8 },
};

/** Full slide from right edge. Panels, sheets (no fade — full-width surfaces). */
export const slideRight: Variants = {
  initial: { x: "100%" },
  animate: { x: 0 },
  exit: { x: "100%" },
};

// -- State primitives --------------------------------------------------------

/** Dim: reduce opacity + desaturate. For de-emphasizing non-focused elements. */
export const dim: Variants = {
  normal: { opacity: 1, filter: "saturate(1)" },
  dimmed: { opacity: 0.35, filter: "saturate(0.3)" },
};

/** Glow: subtle ring pulse. For highlighting focused/AI-edited elements. */
export const glow = (color = "var(--primary)"): Variants => ({
  normal: { boxShadow: `0 0 0 0px hsl(${color} / 0)` },
  highlighted: {
    boxShadow: [
      `0 0 0 0px hsl(${color} / 0)`,
      `0 0 0 2px hsl(${color} / 0.25)`,
      `0 0 0 1px hsl(${color} / 0.15)`,
    ],
  },
});

/** Pulse: background tint that fades to transparent. For AI activity on rows. */
export const pulse = (color = "var(--primary)"): Variants => ({
  active: { backgroundColor: `hsl(${color} / 0.12)` },
  idle: { backgroundColor: `hsl(${color} / 0)` },
});

/** Expand/collapse: height animation with delayed opacity. */
export const expandCollapse: Variants = {
  collapsed: { height: 0, opacity: 0, overflow: "hidden" },
  expanded: { height: "auto", opacity: 1, overflow: "hidden" },
};

/** Shake: subtle horizontal oscillation for rejection/error feedback. */
export const shake: Variants = {
  idle: { x: 0 },
  shaking: { x: [0, -2, 2, -2, 0] },
};

/** Press: scale down on active/press for tactile button feedback. */
export const press: Variants = {
  idle: { scale: 1 },
  pressed: { scale: 0.97 },
};

/** Dot: scale in/out for indicator dots (auto mode, status, presence). */
export const dot: Variants = {
  off: { scale: 0, opacity: 0 },
  on: { scale: 1, opacity: 1 },
};

/** Line grow: vertical line that scales from top. Timeline connectors. */
export const lineGrow: Variants = {
  initial: { scaleY: 0, transformOrigin: "top" },
  animate: { scaleY: 1 },
};

// -- Stagger -----------------------------------------------------------------

/** Stagger parent. Wrap around a list of children using any enter variant. */
export const stagger = (delay = 0.04): Variants => ({
  animate: { transition: { staggerChildren: delay } },
});

// ============================================================================
// 4. PRESETS — feature-specific compositions for PloyDB
//    Each preset bundles a variant + its recommended transition.
//    Use these directly — they're the "done" answer for each surface.
// ============================================================================

export const presets = {
  // -- Grid surfaces ---------------------------------------------------------

  /** Cell edit popover, select dropdown, date picker */
  cellPopover: { variants: scaleIn, ...transitions.fast },
  /** Column header dropdown, context menu */
  gridMenu: { variants: scaleIn, ...transitions.fast },
  /** Tooltip on cell hover */
  tooltip: { variants: scaleIn, ...transitions.fast },

  // -- Panels & sheets -------------------------------------------------------

  /** Korra AI chat panel (right side) */
  korraPanel: { variants: slideRight, ...transitions.normal },
  /** Row detail sheet */
  rowDetail: { variants: slideRight, ...transitions.normal },
  /** Modal dialog (add column, confirm delete) */
  dialog: { variants: scaleIn, ...transitions.normal },
  /** Overlay/backdrop behind panels and dialogs */
  overlay: { variants: fade, ...transitions.normal },

  // -- Chat & cards ----------------------------------------------------------

  /** Chat messages in Korra panel */
  chatMessage: { variants: slideUp, ...transitions.fast },
  /** Dry-run preview card, edit summary card */
  chatCard: {
    variants: {
      initial: { opacity: 0, y: 12, scale: 0.98 },
      animate: { opacity: 1, y: 0, scale: 1 },
      exit: { opacity: 0, y: -8, scale: 0.98 },
    } satisfies Variants,
    ...transitions.fast,
  },
  /** Diff view expanding from edit summary card */
  diffView: { variants: expandCollapse, ...transitions.expand },
  /** Approve button on dry-run card */
  approve: { variants: press, transition: transitions.fast.enter },
  /** Reject feedback on dry-run card */
  reject: { variants: shake, transition: { duration: dur.fast } },

  // -- AI trust signals ------------------------------------------------------

  /** Row highlight when Korra updates cells */
  aiPulse: { variants: pulse(), ...transitions.ambient },
  /** Highlight Changes Mode: dim non-AI cells */
  highlightDim: { variants: dim, transition: transitions.color.enter },
  /** Highlight Changes Mode: glow ring on AI-edited cells */
  highlightGlow: { variants: glow(), transition: transitions.slow.enter },
  /** Cell attribution badge (who last edited) */
  attributionBadge: {
    variants: {
      initial: { opacity: 0, scale: 0.95, y: -4 },
      animate: { opacity: 1, scale: 1, y: 0 },
      exit: { opacity: 0, scale: 0.95 },
    } satisfies Variants,
    ...transitions.fast,
  },
  /** Auto Mode indicator dot in chat panel */
  autoMode: { variants: dot, transition: spring.snappy },

  // -- Timeline & history ----------------------------------------------------

  /** Version timeline entry (git-style history) */
  timelineEntry: { variants: slideLeft, ...transitions.fast },
  /** Timeline connector line between entries */
  timelineLine: { variants: lineGrow, transition: transitions.normal.enter },
  /** Timeline stagger container */
  timelineList: { variants: stagger(0.05) },

  // -- General stagger -------------------------------------------------------

  /** Stagger parent for chat messages, filter chips, list items */
  list: { variants: stagger(0.04) },
  /** Stagger parent with tighter delay for grid rows on filter */
  gridRows: { variants: stagger(0.02) },
} as const;

// ============================================================================
// 5. ACCESSIBILITY — reduced motion support
// ============================================================================

/**
 * Zero-duration transition for reduced motion users.
 *
 * @example
 * ```tsx
 * import { useReducedMotion } from "motion/react";
 * import { presets, noMotion } from "@/lib/motion";
 *
 * function MyPopover() {
 *   const reduced = useReducedMotion();
 *   const { variants, enter, exit } = presets.cellPopover;
 *   return (
 *     <motion.div
 *       variants={variants}
 *       initial={reduced ? false : "initial"}
 *       animate="animate"
 *       exit={reduced ? undefined : "exit"}
 *       transition={reduced ? noMotion : enter}
 *     />
 *   );
 * }
 * ```
 */
export const noMotion: Transition = { duration: 0 };
