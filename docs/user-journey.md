# PloyDB Demo — User Journey & Persona

## The Persona: Sofia Carter, Head of Growth at Stackline

**Stackline** is a 35-person B2B SaaS company that sells AI-powered document automation — contract drafting, clause review, redline suggestions. They sell across industries (legal, finance, consulting, tech). Series A, $4M ARR, trying to break into enterprise.

**Sofia** runs growth with a team of 3 (one SDR, one content marketer, one ops person). She manages everything from lead gen to outreach. She's not technical — she can write a formula in Sheets but wouldn't touch code.

**Why she's in Ploy today:** Stackline migrated their marketing site from Webflow to Ploy 6 months ago. They cloned `stackline.com` into Ploy, extracted their design system, and now manage everything — pages, AB tests, content — directly in the workspace. Sofia tried Folloze for personalized sales pages but dropped it because managing yet another website tool alongside their CRM and main site was too much friction. She also used to run her CRM in HubSpot but found herself constantly tab-switching between HubSpot, Webflow, Google Analytics, and Folloze. With PloyDB, the contacts, the site, the experiments, and the AI all live in one place.

**Her problem right now:** She has 960 contacts in her CRM that her SDR has been building over the past year. 130 of those leads went cold — never got a second touch. She knows *some* of them are worth re-engaging, but she doesn't know which ones, and she doesn't have time to research each industry manually.

---

## What Sofia Already Has in Ploy

| Ploy Feature | What it replaced | What Sofia uses it for |
|---|---|---|
| **Sites** | Webflow | `stackline.com` lives here. She edits pages, publishes changes, clones competitor pages — no dev needed. |
| **Ploys** (AB tests) | Google Optimize (sunset) | Tests hero sections, CTAs, messaging. E.g., "Draft contracts 3x faster" vs "AI-powered legal docs." Google Analytics integration tells her which variant converts better. |
| **Records** (PloyDB) | HubSpot | 960 contacts, 142 companies, 30 deals. Same CRM data, no separate tool. |
| **Korra** (AI agent) | ChatGPT + manual work | Reads and writes to Sites, Ploys, and Records. Not a sidebar — a coworker. |
| **Analytics integration** | Google Analytics (still connected) | Site traffic, page views, AB test conversion data flows in. Ploy knows which hero variant converts better. |
| **Clearbit integration** | Clearbit (standalone) | Reverse IP lookup identifies which companies visit `stackline.com`. Combined with cookie tracking from past email campaigns, Ploy knows which *individual contacts* visited which pages. |
| **Ploybooks** | Scattered playbooks | Reusable AI workflows: "Contact Prioritization," "Personalized Outreach," "Build a Content Page." |

### What she dropped by switching to Ploy
- **Webflow** — site now lives in Ploy Sites
- **HubSpot** — CRM now in PloyDB (Records)
- **Folloze** — tried it for personalized sales pages, dropped it (too many tools). Ploy Sites + Korra replaces it.
- **Tab-switching** between 4+ tools — everything is one workspace now

---

## How Visitor Tracking Works (for context)

Sofia's SDR sent email campaigns to 960 contacts over the past year. Those emails had tracked links pointing to `stackline.com` (hosted on Ploy Sites). When contacts clicked, Ploy set a first-party cookie.

**What Ploy now knows:**

| Data source | What it tells us | Confidence |
|---|---|---|
| Cookie tracking (from email clicks) | Which *individual contacts* visited which pages | High (~15-30% of contacts matched) |
| Clearbit integration (reverse IP) | Which *companies* visited, even if the person didn't click an email | Moderate (~20-40% of remaining traffic) |
| Google Analytics (connected) | Which AB test variants converted better, overall traffic patterns | High |
| Combined | ~25-40% of CRM contacts have some website activity signal | Moderate-High |

No standalone CRM has all three signals in one place.

---

## The Demo Flow — 10 Steps (0-9)

### Steps 0-8: Core flow

