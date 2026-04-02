import { faker } from "@faker-js/faker";
import type { Database, Row, View, CellValue } from "@/store/types";
import { PIPELINE_SCHEMA, TEAM_SCHEMA, DEALS_SCHEMA } from "./schema";
import { HERO_ROWS, heroRowToData } from "./hero-rows";

// ── Constants ──

const PIPELINE_COUNT = 150;
const TEAM_COUNT = 10;
const DEALS_COUNT = 30;

const STATUSES = ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"] as const;
const STATUS_WEIGHTS = [0.30, 0.20, 0.18, 0.12, 0.08, 0.07, 0.05];

const WIN_PROB_RANGES: Record<string, [number, number]> = {
  New: [5, 15],
  Contacted: [15, 30],
  Qualified: [35, 55],
  Proposal: [50, 70],
  Negotiation: [65, 85],
  Won: [100, 100],
  Lost: [0, 0],
};

const SOURCES = ["Referral", "Website", "Cold Call", "LinkedIn", "Conference", "Partner"];
const PRODUCTS = ["Analytics", "CRM", "Marketing", "Automation", "API", "Support"];
const TAGS_ALL = ["Hot", "Enterprise", "Startup", "SMB", "Churned", "VIP", "Renewal"];

const CITIES = [
  "San Francisco, CA", "New York, NY", "London, UK", "Berlin, Germany",
  "Tokyo, Japan", "Toronto, Canada", "Sydney, Australia", "Singapore",
  "Paris, France", "Seattle, WA", "Austin, TX", "Chicago, IL",
  "Los Angeles, CA", "Boston, MA", "Denver, CO", "Miami, FL",
];

const BRAND_COLORS = [
  "#e74c3c", "#3498db", "#2ecc71", "#f39c12", "#9b59b6",
  "#1abc9c", "#e67e22", "#2c3e50", "#8e44ad", "#27ae60",
  "#d35400", "#c0392b", "#16a085", "#2980b9", "#f1c40f",
];

const INDUSTRIES = [
  "Technology", "Financial Services", "Healthcare", "Manufacturing",
  "Consulting", "Retail", "Education", "Media", "Real Estate", "Energy",
];

const EMPLOYEE_RANGES = ["1-50", "50-100", "100-500", "500-1000", "1000-5000", "5000+"];

// ── ID generation ──

let idCounter = 0;

function makeId(prefix: string): string {
  idCounter++;
  return `${prefix}_${idCounter.toString(36).padStart(6, "0")}`;
}

// ── Weighted random ──

function weightedPick<T>(items: readonly T[], weights: number[]): T {
  const r = faker.number.float({ min: 0, max: 1 });
  let cumulative = 0;
  for (let i = 0; i < items.length; i++) {
    cumulative += weights[i];
    if (r <= cumulative) return items[i];
  }
  return items[items.length - 1];
}

// ── Date helpers ──

function randomDateInRange(start: Date, end: Date): Date {
  return faker.date.between({ from: start, to: end });
}

function isoDate(d: Date): string {
  return d.toISOString().split("T")[0];
}

// ── Deal size with weighted distribution ($20K-$80K center) ──

function randomDealSize(): number {
  const r = faker.number.float({ min: 0, max: 1 });
  if (r < 0.6) return faker.number.int({ min: 20000, max: 80000 });
  if (r < 0.85) return faker.number.int({ min: 80000, max: 200000 });
  if (r < 0.95) return faker.number.int({ min: 200000, max: 500000 });
  return faker.number.int({ min: 5000, max: 20000 });
}

// ── Tag picker based on company characteristics ──

function pickTags(employeeCount: number, winProb: number): string[] {
  const tags: string[] = [];

  if (employeeCount > 1000) tags.push("Enterprise");
  else if (employeeCount < 50) tags.push("Startup");
  else tags.push("SMB");

  if (winProb > 60) tags.push("Hot");
  if (employeeCount > 5000 && winProb > 50) tags.push("VIP");
  if (faker.number.float({ min: 0, max: 1 }) < 0.1) tags.push("Renewal");

  return Array.from(new Set(tags)).slice(0, 3);
}

// ── Pick random subset ──

function pickSubset(items: string[], min: number, max: number): string[] {
  const count = faker.number.int({ min, max });
  return faker.helpers.arrayElements(items, count);
}

