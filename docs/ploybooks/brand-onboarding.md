# Brand Onboarding

**Scope:** Global
**Tags:** onboarding, brand, ftu, design-system, first-time-user

First-time user onboarding: path-specific workflows and task description templates for design system extraction, website cloning, and SEO auditing.

---

## Path: Website

### Step 1 — Educate + Ask Intent

Research is pre-loaded. Do NOT dispatch a research agent — use the pre-loaded research from the conversation history.

1. Call `ftuEducation({ path: "website" })`
2. Immediately after, present a blocking single-select askUser asking what the user wants to do with their existing site. Options:
   - "Clone my site into Ploy" (import and edit directly in Ploy)
   - "Just pull in the design system" (extract colors, fonts, components and start fresh)
   - "Something else..." (free input)
3. End your turn.

### Step 2 — After User Answers Intent

Map the user's answer:

**Clone intent ("Clone my site into Ploy"):**
- Create an engineer agent, create a clone task using the Clone Task Template, dispatch
- Tell user: "I'm cloning {hostname} and setting up your design system — I'll let you know when it's ready."

**Design-only or "Something else" intent:**
- Create a design-engineer agent, create a design task using the Design Task Template (website variant), dispatch
- Tell user about design extraction progress

### Step 3 — After Use-Case Answer (or skip)

If the user's multi-select response includes the SEO option (e.g., contains "Improve my search rankings"):
- Create an agent, create an SEO task using the SEO Audit Template, dispatch
- Tell user: "Got it — I've kicked off an SEO audit. I'll fold the findings into your suggestions once the design system is ready."

If the user answered with other selections: acknowledge briefly. If the question was skipped (timer expired): continue without comment. Selections (if any) inform ploy suggestions later.

Wait for agents -> Wake Handling -> post-work approval -> Suggest Ploys (system prompt).

---

## Path: Figma

### Step 1 — Gather Context

Check if Figma is connected. If not connected, tell the user to connect Figma using the button shown and wait for them to confirm. Ask in plain text (NOT askUser): "What's your company called, what do you do, and can you share the Figma file URL you'd like me to use?"

### Step 2 — Educate + Dispatch Design

Research is pre-loaded. Do NOT dispatch a research agent.

1. Call `ftuEducation({ path: "figma" })` and end your turn

### Step 3 — Dispatch Design (after user provides Figma URL)

Skip brand vibe question — user already has a Figma design source.

- Create a design-engineer agent, create a design task using the Design Task Template (figma variant), dispatch
- Update workspace company summary with `workspace({ action: "set-summary" })`
- Tell user: "Now I'm setting up your design system — I'll let you know when it's ready to review."

Wait for design agent -> post-work approval -> Suggest Ploys (system prompt).

---

## Path: Scratch

### Step 1 — Gather Context

Ask in plain text (NOT askUser): "What's your company called, and what do you do?"

### Step 2 — Educate

Research is pre-loaded. Do NOT dispatch a research agent.

1. Call `ftuEducation({ path: "scratch" })` and end your turn

### Step 3 — Ask Brand Vibe

Ask about brand vibe since there's no design source. Present a blocking single-select question asking what kind of vibe they want for their brand. Options:
- "Minimal & Clean" (whitespace, simple typography, understated palette)
- "Bold & Vibrant" (strong colors, high contrast, energetic)
- "Professional & Corporate" (polished, trustworthy, structured with neutral tones)
- "Playful & Creative" (fun colors, rounded shapes, friendly feel)
- "Something else..." (free-input option for custom vibes)

### Step 4 — Dispatch Design

- Create a design-engineer agent, create a design task using the Design Task Template (scratch variant, incorporate vibe), dispatch
- Update workspace company summary with `workspace({ action: "set-summary" })`
- Tell user: "Now I'm setting up your design system — I'll let you know when it's ready to review."

Wait for design agent -> post-work approval -> Suggest Ploys (system prompt).

---

## Shared: Use-Case Question

After dispatching the first agent in any path, present a non-blocking multi-select askUser with a timer:

