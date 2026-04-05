"use client"

import { useEffect, useRef, useState } from "react"
import type { UIMessage, ChatStatus } from "ai"
import {
  BookOpen,
  SendHorizontal,
  Loader2,
} from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { ContextTag } from "@/data/demo-scripts"
import { DEMO_STEPS, getAccumulatedTags } from "@/data/demo-scripts"

// ─── Types ───────────────────────────────────────────────────────────

interface KorraChatInput {
  messages: UIMessage[]
  status: ChatStatus
  sendMessage: (message: { text: string }) => Promise<void>
  stop: () => void
}

interface KorraChatProps {
  /** Layout variant */
  variant: "home" | "panel"
  /** Chat helpers from useChat — shared across layouts */
  chat: KorraChatInput
  /** Callback for input changes (for auto-switching to split) */
  onFirstMessage?: () => void
}

// ─── Helpers ─────────────────────────────────────────────────────────

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

function isStreaming(status: ChatStatus): boolean {
  return status === "streaming" || status === "submitted"
}

// ─── Korra Avatar ───────────────────────────────────────────────────

function KorraAvatar() {
  return (
    <Avatar className="mt-0.5 size-6 shrink-0">
      <AvatarFallback className="bg-sky-100 text-[10px] font-semibold text-sky-700 dark:bg-sky-900/40 dark:text-sky-300">
        KO
      </AvatarFallback>
    </Avatar>
  )
}

// ─── Message Bubble ──────────────────────────────────────────────────

function MessageBubble({ message, streaming }: { message: UIMessage; streaming: boolean }) {
  const isUser = message.role === "user"
  const text = getMessageText(message)
  const isAssistantStreaming = !isUser && streaming

  return (
    <div className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}>
      {/* Korra avatar */}
      {!isUser && <KorraAvatar />}

      <div
        className={cn(
          "max-w-[85%] rounded-2xl px-3.5 py-2 text-sm leading-relaxed",
          isUser
            ? "bg-primary text-primary-foreground"
            : "bg-muted/60 text-foreground"
        )}
      >
        {text || (isAssistantStreaming && <TypingIndicator />)}
      </div>
    </div>
  )
}

// ─── Typing Indicator ────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="size-1.5 animate-bounce rounded-full bg-muted-foreground/50"
          style={{ animationDelay: `${i * 150}ms` }}
        />
      ))}
    </div>
  )
}

// ─── Ploybooks Menu ──────────────────────────────────────────────────

