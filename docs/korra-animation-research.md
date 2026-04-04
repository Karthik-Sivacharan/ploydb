# Korra-Inspired Animation Research

Korra (the AI agent) is named after Avatar Korra from The Legend of Korra. These are animation ideas to give the UI her personality — water/spirit aesthetic, confident motion, subtle but alive.

---

## Color Palette

| Token | Hex | Use |
|---|---|---|
| `--korra-blue` | `#0077B6` | Primary brand, sidebar accents |
| `--korra-cyan` | `#00B4D8` | Interactive highlights, links |
| `--avatar-glow` | `#00E5FF` | AI activity, thinking state, particles |
| `--korra-navy` | `#1B3A5C` | Dark backgrounds, depth |
| `--korra-ice` | `#90E0EF` | Subtle tints, hover states |
| `--spirit-gold` | `#FFB700` | Success, approval, positive actions |
| `--spirit-magenta` | `#C850C0` | Warnings, attention states |

Source: Water Tribe blues, Avatar State white-cyan glow, Spirit World gold/magenta.

---

## Animation Ideas

### 1. Avatar State Thinking Indicator
Pulsing white-cyan glow on Korra's avatar when processing. `box-shadow: 0 0 20px rgba(0, 229, 255, 0.6)` breathing between 0.3–0.8 opacity. Like the Avatar State eye flash.

### 2. Spirit World Ambient Particles
10–15 slow-drifting cyan motes (`#00E5FF` at ~30% opacity) behind the home dashboard or chat area. Sine-wave paths, like spirit world fireflies.

### 3. Water Bending Motion Curves
All Korra UI uses fluid easing — `spring({ damping: 12, stiffness: 200 })`. Slight overshoot (her impulsiveness). Elements enter at `scale(0.95)` not `scale(0)` — Korra doesn't tiptoe. 200–350ms durations.

### 4. Spirit Beam Completion Effect
On batch operations (e.g. updating 200 rows), a vertical cyan-to-white beam flashes briefly from the action point. Expanding radial ripple rings. 400ms. Inspired by Harmonic Convergence.

### 5. Healing Glow on Data Fixes
When Korra fills missing fields or corrects values, cells get a soft pulsing cyan glow (`#00B4D8`) that fades — like waterbending healing. 2–3 pulses then dissipate.

### 6. Cell Update Wave
Batch column fills stagger top-to-bottom (~30ms per row) with a brief cyan flash per cell. Water flowing down.

### 7. Frosted Ice Cards
Chat message cards use `backdrop-blur-md bg-white/10 border border-white/20` — polished Water Tribe ice. Dark mode: `bg-[#1B3A5C]/20 border-[#00B4D8]/10`.

---

## Libraries to Use

All shadcn-registry-compatible unless noted.

### Magic UI — magicui.design
- **Particles** — floating particles, color-configurable (set to cyan)
- **Border Beam** — orbiting glow beam (Avatar State on cards/inputs)
- **Shine Border** — pulsing shine on containers
- **Ripple** — expanding ripple on click
```bash
npx shadcn@latest add "https://magicui.design/r/particles"
npx shadcn@latest add "https://magicui.design/r/border-beam"
```

### Aceternity UI — ui.aceternity.com
- **Aurora Background** — cyan-to-purple shifting aurora (spirit world sky)
- **Background Beams** — radiating SVG beams (spirit beam)
- **Wavy Background** — flowing wave animation (waterbending)
- **Sparkles** — configurable sparkle particles
- **Background Ripple Effect** — water ripple
- **Tracing Beam** — scroll-following glow beam

### Animate UI — animate-ui.com
Animated versions of Radix/shadcn primitives (no conflicts with existing components):
- **Bubble Background**, **Gradient Background**, **Particles Effect**, **Shine Effect**
```bash
npx shadcn@latest add "https://animate-ui.com/r/particles"
```

### Motion Primitives — motion-primitives.com
Listed in official shadcn registry directory:
- **Border Trail** — animated glowing border orbiting a container (thinking state)
- **Text Shimmer** — shimmering text (cyan shimmer on "Korra is thinking...")

### shadcn.io Shaders — shadcn.io/shaders
58 GPU-accelerated shader components, SSR-compatible with Next.js App Router:
- **Water shader** — fractal noise, fresnel, caustics at 60fps
- **Sea shader** — ocean surface
- **Aurora shader** — northern lights
- **Ripples** — interactive ripple effect
```bash
npx shadcn@latest add "https://shadcn.io/r/water-shader.json"
```

### shadcn.io Backgrounds — shadcn.io/background
44+ animated backgrounds:
- **Underwater**, **Fireflies**, **Aurora**, **Wavy**, **Light Waves**, **Sparkles**, **Ripple**

### tsParticles — particles.js.org
Most configurable particle system. Has a firefly preset.
```bash
npm install @tsparticles/react @tsparticles/slim
```

### Vanta.js — vantajs.com
3D WebGL backgrounds. WAVES effect with cyan = animated water surface.
```bash
npm install vanta three
```

### React Three Fiber + Drei
Nuclear option for custom shaders: `<Caustics>`, `<Stars>`, `<Sparkles>`, `<Cloud>`, `<Float>`, `MeshWobbleMaterial`.
```bash
npm install @react-three/fiber @react-three/drei three
```

---

## Recommended Starting Point

| Effect | Pick | Why |
|---|---|---|
| Home dashboard particles | Magic UI Particles | shadcn registry, lightweight |
| Korra thinking border glow | Magic UI Border Beam | orbiting glow on chat input |
| Home background | Aceternity Aurora Background or shadcn.io Water Shader | spirit world / waterbending feel |
| Batch complete beam | Aceternity Background Beams | vertical burst, one-shot |
| Chat cards | Tailwind `backdrop-blur` | frosted ice, zero deps |
| "Korra is typing" shimmer | Motion Primitives Text Shimmer | official shadcn directory |
| Wave on chat input | Aceternity Wavy Background | water-feel beneath input |

---

## Motion Personality (from Korra's character)

| Trait | Animation Rule |
|---|---|
| Confident | Elements enter boldly — scale 0.95→1.0, not 0→1. Short durations (200–350ms). |
| Fluid | All transitions use water-bending curves, never linear. |
| Impulsive | Slight overshoot on interactive elements — spring with moderate damping. |
| Determined | Loading states push forward, progress never stutters. |
| Warm (later seasons) | Rounded corners, soft glows, warm color shifts on positive states. |
