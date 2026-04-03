import { faker } from "@faker-js/faker";
import { teamMembers } from "@/data/team-members";
import { deals } from "@/data/deals";

export interface RefRecord {
  id: string;
  name: string;
}

export interface CrmRow {
  _id: string;
  companyName: string;
  description: string;
  employeeCount: number;
  dealSize: number;
  winProbability: number;
  leadSource: string;
  industries: string[];
  stage: string;
  labels: string[];
  hasNda: boolean;
  lastContacted: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  companyHq: string;
  accountColor: string;
  customMetadata: string;
  nextFollowUp: string;
  assignedTo: RefRecord | null;
  relatedDeals: RefRecord[];
}

const LEAD_SOURCES = ["Referral", "Website", "Cold Call", "Event", "Partner"];
const INDUSTRIES = ["SaaS", "Fintech", "Healthcare", "E-commerce", "AI/ML"];
const LABELS = ["Hot Lead", "Follow Up", "Enterprise", "SMB", "Startup"];
const PRESET_COLORS = ["#ef4444", "#f97316", "#eab308", "#22c55e", "#06b6d4", "#3b82f6", "#6366f1", "#8b5cf6", "#ec4899", "#f43f5e", "#64748b", "#000000"];
const STAGE_WEIGHTS: [string, number][] = [
  ["New", 0.4], ["Contacted", 0.25], ["Qualified", 0.15],
  ["Proposal", 0.1], ["Negotiation", 0.05], ["Won", 0.03], ["Lost", 0.02],
];

function weightedStage(): string {
  const r = Math.random();
  let sum = 0;
  for (const [stage, weight] of STAGE_WEIGHTS) {
    sum += weight;
    if (r <= sum) return stage;
  }
  return "New";
}

function randomSubset(items: string[], min = 1, max = 3): string[] {
  const count = faker.number.int({ min, max: Math.min(max, items.length) });
  return faker.helpers.arrayElements(items, count);
}

function randomFutureIso(): string {
  const date = faker.date.future({ years: 1 });
  const hour = faker.number.int({ min: 8, max: 17 });
  const minute = faker.helpers.arrayElement([0, 15, 30, 45]);
  date.setHours(hour, minute, 0, 0);
  return date.toISOString();
}

function randomTeamMember(): RefRecord | null {
  if (faker.datatype.boolean({ probability: 0.8 })) {
    return faker.helpers.arrayElement(teamMembers);
  }
  return null;
}

function randomDeals(): RefRecord[] {
  const count = faker.number.int({ min: 0, max: 3 });
  if (count === 0) return [];
  return faker.helpers.arrayElements(deals, count);
}

