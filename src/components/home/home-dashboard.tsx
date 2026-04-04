"use client"

import { useCallback, useState } from "react"
import { useRouter } from "next/navigation"
import {
  Database,
  FileText,
  Image,
  Sparkles,
  Users,
  Building2,
  HandshakeIcon,
  Tag,
  Film,
} from "lucide-react"
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputSubmit,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
} from "@/components/ai-elements/prompt-input"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"

const TEMPLATES = [
  {
    icon: Sparkles,
    title: "Prioritize stale leads",
    description: "Find contacts you haven't reached in 60+ days",
    prompt: "Prioritize my stale leads — contacts I haven't reached out to in over 60 days.",
  },
  {
    icon: Users,
    title: "Clean up contacts",
    description: "Find duplicates, missing fields, and bad data",
    prompt: "Clean up my contacts database — find duplicates, missing emails, and incomplete records.",
  },
  {
    icon: HandshakeIcon,
    title: "Analyze deal pipeline",
    description: "Review deals by stage, value, and close date",
    prompt: "Analyze my deal pipeline — show me deals at risk, overdue close dates, and stage distribution.",
  },
  {
    icon: FileText,
    title: "Audit content status",
    description: "Check drafts, stale content, and publishing gaps",
    prompt: "Audit my content database — find stale drafts, unpublished items, and content gaps.",
  },
]

const DATABASES = [
  { name: "Contacts", icon: Users, count: 960 },
  { name: "Companies", icon: Building2, count: 180 },
  { name: "Deals", icon: HandshakeIcon, count: 520 },
  { name: "Content", icon: FileText, count: 850 },
  { name: "Categories", icon: Tag, count: 40 },
  { name: "Media", icon: Film, count: 1250 },
]

const CONNECTED_SOURCES = [
  { name: "Google Sheets", color: "bg-green-500" },
  { name: "Airtable", color: "bg-blue-500" },
  { name: "Notion", color: "bg-foreground" },
]

export function HomeDashboard() {
  const router = useRouter()
  const [showTemplates, setShowTemplates] = useState(true)

  const handleSubmit = useCallback(
    (message: { text: string }) => {
      // For now, navigate to database view
      // Phase 3 will add the animated transition + Korra chat
      if (message.text.trim()) {
        router.push("/database")
      }
    },
    [router]
  )

  const handleTemplateClick = useCallback(
    (prompt: string) => {
      // Phase 3: send to Korra + animate transition
      // For now, navigate to database
      void prompt
      router.push("/database")
    },
    [router]
  )

  return (
    <div className="flex h-full flex-col">
      {/* Minimal header with sidebar trigger */}
      <header className="flex h-12 shrink-0 items-center px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mx-2 h-4" />
        <span className="text-sm text-muted-foreground">Home</span>
      </header>

      {/* Centered chat area */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 pb-24">
        <div className="w-full max-w-2xl space-y-8">
          {/* Greeting */}
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">
              Hey Karthik, how can I help?
            </h1>
            <p className="text-muted-foreground">
              Ask anything or tell Korra what you need
            </p>
          </div>

          {/* Prompt Input */}
          <PromptInput onSubmit={handleSubmit} className="[&_[data-slot=input-group]]:rounded-xl [&_[data-slot=input-group]]:border-border/50">
            <PromptInputTextarea placeholder="Ask Korra..." className="min-h-28" />
            <PromptInputFooter className="border-t border-border/30 pt-2">
              <PromptInputTools>
                <PromptInputActionMenu>
                  <PromptInputActionMenuTrigger tooltip="Ploybooks">
                    <Database className="size-4" />
                    <span className="text-sm">Ploybooks</span>
                  </PromptInputActionMenuTrigger>
                  <PromptInputActionMenuContent>
                    <PromptInputActionMenuItem>
                      <Sparkles className="size-4" />
                      Lead Prioritization
                    </PromptInputActionMenuItem>
                    <PromptInputActionMenuItem>
                      <Users className="size-4" />
                      Client Health Assessment
                    </PromptInputActionMenuItem>
                    <PromptInputActionMenuItem>
                      <HandshakeIcon className="size-4" />
                      Deal Pipeline Review
                    </PromptInputActionMenuItem>
                  </PromptInputActionMenuContent>
                </PromptInputActionMenu>
              </PromptInputTools>
              <PromptInputSubmit />
            </PromptInputFooter>
          </PromptInput>

          {/* Connected Sources */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground">Connected:</span>
            {CONNECTED_SOURCES.map((source) => (
              <Badge key={source.name} variant="secondary" className="gap-1.5 text-xs">
                <span className={`size-2 rounded-full ${source.color}`} />
                {source.name}
              </Badge>
            ))}
          </div>

          {/* Template Cards */}
          {showTemplates && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  Get started with some examples
                </span>
                <button
                  onClick={() => setShowTemplates(false)}
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  &times;
                </button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {TEMPLATES.map((template) => (
                  <button
                    key={template.title}
                    onClick={() => handleTemplateClick(template.prompt)}
                    className="group flex flex-col gap-3 rounded-xl border border-border/60 bg-card p-4 text-left transition-colors hover:border-border hover:bg-accent/50"
                  >
                    <template.icon className="size-5 text-muted-foreground" />
                    <div className="space-y-1">
                      <div className="text-sm font-medium">{template.title}</div>
                      <div className="text-xs text-muted-foreground">
                        {template.description}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Databases overview */}
          <div className="space-y-3">
            <span className="text-sm text-muted-foreground">Your databases</span>
            <div className="grid grid-cols-3 gap-2">
              {DATABASES.map((db) => (
                <button
                  key={db.name}
                  onClick={() => router.push("/database")}
                  className="flex items-center gap-2.5 rounded-lg border border-border/40 px-3 py-2.5 text-left transition-colors hover:border-border hover:bg-accent/50"
                >
                  <db.icon className="size-4 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-medium">{db.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {db.count.toLocaleString()} rows
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
