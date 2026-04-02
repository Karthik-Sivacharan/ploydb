import type { FieldDef, Row, Database } from "@/store/types";

const STATUSES = [
  { value: "new", label: "New", color: "#6366f1" },
  { value: "contacted", label: "Contacted", color: "#f59e0b" },
  { value: "qualified", label: "Qualified", color: "#8b5cf6" },
  { value: "proposal", label: "Proposal", color: "#3b82f6" },
  { value: "won", label: "Won", color: "#22c55e" },
  { value: "lost", label: "Lost", color: "#ef4444" },
];

const SOURCES = [
  { value: "website", label: "Website", color: "#3b82f6" },
  { value: "referral", label: "Referral", color: "#22c55e" },
  { value: "linkedin", label: "LinkedIn", color: "#0077b5" },
  { value: "cold_call", label: "Cold Call", color: "#f59e0b" },
  { value: "conference", label: "Conference", color: "#8b5cf6" },
];

const TAGS_OPTIONS = [
  { value: "enterprise", label: "Enterprise", color: "#6366f1" },
  { value: "smb", label: "SMB", color: "#22c55e" },
  { value: "startup", label: "Startup", color: "#f59e0b" },
  { value: "hot_lead", label: "Hot Lead", color: "#ef4444" },
  { value: "follow_up", label: "Follow Up", color: "#3b82f6" },
];

const PRIORITY = [
  { value: "high", label: "High", color: "#ef4444" },
  { value: "medium", label: "Medium", color: "#f59e0b" },
  { value: "low", label: "Low", color: "#22c55e" },
];

export const MOCK_SCHEMA: FieldDef[] = [
  { name: "company_name", type: "text", label: "Company Name", required: true },
  { name: "contact_name", type: "text", label: "Contact Name" },
  { name: "email", type: "email", label: "Email" },
  { name: "phone", type: "phone", label: "Phone" },
  { name: "website", type: "url", label: "Website" },
  { name: "status", type: "status", label: "Status", options: STATUSES },
  { name: "source", type: "select", label: "Source", options: SOURCES },
  { name: "tags", type: "tags", label: "Tags", options: TAGS_OPTIONS },
  { name: "deal_size", type: "currency", label: "Deal Size", currencyCode: "USD" },
  { name: "probability", type: "percent", label: "Probability" },
  { name: "employees", type: "number", label: "Employees" },
  { name: "priority", type: "select", label: "Priority", options: PRIORITY },
  { name: "first_contact", type: "date", label: "First Contact" },
  { name: "last_activity", type: "datetime", label: "Last Activity" },
  { name: "location", type: "location", label: "Location" },
  { name: "is_active", type: "checkbox", label: "Active" },
  { name: "brand_color", type: "color", label: "Brand Color" },
  { name: "notes", type: "rich_text", label: "Notes" },
  { name: "metadata", type: "json", label: "Metadata" },
  { name: "assigned_to", type: "ref", label: "Assigned To", refTable: "team" },
  { name: "related_deals", type: "refs", label: "Related Deals", refTable: "deals" },
];

const COMPANIES = [
  "Acme Corp", "TechVision", "GlobalSync", "NeuralPath", "CloudBase",
  "DataStream", "Innovex", "Quantum Labs", "PixelForge", "CyberNova",
  "Apex Digital", "BrightWave", "CoreLogic", "DeepMind AI", "EchoSystems",
  "FlexiTech", "GreenNode", "HyperScale", "IronPeak", "JoltEnergy",
];

const CONTACTS = [
  "Sarah Chen", "Marcus Williams", "Elena Rodriguez", "James O'Brien",
  "Priya Patel", "David Kim", "Lisa Thompson", "Ahmed Hassan",
  "Maria Santos", "Ryan Cooper", "Jennifer Liu", "Michael Brown",
  "Aisha Okafor", "Thomas Fischer", "Yuki Tanaka", "Carlos Mendez",
  "Emma Wilson", "Robert Singh", "Hannah Park", "Daniel Osei",
];

const LOCATIONS = [
  "San Francisco, CA", "New York, NY", "Austin, TX", "Seattle, WA",
  "London, UK", "Berlin, DE", "Toronto, CA", "Sydney, AU",
  "Singapore, SG", "Tokyo, JP",
];