// ── Company domain from name ──

function companyDomain(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]/g, "") + ".com";
}

// ── Generate a single pipeline row ──

function generatePipelineRow(
  teamIds: string[],
  dealIds: string[],
  now: Date
): Record<string, CellValue> {
  const companyName = faker.company.name();
  const status = weightedPick(STATUSES, STATUS_WEIGHTS);
  const [minProb, maxProb] = WIN_PROB_RANGES[status];
  const winProb = faker.number.int({ min: minProb, max: maxProb });
  const employeeCount = faker.number.int({ min: 5, max: 15000 });
  const domain = companyDomain(companyName);

  const sixMonthsAgo = new Date(now.getTime() - 180 * 24 * 60 * 60 * 1000);
  const createdDate = randomDateInRange(sixMonthsAgo, now);
  const lastContacted = randomDateInRange(createdDate, now);

  return {
    company_name: companyName,
    notes: faker.lorem.sentence({ min: 8, max: 20 }),
    employee_count: employeeCount,
    deal_size: randomDealSize(),
    win_probability: winProb,
    source: faker.helpers.arrayElement(SOURCES),
    products_interested: pickSubset(PRODUCTS, 1, 3),
    status,
    tags: pickTags(employeeCount, winProb),
    created_date: isoDate(createdDate),
    last_contacted: lastContacted.toISOString(),
    contact_email: `${faker.person.firstName().toLowerCase()}.${faker.person.lastName().toLowerCase()}@${domain}`,
    phone: faker.phone.number({ style: "international" }),
    website: `https://${domain}`,
    brand_color: faker.helpers.arrayElement(BRAND_COLORS),
    metadata: {
      industry: faker.helpers.arrayElement(INDUSTRIES),
      employeeRange: employeeCount > 5000 ? "5000+" :
        employeeCount > 1000 ? "1000-5000" :
        employeeCount > 500 ? "500-1000" :
        employeeCount > 100 ? "100-500" :
        employeeCount > 50 ? "50-100" : "1-50",
      source_detail: faker.lorem.words({ min: 2, max: 5 }),
    },
    location: faker.helpers.arrayElement(CITIES),
    has_nda: faker.datatype.boolean({ probability: 0.35 }),
    assigned_to: faker.helpers.arrayElement(teamIds),
    related_deals: pickSubset(dealIds, 0, 2),
  };
}

// ── Build a Row object ──

function buildRow(
  data: Record<string, CellValue>,
  prefix: string,
  now: Date
): Row {
  const createdStr = (data.created_date as string) ?? now.toISOString();
  const lastStr = (data.last_contacted as string) ?? now.toISOString();
  const updatedAt = new Date(Math.max(
    new Date(lastStr).getTime(),
    new Date(createdStr).getTime()
  ));

  return {
    id: makeId(prefix),
    data,
    createdAt: new Date(createdStr).toISOString(),
    updatedAt: updatedAt.toISOString(),
  };
}

// ── Default view builder ──

function defaultView(fieldNames: string[]): View {
  const viewId = makeId("view");
  return {
    id: viewId,
    name: "All",
    type: "table",
    filters: [],
    filterConjunction: "and",
    sorts: [],
    groupBy: null,
    visibleColumns: fieldNames,
    columnOrder: fieldNames,
    columnWidths: {},
  };
}

// ── Generate team members ──

