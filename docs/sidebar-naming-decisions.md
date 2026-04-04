# Sidebar Navigation -- Naming Decisions

## Context

PloyDB is an AI-native CRM tool for non-technical users (marketers, sales, ops). The sidebar navigation needed naming that feels familiar to people coming from HubSpot, Salesforce, Airtable, and Google Sheets.

## Key Decisions

### Header: "My Workspace" with avatar

- Matches the workspace switcher pattern from Monday.com, Attio, Slack
- Replaces "Ploy" which was too brand-focused for a workspace tool

### Main Nav Items

#### Overview (was "Home")

- Home icon retained, just renamed to match the screenshot/design shared
- The landing page / dashboard view

#### Ploys

- Runs of AI agents (Korra). Each ploy is a chat session where an agent worked on something.
- Clicking opens a list of chat cards showing past agent runs.
- Icon: Sparkles to signal AI/magic

#### Sites

- List of websites that Ploy deploys
- Separate product area alongside the data/CRM side

#### Records (the big naming debate)

This is PloyDB -- the structured data grid with interconnected tables (Contacts, Companies, Deals).

**Alternatives considered:**

| Name | Why it was rejected |
|---|---|
| Tables | Feels too technical/structural, sounds like database admin |
| Data | Too vague, sounds like a settings/export page |
| Bases | Airtable-specific jargon, marketers from HubSpot/Salesforce won't know it |
| Sheets | Implies flat spreadsheet, undersells relational capabilities |
| Database | Sounds technical, marketers associate it with backend engineering |
| CRM | Too narrow, PloyDB handles more than CRM data |
| Collections | Too abstract, no CRM precedent |
| Hub | Too generic |
| Spaces | Overloaded term (Notion, Confluence, etc.) |
| Entity names directly (Contacts, Companies, Deals) | Right pattern long-term, but for now there's one database so a single nav item suffices |

**Why "Records" won:**

- HubSpot, Salesforce, and Attio all use this term. It is CRM-native.
- Marketers hear "records" and think of their contacts/deals.
- Professional without being technical.
- Attio (closest comparable to PloyDB's positioning) uses it as their core concept.

**Architecture behind the choice:**

One workspace contains one database (for now), which contains multiple interconnected tables (Contacts, Companies, Deals). Cross-database linking is deferred. Clicking "Records" will eventually show a table picker, then open the data grid.

### Resources Section (below separator)

| Item | Purpose | Icon |
|---|---|---|
| Design System | Design tokens, components | Palette |
| Assets | Images, files, media | Image |
| Documents | Docs, notes | FileText |
| Ploybooks | Saved AI workflows / prompt recipes | BookOpen |

Ploybooks ships with four starter items: Web Design Audit, Client Health Assessment, Lead Prioritization, Deal Pipeline Review.

### Footer

| Item | Notes |
|---|---|
| Notifications | Bell icon with badge, above theme toggle |
| Theme toggle | Dark/Light mode (hydration-safe, collapses to icon in collapsed sidebar) |
| User profile | Displays user name (e.g. "Karthik") |
| Settings | Below user profile |

## Data Architecture (simplified)

```
Workspace (My Workspace)
  +-- Records (one database for now)
        |-- Contacts table  <--> linked to Companies, Deals
        |-- Companies table <--> linked to Contacts, Deals
        |-- Deals table     <--> linked to Contacts, Companies
        +-- Activities table <--> linked to Contacts, Deals
```

- Tables within a database are interconnected via ref/refs fields
- Cross-database linking deferred (power-user feature for later)
- For demo: one database, user clicks "Records" and sees tables directly

## Final Sidebar Structure

```
[M] My Workspace               <- workspace switcher
---
Overview                        <- home/dashboard (House icon)
Ploys                           <- AI agent runs (Sparkles icon)
Sites                           <- deployed websites (Globe icon)
Records                         <- CRM data grid (Rows3 icon)
---
Design System                   <- design tokens (Palette icon)
Assets                          <- media/files (Image icon)
Documents                       <- docs (FileText icon)
Ploybooks                       <- AI workflows (BookOpen icon)
---
Notifications                   <- bell icon with badge
Dark mode / Light mode toggle   <- theme switcher
Karthik                         <- user profile
Settings                        <- app settings
```
