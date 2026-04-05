"use client"

import { useCallback, useMemo, useRef, useState } from "react"
import { useTheme } from "next-themes"
import { useChat } from "@ai-sdk/react"
import { createToolCallHandler } from "@/lib/tool-handler"
import { AnimatePresence, motion } from "motion/react"
import {
  FileText,
  Target,
  Users,
  HandshakeIcon,
} from "lucide-react"
import { fade, transitions } from "@/lib/motion"
import { Badge } from "@/components/ui/badge"
import { SidebarTrigger, useSidebar } from "@/components/ui/sidebar"
import { ShootingStars } from "@/components/ui/shooting-stars"
import { Separator } from "@/components/ui/separator"
import { useNav } from "@/components/nav-context"
import { KorraChat } from "@/components/home/korra-chat"
import { DataGridView } from "@/components/home/data-grid-view"
import { DEMO_STEPS } from "@/data/demo-scripts"
import type { GridHandle } from "@/types/grid-handle"

// Derive initial database from step 0's openDatabase tool call
const openDbCall = DEMO_STEPS[0]?.toolCalls.find((tc) => tc.name === "openDatabase")
const INITIAL_DB_SLUG = (openDbCall?.args?.slug as string) ?? "contacts"

const TEMPLATES = [
  {
    icon: Target,
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
  const [showAuditTrail, setShowAuditTrail] = useState(true)
  const { setOpen } = useSidebar()
  const { setActiveNav } = useNav()
  const { resolvedTheme } = useTheme()

  // Grid handle for Korra tool calls to manipulate the table
  const gridRef = useRef<GridHandle>(null)

  // Tool call handler bridges AI tool calls → grid APIs
  const onToolCall = useMemo(() => createToolCallHandler(gridRef), [])

  // Single useChat instance shared across both layouts
  const chat = useChat({ onToolCall })

  const switchToSplit = useCallback(() => {
    // Disable sidebar transition so collapse is instant (no animation to fight)
    const sidebarEl = document.querySelector("[data-sidebar='sidebar']")
    const sidebarGap = sidebarEl?.parentElement?.previousElementSibling as HTMLElement | null
    const sidebarFixed = sidebarEl?.parentElement as HTMLElement | null

    if (sidebarGap) sidebarGap.style.transitionDuration = "0s"
    if (sidebarFixed) sidebarFixed.style.transitionDuration = "0s"

    setOpen(false) // collapses instantly — no CSS transition to fight
    setView("split") // AnimatePresence handles the crossfade
    setActiveNav("Records") // highlight Records in sidebar

    // Restore sidebar transitions for future manual toggles
    requestAnimationFrame(() => {
      if (sidebarGap) sidebarGap.style.transitionDuration = ""
      if (sidebarFixed) sidebarFixed.style.transitionDuration = ""
    })
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

  return (
    <AnimatePresence mode="wait">
      {view === "split" ? (
        // ─── Split view: data grid + chat panel ─────────────────────────
        <motion.div
          key="split"
          className="flex h-full overflow-hidden"
          variants={fade}
          initial="initial"
          animate="animate"
          transition={transitions.fast.enter}
        >
          {/* Data grid takes remaining space */}
          <div className="min-w-0 flex-1 overflow-hidden">
            {/* DEBUG: uncomment to test grid APIs directly
            <div className="flex gap-2 border-b bg-yellow-50 px-4 py-1 dark:bg-yellow-950">
              <button className="rounded bg-blue-500 px-2 py-0.5 text-xs text-white" onClick={() => { const grid = gridRef.current; if (!grid) return; grid.table.setColumnFilters([{ id: "fld_tags", value: { operator: "contains", value: "lead" } }]) }}>Test Filter</button>
              <button className="rounded bg-gray-500 px-2 py-0.5 text-xs text-white" onClick={() => { gridRef.current?.table.setColumnFilters([]) }}>Clear Filters</button>
              <button className="rounded bg-green-500 px-2 py-0.5 text-xs text-white" onClick={() => { gridRef.current?.table.setSorting([{ id: "fld_last_contacted", desc: true }]) }}>Test Sort</button>
              <button className="rounded bg-purple-500 px-2 py-0.5 text-xs text-white" onClick={() => { gridRef.current?.addColumn({ id: "priority", name: "Priority", type: "select", options: [{ value: "High", label: "High", color: "#ef4444" }, { value: "Medium", label: "Medium", color: "#f59e0b" }, { value: "Low", label: "Low", color: "#22c55e" }] }) }}>Test Add Column</button>
            </div>
            */}
            <DataGridView gridRef={gridRef} initialSlug={INITIAL_DB_SLUG} showAuditTrail={showAuditTrail} />
          </div>

          {/* Chat panel on the right — fixed width, same useChat instance */}
          <div className="flex h-full w-[380px] min-w-[380px] max-w-[380px] flex-col border-l bg-muted/30">
            <KorraChat variant="panel" chat={chat} showAuditTrail={showAuditTrail} onShowAuditTrailChange={setShowAuditTrail} />
          </div>
        </motion.div>
      ) : (
        // ─── Home view: centered chat ───────────────────────────────────
        <motion.div
          key="home"
          className="flex h-full flex-col"
          variants={fade}
          initial="initial"
          animate="animate"
          exit="exit"
          transition={transitions.fast.exit}
        >
          {/* Minimal header with sidebar trigger */}
          <header className="flex h-12 shrink-0 items-center px-4">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-2 h-4" />
            <span className="text-sm text-muted-foreground">Overview</span>
          </header>

          {/* Spirit energy streaks — subtle ambient background (dark mode only) */}
          <ShootingStars className="flex-1" disabled={resolvedTheme !== "dark"}>
          {/* Centered chat area */}
          <div className="flex h-full flex-col items-center justify-center px-4 pb-24">
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
                      Suggested for you
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
          </ShootingStars>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
