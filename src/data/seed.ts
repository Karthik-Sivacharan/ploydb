import { faker } from "@faker-js/faker";

export interface CrmRow {
  _id: string;
  companyName: string;
  description: string;
  employeeCount: number;
  leadSource: string;
  industries: string[];
  hasNda: boolean;
  lastContacted: string;
  website: string;
}

const LEAD_SOURCES = ["Referral", "Website", "Cold Call", "Event", "Partner"];
const INDUSTRIES = ["SaaS", "Fintech", "Healthcare", "E-commerce", "AI/ML"];

function randomSubset(items: string[], min = 1, max = 3): string[] {
  const count = faker.number.int({ min, max: Math.min(max, items.length) });
  return faker.helpers.arrayElements(items, count);
}

const heroRows: CrmRow[] = [
  {
    _id: "hero-1",
    companyName: "Acme Corp",
    description: "Enterprise solutions for supply chain automation",
    employeeCount: 2400,
    leadSource: "Referral",
    industries: ["SaaS", "E-commerce"],
    hasNda: true,
    lastContacted: "2026-03-28",
    website: "https://acme.com",
  },
  {
    _id: "hero-2",
    companyName: "TechVault Inc",
    description: "Cloud-native data protection and backup platform",
    employeeCount: 850,
    leadSource: "Website",
    industries: ["SaaS", "AI/ML"],
    hasNda: false,
    lastContacted: "2026-03-30",
    website: "https://techvault.io",
  },
  {
    _id: "hero-3",
    companyName: "GlobalSync",
    description: "Real-time collaboration tools for distributed teams",
    employeeCount: 340,
    leadSource: "Event",
    industries: ["SaaS"],
    hasNda: true,
    lastContacted: "2026-04-01",
    website: "https://globalsync.dev",
  },
  {
    _id: "hero-4",
    companyName: "NovaPay",
    description: "Next-generation payment processing for fintech startups",
    employeeCount: 1200,
    leadSource: "Partner",
    industries: ["Fintech", "E-commerce"],
    hasNda: true,
    lastContacted: "2026-03-25",
    website: "https://novapay.com",
  },
  {
    _id: "hero-5",
    companyName: "DataForge",
    description: "AI-powered data pipeline orchestration and analytics",
    employeeCount: 180,
    leadSource: "Cold Call",
    industries: ["AI/ML", "SaaS"],
    hasNda: false,
    lastContacted: "2026-03-31",
    website: "https://dataforge.ai",
  },
];

export function generateSeedData(): CrmRow[] {
  faker.seed(42);

  const generatedRows: CrmRow[] = Array.from({ length: 145 }, (_, i) => ({
    _id: `row-${i + 6}`,
    companyName: faker.company.name(),
    description: faker.company.catchPhrase(),
    employeeCount: faker.number.int({ min: 5, max: 10000 }),
    leadSource: faker.helpers.arrayElement(LEAD_SOURCES),
    industries: randomSubset(INDUSTRIES),
    hasNda: faker.datatype.boolean(),
    lastContacted: faker.date
      .recent({ days: 60 })
      .toISOString()
      .split("T")[0]!,
    website: faker.internet.url(),
  }));

  return [...heroRows, ...generatedRows];
}
