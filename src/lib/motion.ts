/**
 * PloyDB Motion Design System
 *
 * Architecture: Tokens → Transitions → Variants
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
  },
  /** On-screen movement: panel resize, column drag, row reorder */
  inOut: {
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
  /** Panels, modals, sheets: chat panel, row detail, dialogs */
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
// 3. VARIANTS — reusable animation patterns
// ============================================================================

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

/** Stagger parent. Wrap around a list of children using any enter variant. */
export const stagger = (delay = 0.04): Variants => ({
  animate: { transition: { staggerChildren: delay } },
});

// ============================================================================
// 4. ACCESSIBILITY — reduced motion support
// ============================================================================

/** Zero-duration transition for reduced motion users. */
export const noMotion: Transition = { duration: 0 };

// ============================================================================
// 5. LAYOUT TIMING
// ============================================================================

/**
 * Delay (in ms) before mounting the split-view data grid after collapsing
 * the sidebar. The sidebar CSS transition is 200ms, but the grid mount
 * triggers expensive layout work that can cause jank if it overlaps.
 * 450ms = 200ms animation + 250ms settling buffer.
 */
export const SIDEBAR_COLLAPSE_DELAY_MS = 450;