function generateTeamDatabase(now: Date): Database {
  const roles = ["Sales Rep", "Account Exec", "SDR", "Manager"];
  const departments = ["Sales", "Marketing", "Support"];
  const teamLocations = ["San Francisco, CA", "New York, NY", "London, UK", "Austin, TX", "Chicago, IL"];

  const rows: Row[] = Array.from({ length: TEAM_COUNT }, () => {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const data: Record<string, CellValue> = {
      name: `${firstName} ${lastName}`,
      email: `${firstName.toLowerCase()}.${lastName.toLowerCase()}@ploy.io`,
      role: faker.helpers.arrayElement(roles),
      department: faker.helpers.arrayElement(departments),
      phone: faker.phone.number({ style: "international" }),
      location: faker.helpers.arrayElement(teamLocations),
      active: faker.datatype.boolean({ probability: 0.9 }),
    };
    return buildRow(data, "team", now);
  });

  const fieldNames = TEAM_SCHEMA.map((f) => f.name);
  const view = defaultView(fieldNames);
  const dbId = makeId("db");

  return {
    id: dbId,
    name: "Team Members",
    icon: "\u{1F465}",
    schema: TEAM_SCHEMA,
    rows,
    views: [view],
    activeViewId: view.id,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

// ── Generate deals ──

function generateDealsDatabase(
  pipelineRowIds: string[],
  now: Date
): Database {
  const stages = ["Discovery", "Proposal", "Negotiation", "Closed Won", "Closed Lost"];
  const stageProbs: Record<string, [number, number]> = {
    Discovery: [10, 30],
    Proposal: [30, 60],
    Negotiation: [50, 80],
    "Closed Won": [100, 100],
    "Closed Lost": [0, 0],
  };

  const rows: Row[] = Array.from({ length: DEALS_COUNT }, () => {
    const stage = faker.helpers.arrayElement(stages);
    const [minP, maxP] = stageProbs[stage];
    const closeDate = randomDateInRange(now, new Date(now.getTime() + 120 * 24 * 60 * 60 * 1000));

    const data: Record<string, CellValue> = {
      deal_name: `${faker.company.name()} - ${faker.commerce.product()}`,
      value: randomDealSize(),
      stage,
      company: faker.helpers.arrayElement(pipelineRowIds),
      close_date: isoDate(closeDate),
      probability: faker.number.int({ min: minP, max: maxP }),
    };
    return buildRow(data, "deal", now);
  });

  const fieldNames = DEALS_SCHEMA.map((f) => f.name);
  const view = defaultView(fieldNames);
  const dbId = makeId("db");

  return {
    id: dbId,
    name: "Deals",
    icon: "\u{1F4B0}",
    schema: DEALS_SCHEMA,
    rows,
    views: [view],
    activeViewId: view.id,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

// ── Generate pipeline ──

function generatePipelineDatabase(
  teamIds: string[],
  dealIds: string[],
  now: Date
): Database {
  // Hero rows first
  const heroRows: Row[] = HERO_ROWS.map((hero) => {
    const data = heroRowToData(hero);
    data.assigned_to = faker.helpers.arrayElement(teamIds);
    data.related_deals = pickSubset(dealIds, 0, 2);
    return buildRow(data, "pipe", now);
  });

  // Generated rows
  const generatedCount = PIPELINE_COUNT - HERO_ROWS.length;
  const generatedRows: Row[] = Array.from({ length: generatedCount }, () => {
    const data = generatePipelineRow(teamIds, dealIds, now);
    return buildRow(data, "pipe", now);
  });

  const rows = [...heroRows, ...generatedRows];
  const fieldNames = PIPELINE_SCHEMA.map((f) => f.name);
  const view = defaultView(fieldNames);
  const dbId = makeId("db");

  return {
    id: dbId,
    name: "Sales Pipeline",
    icon: "\u{1F4CA}",
    schema: PIPELINE_SCHEMA,
    rows,
    views: [view],
    activeViewId: view.id,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
  };
}

// ── Main entry point ──

export function generateSeedData(): Database[] {
  faker.seed(42);
  idCounter = 0;

  const now = new Date("2026-04-01T12:00:00Z");

  // Generate team first (pipeline needs team IDs)
  const teamDb = generateTeamDatabase(now);
  const teamIds = teamDb.rows.map((r) => r.id);

  // Generate deals (pipeline needs deal IDs, deals need pipeline IDs placeholder)
  // We create placeholder pipeline IDs for deals' company refs
  const placeholderPipelineIds = Array.from({ length: PIPELINE_COUNT }, (_, i) =>
    `pipe_placeholder_${i}`
  );
  const dealsDb = generateDealsDatabase(placeholderPipelineIds, now);
  const dealIds = dealsDb.rows.map((r) => r.id);

  // Generate pipeline with real team and deal IDs
  const pipelineDb = generatePipelineDatabase(teamIds, dealIds, now);

  // Patch deal company refs with real pipeline IDs
  const pipelineIds = pipelineDb.rows.map((r) => r.id);
  for (const row of dealsDb.rows) {
    row.data.company = faker.helpers.arrayElement(pipelineIds);
  }

  return [pipelineDb, teamDb, dealsDb];
}