| Step | What happens | What Korra says | Data source |
|---|---|---|---|
| **0** | User clicks "Re-engage cold leads" template. Korra opens Contacts table. Auto-advances. | *"I see 960 contacts in your CRM. Let me open that up and take a look."* | PloyDB |
| **1** | Korra analyzes the table. 2s thinking. | *"130 of them are tagged as leads but haven't been reached in over 60 days. Want me to filter those out?"* | PloyDB |
| **2** | Filters to 130 stale leads. Asks about enrichment. | *"Filtered to 130 stale leads. I'd like to link Industry and Company Size from your Companies table. Sound good?"* | PloyDB filter |
| **3** | Links lookup columns from Companies table. | *"Linked. I can see 5 industries: Legal (34), Technology (27), Finance (25), Retail (23), Consulting (21). Want me to scan for industry news?"* | PloyDB cross-table lookup |
| **4** | Chain-of-thought reasoning (LawNext, Thomson Reuters, ABA). Filters to Legal. Auto-advances. | *"Legal is the standout — AI adoption in law firms just doubled in the past year, and the ABA formally cleared firms to use AI tools. Mid-market firms are in catch-up mode. That's 34 contacts worth reaching out to."* | Web research + PloyDB filter |
| **5** | Asks about prioritizing. 1.5s thinking. | *"I'm going to prioritize these 34 by title seniority and company size. Sound good?"* | — |
| **6** | Adds Priority column, fills all 34 rows, sorts High first. | *"Here's how they stack up — sorted by priority. Does this feel right?"* | Ploybook: Contact Prioritization + PloyDB |
| **7** | Sofia bumps one Low to High. Korra acknowledges. | *"Good catch — I see you bumped one to High. Want me to draft personalized re-engagement emails for High and Medium?"* | PloyDB (detects user edit) |
| **8** | Drafts personalized emails for High + Medium contacts. | *"Writing follow-up drafts — each email personalized with their name, title, company, and the AI adoption context we found."* | Claude API + Ploybook: Personalized Outreach |

### Step 9: Personalized Landing Pages (NEW)

After the email drafts are done, Korra proactively suggests:

> *"One more thing — sending a personalized landing page alongside these emails can 3x your reply rate. I checked your AB tests and Variant B's header ('AI-Powered Legal Docs') converts 23% better than Variant A. I also see 8 of these contacts already visited your product page recently. Want me to create a personalized page for each High priority contact using the winning header?"*

Sofia says yes. Korra:

1. Adds a "Personalized Page" column (url type, ai-generated)
2. Generates a personalized landing page for each High priority contact using the **Build a Content Page** ploybook
3. Each page uses:
   - The winning AB test header (from Ploys / Google Analytics data)
   - The contact's company name + logo (from Clearbit enrichment)
   - The legal AI adoption angle (from Step 4 research) — "Your peers are adopting AI document tools. Here's how mid-market firms are catching up."
   - A case study matched to their company size (from PloyDB)
   - Sofia's calendar link for booking a demo
4. Each cell gets a unique URL like `stackline.com/for/harris-legal`