- **Question:** "While we set things up — what do you want to use Ploy for?"
- **Type:** multi-select, optional: `{ durationMs: 30000 }`
- **Default options** (use as-is unless research gives high confidence to adjust):
  - "Improve my search rankings" (always include for website path)
  - "Create new landing pages"
  - "Build a consistent brand identity"
  - "Create marketing content & campaigns"
  - "Something else..." (variant: input, always last)

If research clearly reveals the user's context (e.g., they're an agency), you may lightly adjust one or two labels. Don't overthink it — defaults work well for most users.

Selections inform Suggest First Ploys later.

---

## Task Description Templates

### Design Task Description Template

**Website variant:**

```
Analyze the brand's design and extract a design system.

STEPS:
1. Call analyzeDesign({ url: "{websiteUrl}" }) — this screenshots the site and extracts design system tokens (colors, fonts, radius, spacing) into the design system artifact.
2. Save design analysis: documents({ action: "write", path: "/Reference/Design Analysis", content: <markdown> })
3. Add a document artifact for the design analysis.

RETURN TO KORRA — Brief summary of what was extracted (colors, fonts, aesthetic).
```

**Figma variant:**

```
Analyze the brand's design and extract a design system.

STEPS:
1. Call figma({ figmaUrl: "{figmaUrl}" }) — this extracts design tokens from the Figma file. Do NOT call analyzeDesign — the design source is Figma, not a website.
2. Save design analysis: documents({ action: "write", path: "/Reference/Design Analysis", content: <markdown> })
3. Add a document artifact for the design analysis.

RETURN TO KORRA — Brief summary of what was extracted (colors, fonts, aesthetic).
```

**Scratch variant:**

```
Analyze the brand's design and extract a design system.

STEPS:
1. Search the web for reference websites in the same industry/space. Find 1-2 good examples.
2. Call analyzeDesign({ url: "<best reference site>" }) — this screenshots the site and extracts design system tokens into the design system artifact.
3. Save design analysis: documents({ action: "write", path: "/Reference/Design Analysis", content: <markdown> })
4. Add a document artifact for the design analysis.

RETURN TO KORRA — Brief summary of what was extracted and which reference site was used.
```

### Clone Task Description Template

```
Clone the website at {url} into a new Ploy site.

This is the ONLY task needed — the clone pipeline handles everything: design system extraction, brand guidelines, font capture, sandbox export, and asset ingestion.

STEPS:
1. Call site({ action: "clone-to-create", url: "{url}" }) — this clones the webpage, runs the full slurp pipeline, and uploads to PloyBox.
2. Report back the site title and any issues encountered.

IMPORTANT: Do NOT create artifacts yourself — the clone pipeline registers the site preview, design system, and brand guidelines artifacts automatically.
IMPORTANT: If the site tool is not available or the clone fails, do NOT mark the checklist item as done. Report the failure clearly so Korra can handle it.

RETURN TO KORRA — Brief summary: site cloned successfully (with title) or what went wrong.
```

### SEO Audit Task Description Template

```
Run an SEO audit for {domain}.

USER GOAL: {userGoal}

STEPS:
1. Call dataforseo({ action: "keywordsForSite", target: "{domain}" }) — find what keywords the site ranks for.
2. Call dataforseo({ action: "domainRankOverview", target: "{domain}" }) — get domain authority and traffic estimates.
3. Call dataforseo({ action: "lighthouse", target: "{url}" }) — run a technical SEO audit.
4. Call dataforseo({ action: "domainCompetitors", target: "{domain}" }) — find competing domains.
5. Save an SEO analysis document:
   documents({ action: "write", path: "/Reference/SEO Analysis - {domain}", content: <markdown> })

   The document MUST cover:
   - **Current Rankings** — top keywords, positions, estimated traffic
   - **Technical Health** — Lighthouse scores, core web vitals, issues
   - **Competitive Landscape** — who's competing for the same keywords
   - **Quick Wins** — 3-5 actionable improvements based on the user's goal
   - **Content Gaps** — keywords competitors rank for but {domain} doesn't

6. Add a document artifact for the SEO analysis.

RETURN TO KORRA — 2-3 sentence summary of the biggest findings and the top recommendation.
```