function PloyBooksMenu() {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="h-7 gap-1.5 text-muted-foreground">
          <BookOpen className="size-3.5" />
          <span className="text-xs">Ploybooks</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem>
          <BookOpen className="mr-2 size-4" />
          Lead Prioritization
        </DropdownMenuItem>
        <DropdownMenuItem>
          <BookOpen className="mr-2 size-4" />
          Client Health Assessment
        </DropdownMenuItem>
        <DropdownMenuItem>
          <BookOpen className="mr-2 size-4" />
          Deal Pipeline Review
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Chat Input ──────────────────────────────────────────────────────

const GOOGLE_SHEETS_ICON =
  "https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idKa2XnbFY.svg?c=1bxid64Mup7aczewSAYMX&t=1755572735234"

function ChatInput({
  onSend,
  onStop,
  loading,
  variant,
  contextTags = [],
}: {
  onSend: (text: string) => void
  onStop: () => void
  loading: boolean
  variant: "home" | "panel"
  contextTags?: ContextTag[]
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [autopilot, setAutopilot] = useState(false)

  const handleSubmit = () => {
    const text = textareaRef.current?.value.trim()
    if (!text || loading) return
    onSend(text)
    if (textareaRef.current) textareaRef.current.value = ""
    resetHeight()
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const resetHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const handleInput = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`
    }
  }

  return (
    <div className="rounded-xl border border-border/50 bg-background">
      <textarea
        ref={textareaRef}
        placeholder="Ask Korra..."
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        rows={1}
        className={cn(
          "w-full resize-none bg-transparent px-3.5 pt-3 pb-1 text-sm outline-none placeholder:text-muted-foreground",
          variant === "home" ? "min-h-[7rem]" : "min-h-[3rem] max-h-[8rem]"
        )}
      />
      {/* Context tags — only shown when tags exist */}
      {contextTags.length > 0 && (
        <div className="flex flex-wrap items-center gap-1.5 border-t border-border/30 px-3 py-1.5">
          {contextTags.map((tag) => (
            <Badge
              key={tag.name}
              variant="outline"
              className={cn(
                "gap-1.5 py-0.5 text-[11px]",
                tag.type === "source"
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/30 dark:text-emerald-300"
                  : "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-800 dark:bg-sky-950/30 dark:text-sky-300"
              )}
            >
              {tag.icon === "google-sheets" ? (
                <img
                  src={GOOGLE_SHEETS_ICON}
                  alt="Google Sheets"
                  width={12}
                  height={12}
                  className="size-3 object-contain"
                />
              ) : (
                <BookOpen className="size-3" />
              )}
              {tag.name}
            </Badge>
          ))}
        </div>
      )}

      {/* Actions footer */}
      <div className="flex items-center justify-between border-t border-border/30 px-2 py-1.5">
        <PloyBooksMenu />
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Switch
              id="autopilot"
              checked={autopilot}
              onCheckedChange={setAutopilot}
              className="h-4 w-7 data-[state=checked]:bg-sky-600 [&_span]:size-3 [&_span]:data-[state=checked]:translate-x-3"
            />
            <Label
              htmlFor="autopilot"
              className="cursor-pointer text-xs text-muted-foreground select-none"
            >
              Autopilot
            </Label>
          </div>
          {loading ? (
            <Button size="icon" variant="ghost" className="size-7" onClick={onStop}>
              <Loader2 className="size-4 animate-spin" />
            </Button>
          ) : (
            <Button size="icon" variant="ghost" className="size-7" onClick={handleSubmit}>
              <SendHorizontal className="size-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── Main Component ──────────────────────────────────────────────────

export function KorraChat({ variant, chat, onFirstMessage }: KorraChatProps) {
  const { messages, status, sendMessage, stop } = chat
  const scrollRef = useRef<HTMLDivElement>(null)
  const hasCalledFirstMessage = useRef(false)

  // Auto-scroll when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [messages, status])

  const handleSend = (text: string) => {
    if (!hasCalledFirstMessage.current && onFirstMessage) {
      hasCalledFirstMessage.current = true
      onFirstMessage()
    }
    sendMessage({ text })
  }

  const streaming = isStreaming(status)
  const hasMessages = messages.length > 0

  // Derive current demo step from assistant message count (same logic as route.ts)
  const assistantCount = messages.filter((m) => m.role === "assistant").length
  const stepIndex = Math.max(0, assistantCount - 1)
  const contextTags = variant === "panel" ? getAccumulatedTags(stepIndex) : []

  // ─── Panel variant ───────────────────────────────────────────────
  if (variant === "panel") {
    return (
      <div className="flex h-full flex-col border-l border-border/40">
        {/* Header */}
        <div className="flex h-12 shrink-0 items-center border-b border-border/40 px-4">
          <span className="text-sm font-medium">Korra</span>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollRef} className="flex-1 px-4 py-3">
          {hasMessages ? (
            <div className="space-y-3">
              {messages.map((msg, i) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  streaming={streaming && i === messages.length - 1 && msg.role === "assistant"}
                />
              ))}
              {streaming && messages[messages.length - 1]?.role === "user" && (
                <div className="flex gap-2.5">
                  <KorraAvatar />
                  <div className="rounded-2xl bg-muted/60 px-3.5 py-2">
                    <TypingIndicator />
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex h-full items-center justify-center">
              <p className="text-sm text-muted-foreground">
                Ask Korra to help with your data
              </p>
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="shrink-0 p-4 pt-2">
          <ChatInput
            onSend={handleSend}
            onStop={stop}
            loading={streaming}
            variant="panel"
            contextTags={contextTags}
          />
        </div>
      </div>
    )
  }

  // ─── Home variant ────────────────────────────────────────────────
  return (
    <div className="w-full space-y-4">
      {/* Show messages inline if any exist */}
      {hasMessages && (
        <div className="max-h-64 space-y-3 overflow-y-auto rounded-xl border border-border/30 p-4">
          {messages.map((msg, i) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              streaming={streaming && i === messages.length - 1 && msg.role === "assistant"}
            />
          ))}
        </div>
      )}

      {/* Input */}
      <ChatInput
        onSend={handleSend}
        onStop={stop}
        loading={streaming}
        variant="home"
      />
    </div>
  )
}