**What makes this only possible in Ploy:**
- The AB test data (which header converts) comes from **Ploys**
- The contact data comes from **Records** (PloyDB)
- The page is built on **Sites** (Ploy's site builder)
- The research context comes from **Korra's** earlier work in Step 4
- Folloze couldn't do this because it didn't have access to the CRM or the AB test results

**Tool calls:**
- `addColumn` — "Personalized Page" (url, ai-generated)
- `editCells` — fill URLs for High priority contacts

**Context tags added:**
- Ploybook: "Build a Content Page"
- Source: "Google Analytics" (AB test data)
- Source: "Clearbit" (company logos/enrichment)

---

## Korra's Chain-of-Thought Reasoning (Step 4)

This is what streams in the "Thinking..." block during the research step. All data points are grounded in real 2025-2026 reports:

```
Searching LawNext and Artificial Lawyer for legal AI adoption trends...
→ Found: 70% of legal professionals now use generative AI — doubled in one year
→ Found: Law firm tech spending grew 9.7% in 2025, fastest growth ever recorded

Scanning Thomson Reuters State of Legal Market 2026...
→ Found: Mid-market firms (50-200 attorneys) in aggressive tech catch-up phase
→ Found: Per-lawyer tech spend at midsize firms up to $18K/year

Checking ABA ethics guidance on AI adoption...
→ Found: ABA Formal Opinion 512 — lawyers now have formal green light to use AI tools
→ Found: State bars issuing new AI ethics opinions in 2026 — firms must have AI policies

Reviewing Technology, Finance, Retail, Consulting...
→ Tech: saturated, budget freezes at mid-market, long sales cycles
→ Finance: conservative, 6-month procurement cycles
→ Retail & Consulting: steady but no urgency signal

**Conclusion:** Legal has the strongest re-engagement signal — ABA green light
+ record tech spending + mid-market catch-up phase = urgent demand for AI document tools.
```

### Source references (real)
- [LawNext: AI adoption doubled in one year](https://www.lawnext.com/2026/03/)
- [Thomson Reuters: 9.7% tech spending growth](https://www.lawnext.com/2026/01/)
- [ABA Formal Opinion 512: AI ethics guidance](https://library.law.unc.edu/2025/02/aba-formal-opinion-512/)
- [Harvey AI: $190M ARR, $11B valuation](https://www.harvey.ai/blog/)
- [CoCounsel: 1 million users](https://www.lawnext.com/2026/02/)
- [Legal tech raised $6B in 2025](https://www.artificiallawyer.com/2026/01/06/)

---

## The Simple Story (one table)

| What Sofia needs | Old way (5+ tools) | Ploy way (one workspace) |
|---|---|---|
| Store contacts and companies | HubSpot CRM | **Records** (PloyDB) |
| Find stale leads | HubSpot filters + manual review | **Korra** scans and filters |
| Enrich contacts with company data | Export CSV → Clearbit → re-import | **Korra** links tables in PloyDB |
| Research which industries to target | Google News + manual reading | **Korra** researches + uses SEO ploybook |
| Prioritize leads by seniority | Spreadsheet scoring model | **Korra** + Contact Prioritization ploybook |
| Draft personalized emails | ChatGPT + copy-paste into HubSpot | **Korra** drafts in PloyDB, ready to send |
| Create personalized landing pages | Folloze (separate tool, dropped it) | **Korra** builds pages on Ploy Sites using winning AB test header |
| Know which header converts best | Google Analytics → check manually | **Ploy already knows** (AB test results from Ploys + GA integration) |
| Know which leads visited your site | Clearbit dashboard → cross-reference CRM manually | **Ploy already knows** (Clearbit integration + cookie tracking, matched to CRM) |
| Track if leads engaged with your outreach | Check Folloze analytics → update HubSpot manually | **Ploy already knows** (page hosted on Sites, engagement feeds back to Records) |

---

## Homepage Activity Feed — Closing the Loop (FUTURE STEP)

> **Note:** This is a future enhancement, not part of the current demo implementation. Documenting here for planning purposes.

The Ploy homepage wireframe has an **Inbox** section with tabs: All, Action needed, Alerts, Opportunities. This is the right place for engagement tracking cards after Sofia's outreach goes out.

### How it would work

The next morning, Sofia opens Ploy and sees in her Inbox:

**Opportunity card:**
> **Sarah Chen viewed your personalized page**
> Harris Legal · Spent 4 min on pricing section · Forwarded to 1 colleague
> *From: Stale Leads Outreach · Records: Contacts*
> [Dismiss] [**Review**]

**Opportunity card:**
> **2 companies from your outreach list visited stackline.com**
> Harris Legal (pricing page, 3 visits) · Bower & Associates (case studies)
> *Detected via Clearbit · Records: Contacts*
> [Dismiss] [**Review**]

**Alert card:**
> **Variant B still outperforming — consider making it default**
> "AI-Powered Legal Docs" header · 23% higher CVR · 340 visitors this week
> *From: Homepage Hero Test · Ploys*
> [Dismiss] [**Review**]

Clicking "Review" on the first card opens the Contacts table filtered to Sarah Chen's row, with Korra's conversation context restored. Korra could suggest: *"Sarah spent 4 minutes on pricing. Want me to flag her as hot and draft a follow-up?"*

### Why the Inbox is the right place (not a chat list)
- The wireframe's Inbox already has the right card types: Action needed, Alerts, Opportunities
- Engagement data is an *actionable insight*, not a *conversation to resume*
- Each card links back to the relevant workspace feature (Records, Ploys, Sites)
- Cards connect Clearbit data (who visited) + Ploy Sites analytics (page engagement) + PloyDB (contact records) in one feed

### Data sources for Inbox cards
- **Clearbit integration** → company-level visit alerts
- **Cookie tracking** → individual contact visit detection
- **Ploy Sites analytics** → personalized page engagement (time, sections, forwards)
- **Ploys (AB tests) + Google Analytics** → variant performance alerts
- **PloyDB** → matches all signals back to CRM contacts

---

## Integrations That Power the Story

| Integration | What it provides | Where it shows up in demo |
|---|---|---|
| **Google Analytics** | AB test conversion data, site traffic | Step 9: Korra knows Variant B converts 23% better |
| **Clearbit** | Reverse IP → company identification, company logos for personalized pages | Step 9: Korra knows which companies visited the site. Logos on personalized pages. |
| **Google Search Console** | Keyword rankings, SEO performance | Step 4 (potential): Korra could reference keyword surge data during industry research |
| **Figma** | Design assets for personalized pages | Step 9: Page templates pull from Stackline's design system |
| **Cookie tracking** (native to Ploy Sites) | Individual contact page visits (from past email clicks) | Step 9: "8 of these contacts already visited your product page" |

---

## Ploybooks Used in the Demo

| Ploybook | When it's used | What it does |
|---|---|---|
| **Contact Prioritization** | Step 6 | Scores contacts by title seniority + company size → High/Medium/Low |
| **Personalized Outreach** | Step 8 | Drafts emails personalized with name, title, company, and research context |
| **Build a Content Page** | Step 9 | Two-phase workflow: research + build. Creates personalized landing pages with winning AB test header, AI adoption angle, matched case study |
| **SEO & AEO Strategy** | Step 4 (potential enrichment) | Could provide keyword surge data as additional research signal |

---

## Why "AI Document Automation" Is the Right Product for Stackline

The legal AI market is the most grounded B2B SaaS trend right now:

- **Harvey AI:** $0 → $190M ARR → $11B valuation in under 3 years
- **Thomson Reuters CoCounsel:** 1 million users across 107 countries
- **70% of legal professionals** now use generative AI (doubled in one year)
- **Law firm tech spending grew 9.7% in 2025** — fastest ever recorded
- **Legal tech raised $6 billion in 2025** with fourteen $100M+ rounds
- **ABA Formal Opinion 512** formally cleared lawyers to use AI tools
- **Mid-market firms** (50-200 attorneys) in "aggressive catch-up phase" — per-lawyer tech spend up to $18K/year

Stackline positions as a lighter, mid-market alternative to Harvey (which targets AmLaw 100) and CoCounsel (locked inside Thomson Reuters/Westlaw). This makes Legal contacts the perfect ICP — and Korra surfacing "Legal is surging" in Step 4 feels both surprising and inevitable.

---

## One-Liner

Sofia used to need HubSpot + Webflow + Folloze + Clearbit + Google Analytics + ChatGPT to go from "cold lead" to "personalized outreach with a custom landing page." She dropped Folloze because it was one tool too many. In Ploy, she types one sentence to Korra and gets emails + personalized pages + the winning AB test header + engagement tracking — because the CRM, the website, the experiments, and the AI are all the same system.
