"use client"

import { useCallback, useState } from "react"
import { useChat } from "@ai-sdk/react"
import {
  FileText,
  Sparkles,
  Users,
  HandshakeIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { Separator } from "@/components/ui/separator"
import { KorraChat } from "@/components/home/korra-chat"
import { DataGridView } from "@/components/home/data-grid-view"

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

const CONNECTED_SOURCES = [
  { name: "Google Sheets", iconUrl: "https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idKa2XnbFY.svg?c=1bxid64Mup7aczewSAYMX&t=1755572735234" },
  { name: "Google Analytics", iconUrl: "https://cdn.brandfetch.io/idYpJMnlBx/w/192/h/192/theme/dark/logo.png?c=1bxid64Mup7aczewSAYMX&t=1768155572893" },
  { name: "Figma", iconUrl: "https://cdn.brandfetch.io/idZHcZ_i7F/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX&t=1729268241679" },
]

type View = "home" | "split"

export function HomeDashboard() {
  const [view, setView] = useState<View>("home")
  const [showTemplates, setShowTemplates] = useState(true)
  const { setOpen } = useSidebar()

  // Single useChat instance shared across both layouts
  const chat = useChat()

  const switchToSplit = useCallback(() => {
    setOpen(false) // collapse sidebar to icon mode
    setView("split")
  }, [setOpen])

  const handleFirstMessage = useCallback(() => {
    switchToSplit()
  }, [switchToSplit])

  const handleTemplateClick = useCallback(
    (prompt: string) => {
      chat.sendMessage({ text: prompt })
      switchToSplit()
    },
    [chat, switchToSplit]
  )

  // ─── Split view: data grid + chat panel ───────────────────────────────
  if (view === "split") {
    return (
      <div className="flex h-full overflow-hidden">
        {/* Data grid takes remaining space */}
        <div className="min-w-0 flex-1 overflow-hidden">
          <DataGridView />
        </div>

        {/* Chat panel on the right — fixed width, same useChat instance */}
        <div className="flex h-full w-[380px] min-w-[380px] max-w-[380px] flex-col">
          <KorraChat variant="panel" chat={chat} />
        </div>
      </div>
    )
  }

  // ─── Home view: centered chat ─────────────────────────────────────────
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

          {/* Chat input (and messages if any) */}
          <KorraChat
            variant="home"
            chat={chat}
            onFirstMessage={handleFirstMessage}
          />

          {/* Connected Sources */}
          <div className="flex items-center justify-center gap-2">
            <span className="text-xs text-muted-foreground">Connected:</span>
            {CONNECTED_SOURCES.map((source) => (
              <Badge key={source.name} variant="secondary" className="gap-1.5 py-1.5 text-xs">
                <img src={source.iconUrl} alt={source.name} width={16} height={16} className="size-4 object-contain" />
                {source.name}
              </Badge>
            ))}
            <Badge variant="outline" className="cursor-pointer py-1.5 text-xs text-muted-foreground hover:text-foreground">
              +
            </Badge>
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
        </div>
      </div>
    </div>
  )
}