const TEAM = ["Alice", "Bob", "Charlie", "Diana", "Eve"];
const DEAL_IDS = ["deal-1", "deal-2", "deal-3", "deal-4", "deal-5"];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickWeighted(options: string[], weights: number[]): string {
  const total = weights.reduce((a, b) => a + b, 0);
  let r = Math.random() * total;
  for (let i = 0; i < options.length; i++) {
    r -= weights[i];
    if (r <= 0) return options[i];
  }
  return options[0];
}

function randomDate(start: Date, end: Date): string {
  const d = new Date(
    start.getTime() + Math.random() * (end.getTime() - start.getTime())
  );
  return d.toISOString();
}

function generateRow(index: number): Row {
  const status = pickWeighted(
    ["new", "contacted", "qualified", "proposal", "won", "lost"],
    [40, 25, 15, 10, 5, 5]
  );
  const tagCount = Math.floor(Math.random() * 3);
  const tags = Array.from(
    new Set(
      Array.from({ length: tagCount }, () =>
        pickRandom(TAGS_OPTIONS.map((t) => t.value))
      )
    )
  );
  const dealCount = Math.floor(Math.random() * 3);
  const deals = Array.from(
    new Set(Array.from({ length: dealCount }, () => pickRandom(DEAL_IDS)))
  );

  const firstContact = randomDate(new Date("2025-01-01"), new Date("2026-03-01"));
  const lastActivity = randomDate(new Date(firstContact), new Date("2026-04-02"));

  return {
    id: `row-${index}`,
    data: {
      company_name: COMPANIES[index % COMPANIES.length],
      contact_name: CONTACTS[index % CONTACTS.length],
      email: `${CONTACTS[index % CONTACTS.length].toLowerCase().replace(/[' ]/g, ".")}@${COMPANIES[index % COMPANIES.length].toLowerCase().replace(/[ ]/g, "")}.com`,
      phone: `+1 (${String(Math.floor(Math.random() * 900 + 100))}) ${String(Math.floor(Math.random() * 900 + 100))}-${String(Math.floor(Math.random() * 9000 + 1000))}`,
      website: `https://${COMPANIES[index % COMPANIES.length].toLowerCase().replace(/[ ]/g, "")}.com`,
      status,
      source: pickRandom(SOURCES.map((s) => s.value)),
      tags,
      deal_size: Math.floor(Math.random() * 500000 + 5000),
      probability: Math.floor(Math.random() * 100),
      employees: Math.floor(Math.random() * 10000 + 10),
      priority: pickRandom(PRIORITY.map((p) => p.value)),
      first_contact: firstContact.split("T")[0],
      last_activity: lastActivity,
      location: pickRandom(LOCATIONS),
      is_active: Math.random() > 0.2,
      brand_color: `#${Math.floor(Math.random() * 16777215).toString(16).padStart(6, "0")}`,
      notes: index % 3 === 0 ? "Follow up on proposal discussion. Client interested in enterprise plan." : "",
      metadata: index % 5 === 0 ? { tier: "enterprise", region: "us-west" } : null,
      assigned_to: pickRandom(TEAM),
      related_deals: deals,
    },
    createdAt: firstContact,
    updatedAt: lastActivity,
  };
}

export function generateMockRows(count: number = 25): Row[] {
  return Array.from({ length: count }, (_, i) => generateRow(i));
}

export function createMockDatabase(): Database {
  return {
    id: "db-sales-pipeline",
    name: "Sales Pipeline",
    icon: "\uD83D\uDCBC",
    schema: MOCK_SCHEMA,
    rows: generateMockRows(25),
    views: [
      {
        id: "view-all",
        name: "All Leads",
        type: "table",
        filters: [],
        filterConjunction: "and",
        sorts: [],
        groupBy: null,
        visibleColumns: MOCK_SCHEMA.map((f) => f.name),
        columnOrder: MOCK_SCHEMA.map((f) => f.name),
        columnWidths: {},
      },
    ],
    activeViewId: "view-all",
    createdAt: "2025-01-01T00:00:00.000Z",
    updatedAt: new Date().toISOString(),
  };
}
