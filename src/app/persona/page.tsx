"use client"

import Link from "next/link"
import {
  Globe,
  Sparkles,
  Rows3,
  Bot,
  Search,
  BookOpen,
  ArrowRight,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

const tools = [
  {
    name: "Sheets",
    iconUrl: "https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idKa2XnbFY.svg?c=1bxid64Mup7aczewSAYMX&t=1755572735234",
    usage: "Stores contacts, companies, deals",
    pain: "No automation, just rows and columns",
  },
  {
    name: "Webflow",
    iconUrl: "https://cdn.brandfetch.io/id4knLKYsV/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX&t=1697573445977",
    usage: "Marketing site",
    pain: "Disconnected from her contact data",
  },
  {
    name: "Analytics",
    iconUrl: "https://cdn.brandfetch.io/idYpJMnlBx/w/192/h/192/theme/dark/logo.png?c=1bxid64Mup7aczewSAYMX&t=1768155572893",
    usage: "A/B testing different Webflow pages",
    pain: "No way to tie test results back to contacts",
  },
  {
    name: "Clearbit",
    iconUrl: "https://cdn.brandfetch.io/idPfQccWRj/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX&t=1668081777632",
    usage: "Company identification on site visitors",
    pain: "Separate dashboard, manual cross-referencing",
  },
  {
    name: "Folloze",
    iconUrl: "https://cdn.brandfetch.io/idu9qaRVv0/w/400/h/400/theme/dark/icon.jpeg?c=1bxid64Mup7aczewSAYMX&t=1760456437932",
    usage: "Personalized sales pages",
    pain: "Dropped it, one tool too many",
    dropped: true,
  },
  {
    name: "ChatGPT",
    iconUrl: "https://cdn.brandfetch.io/id2UDPob7G/theme/light/logo.svg?c=1bxid64Mup7aczewSAYMX&t=1754282224780",
    usage: "Drafting emails, researching accounts",
    pain: "Copy-paste between tools",
  },
]

const ployFeatures = [
  {
    icon: Globe,
    title: "Sites",
    replaces: "Webflow",
    description:
      "stackline.com lives here. Edit pages, clone competitors, publish. No dev needed.",
  },
  {
    icon: Sparkles,
    title: "Ploys",
    replaces: "Google Optimize",
    description:
      'AB tests on hero sections. Currently testing "Draft contracts 3x faster" vs "AI-powered legal docs." GA integration shows which converts better.',
  },
  {
    icon: Rows3,
    title: "Records",
    replaces: "Sheets",
    description:
      "960 contacts, 142 companies, 30 deals. Same CRM, no separate tool.",
  },
  {
    icon: Bot,
    title: "Korra AI",
    replaces: "ChatGPT + manual work",
    description:
      "Reads and writes to Sites, Ploys, and Records. Not a sidebar, a coworker.",
  },
  {
    icon: Search,
    title: "Clearbit Integration",
    replaces: "standalone Clearbit",
    description:
      "Knows which companies and contacts visit the site. Data flows directly into Records.",
  },
  {
    icon: BookOpen,
    title: "Ploybooks",
    replaces: "scattered playbooks",
    description:
      "Reusable AI workflows: Contact Prioritization, Personalized Outreach, Build a Content Page.",
  },
]

const demoSteps = [
  { step: 0, action: 'Sofia clicks "Re-engage cold leads"', feature: "Korra" },
  { step: 1, action: "Korra finds 130 stale leads", feature: "Records" },
  { step: 2, action: "Filters to stale leads", feature: "Records" },
  {
    step: 3,
    action: "Links Industry + Company Size from Companies table",
    feature: "Records (cross-table)",
  },
  {
    step: 4,
    action: "Researches industries, finds Legal AI adoption is surging",
    feature: "Korra + Web",
  },
  {
    step: 5,
    action: "Asks to prioritize by seniority + company size",
    feature: "Korra",
  },
  {
    step: 6,
    action: "Adds Priority column, fills 34 rows, sorts",
    feature: "Ploybook: Contact Prioritization",
  },
  {
    step: 7,
    action: "Sofia overrides one ranking. Korra acknowledges.",
    feature: "Human + Korra",
  },
  {
    step: 8,
    action: "Drafts personalized re-engagement emails",
    feature: "Ploybook: Personalized Outreach",
  },
  {
    step: 9,
    action: 'Suggests personalized pages using winning AB test header ("AI-powered legal docs")',
    feature: "Sites + Ploys + Ploybook",
  },
]

export default function PersonaPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-4xl px-6 py-16">
        {/* Hero */}
        <section className="flex flex-col items-center text-center">
          <Avatar className="mb-6 h-20 w-20 text-2xl">
            <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-semibold">
              SC
            </AvatarFallback>
          </Avatar>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            Sofia Carter
          </h1>
          <p className="mt-2 text-xl text-muted-foreground">
            Head of Growth at Stackline
          </p>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Badge variant="secondary">Series A</Badge>
            <Badge variant="secondary">$4M ARR</Badge>
            <Badge variant="secondary">35 people</Badge>
          </div>
          <p className="mt-6 max-w-2xl text-muted-foreground leading-relaxed">
            Stackline sells AI-powered document automation. Contract
            drafting, clause review, redline suggestions. Sofia runs growth
            with a team of 3, managing everything from lead gen to outreach.
          </p>
        </section>

        <Separator className="my-16" />

        {/* Toolbox */}
        <section>
          <h2 className="mb-2 text-2xl font-semibold tracking-tight">
            Sofia&apos;s Toolbox Today
          </h2>
          <p className="mb-6 text-muted-foreground">
            The problem: six tools that don&apos;t talk to each other.
          </p>
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">Tool</TableHead>
                    <TableHead>What she uses it for</TableHead>
                    <TableHead>Pain point</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tools.map((t) => (
                    <TableRow key={t.name}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <img src={t.iconUrl} alt={t.name} width={20} height={20} className="size-5 rounded object-contain" />
                          <span className="font-medium">{t.name}</span>
                          {t.dropped && (
                            <Badge
                              variant="destructive"
                              className="ml-1 text-[10px] px-1.5 py-0"
                            >
                              Dropped
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{t.usage}</TableCell>
                      <TableCell className="text-muted-foreground">
                        {t.pain}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <p className="mt-4 rounded-md border border-dashed border-amber-500/40 bg-amber-500/5 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
            6 tools. Constant tab-switching. Data lives in silos. Sofia copies
            information between tools manually.
          </p>
        </section>

        <Separator className="my-16" />

        {/* One Workspace */}
        <section>
          <h2 className="mb-2 text-2xl font-semibold tracking-tight">
            One Workspace
          </h2>
          <p className="mb-6 text-muted-foreground">
            How Ploy replaces everything Sofia uses today.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {ployFeatures.map((f) => (
              <Card key={f.title}>
                <CardHeader className="pb-2">
                  <div className="flex items-center gap-2">
                    <f.icon className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{f.title}</CardTitle>
                  </div>
                  <CardDescription className="text-xs">
                    Replaces {f.replaces}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {f.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        <Separator className="my-16" />

        {/* Demo Flow */}
        <section>
          <h2 className="mb-2 text-2xl font-semibold tracking-tight">
            The Demo Flow
          </h2>
          <p className="mb-6 text-muted-foreground">
            What we&apos;re about to show. 10 steps, end to end.
          </p>
          <div className="space-y-3">
            {demoSteps.map((s) => (
              <div
                key={s.step}
                className="flex items-start gap-4 rounded-lg border px-4 py-3"
              >
                <span
                  className={cn(
                    "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                    "bg-primary text-primary-foreground"
                  )}
                >
                  {s.step}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{s.action}</p>
                </div>
                <Badge variant="outline" className="shrink-0 text-xs">
                  {s.feature}
                </Badge>
              </div>
            ))}
          </div>
        </section>

        <Separator className="my-16" />

        {/* CTA */}
        <section className="flex flex-col items-center text-center">
          <h2 className="text-2xl font-semibold tracking-tight">
            Ready to see it in action?
          </h2>
          <p className="mt-2 mb-6 text-muted-foreground">
            Step into Sofia&apos;s workspace and watch Korra work.
          </p>
          <Button asChild size="lg">
            <Link href="/">
              Start the Demo
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </section>

        <div className="h-16" />
      </div>
    </div>
  )
}