const heroRows: CrmRow[] = [
  {
    _id: "hero-1",
    companyName: "Acme Corp",
    description: "Enterprise solutions for supply chain automation",
    employeeCount: 2400,
    dealSize: 125000,
    winProbability: 85,
    leadSource: "Referral",
    industries: ["SaaS", "E-commerce"],
    stage: "Qualified",
    labels: ["Enterprise", "Hot Lead"],
    hasNda: true,
    lastContacted: "2026-03-28",
    website: "https://acme.com",
    contactEmail: "jane.doe@acme.com",
    contactPhone: "+1 (415) 555-0123",
    companyHq: "San Francisco, CA",
    accountColor: "#3b82f6",
    customMetadata: '{"source":"referral","score":92,"tier":"enterprise"}',
    nextFollowUp: "2026-04-10T14:30:00.000Z",
    assignedTo: { id: "tm-1", name: "Sarah Chen" },
    relatedDeals: [
      { id: "deal-1", name: "Acme Enterprise License" },
      { id: "deal-13", name: "Catalyst E-commerce Bundle" },
    ],
  },
  {
    _id: "hero-2",
    companyName: "TechVault Inc",
    description: "Cloud-native data protection and backup platform",
    employeeCount: 850,
    dealSize: 75000,
    winProbability: 60,
    leadSource: "Website",
    industries: ["SaaS", "AI/ML"],
    stage: "Proposal",
    labels: ["Follow Up"],
    hasNda: false,
    lastContacted: "2026-03-30",
    website: "https://techvault.io",
    contactEmail: "mike@techvault.io",
    contactPhone: "+1 (650) 555-0456",
    companyHq: "Austin, TX",
    accountColor: "#8b5cf6",
    customMetadata: '{"source":"website","score":74,"tier":"mid-market"}',
    nextFollowUp: "2026-04-15T10:00:00.000Z",
    assignedTo: { id: "tm-2", name: "Marcus Johnson" },
    relatedDeals: [{ id: "deal-2", name: "TechVault Cloud Migration" }],
  },
  {
    _id: "hero-3",
    companyName: "GlobalSync",
    description: "Real-time collaboration tools for distributed teams",
    employeeCount: 340,
    dealSize: 42000,
    winProbability: 45,
    leadSource: "Event",
    industries: ["SaaS"],
    stage: "Negotiation",
    labels: ["SMB", "Follow Up"],
    hasNda: true,
    lastContacted: "2026-04-01",
    website: "https://globalsync.dev",
    contactEmail: "sarah@globalsync.dev",
    contactPhone: "+1 (212) 555-0789",
    companyHq: "New York, NY",
    accountColor: "#22c55e",
    customMetadata: '{"source":"event","score":68,"tier":"smb"}',
    nextFollowUp: "2026-04-08T09:15:00.000Z",
    assignedTo: { id: "tm-3", name: "Emily Rodriguez" },
    relatedDeals: [{ id: "deal-3", name: "GlobalSync Team Plan" }],
  },
  {
    _id: "hero-4",
    companyName: "NovaPay",
    description: "Next-generation payment processing for fintech startups",
    employeeCount: 1200,
    dealSize: 210000,
    winProbability: 30,
    leadSource: "Partner",
    industries: ["Fintech", "E-commerce"],
    stage: "Contacted",
    labels: ["Enterprise", "Startup"],
    hasNda: true,
    lastContacted: "2026-03-25",
    website: "https://novapay.com",
    contactEmail: "alex@novapay.com",
    contactPhone: "+1 (312) 555-0321",
    companyHq: "Chicago, IL",
    accountColor: "#f97316",
    customMetadata: '{"source":"partner","score":55,"tier":"enterprise"}',
    nextFollowUp: "2026-04-20T16:45:00.000Z",
    assignedTo: { id: "tm-4", name: "David Kim" },
    relatedDeals: [
      { id: "deal-4", name: "NovaPay Integration Suite" },
      { id: "deal-18", name: "Eclipse Fintech Gateway" },
      { id: "deal-20", name: "Summit Compliance Package" },
    ],
  },
  {
    _id: "hero-5",
    companyName: "DataForge",
    description: "AI-powered data pipeline orchestration and analytics",
    employeeCount: 180,
    dealSize: 18000,
    winProbability: 15,
    leadSource: "Cold Call",
    industries: ["AI/ML", "SaaS"],
    stage: "New",
    labels: ["Startup"],
    hasNda: false,
    lastContacted: "2026-03-31",
    website: "https://dataforge.ai",
    contactEmail: "founders@dataforge.ai",
    contactPhone: "+1 (510) 555-0654",
    companyHq: "Seattle, WA",
    accountColor: "#6366f1",
    customMetadata: '{"source":"cold_call","score":38,"tier":"startup"}',
    nextFollowUp: "2026-04-05T11:30:00.000Z",
    assignedTo: null,
    relatedDeals: [],
  },
];

export function generateSeedData(): CrmRow[] {
  faker.seed(42);

  const generatedRows: CrmRow[] = Array.from({ length: 145 }, (_, i) => ({
    _id: `row-${i + 6}`,
    companyName: faker.company.name(),
    description: faker.company.catchPhrase(),
    employeeCount: faker.number.int({ min: 5, max: 10000 }),
    dealSize: faker.number.int({ min: 5000, max: 500000 }),
    winProbability: faker.number.int({ min: 5, max: 95 }),
    leadSource: faker.helpers.arrayElement(LEAD_SOURCES),
    industries: randomSubset(INDUSTRIES),
    stage: weightedStage(),
    labels: randomSubset(LABELS, 0, 3),
    hasNda: faker.datatype.boolean(),
    lastContacted: faker.date.recent({ days: 60 }).toISOString().split("T")[0]!,
    website: faker.internet.url(),
    contactEmail: faker.internet.email(),
    contactPhone: faker.phone.number(),
    companyHq: `${faker.location.city()}, ${faker.location.state({ abbreviated: true })}`,
    accountColor: faker.helpers.arrayElement(PRESET_COLORS),
    customMetadata: JSON.stringify({
      source: faker.helpers.arrayElement(["web", "referral", "event", "cold_call"]),
      score: faker.number.int({ min: 10, max: 100 }),
      tier: faker.helpers.arrayElement(["enterprise", "mid-market", "smb", "startup"]),
    }),
    nextFollowUp: randomFutureIso(),
    assignedTo: randomTeamMember(),
    relatedDeals: randomDeals(),
  }));

  return [...heroRows, ...generatedRows];
}
