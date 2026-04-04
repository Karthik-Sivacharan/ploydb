"use client"

import { useEffect, useRef } from "react"
import type { UIMessage, ChatStatus } from "ai"
import {
  Database,
  Sparkles,
  Users,
  HandshakeIcon,
  SendHorizontal,
  Loader2,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

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

// ─── Message Bubble ──────────────────────────────────────────────────

function MessageBubble({ message, streaming }: { message: UIMessage; streaming: boolean }) {
  const isUser = message.role === "user"
  const text = getMessageText(message)
  const isAssistantStreaming = !isUser && streaming

  return (
    <div className={cn("flex gap-2.5", isUser ? "justify-end" : "justify-start")}>
      {/* Korra avatar */}
      {!isUser && (
        <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
          <Sparkles className="size-3.5 text-primary" />
        </div>
      )}

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
          <Database className="size-3.5" />
          <span className="text-xs">Ploybooks</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        <DropdownMenuItem>
          <Sparkles className="mr-2 size-4" />
          Lead Prioritization
        </DropdownMenuItem>
        <DropdownMenuItem>
          <Users className="mr-2 size-4" />
          Client Health Assessment
        </DropdownMenuItem>
        <DropdownMenuItem>
          <HandshakeIcon className="mr-2 size-4" />
          Deal Pipeline Review
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

// ─── Chat Input ──────────────────────────────────────────────────────

function ChatInput({
  onSend,
  onStop,
  loading,
  variant,
}: {
  onSend: (text: string) => void
  onStop: () => void
  loading: boolean
  variant: "home" | "panel"
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

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
      <div className="flex items-center justify-between border-t border-border/30 px-2 py-1.5">
        <PloyBooksMenu />
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
                  <div className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <Sparkles className="size-3.5 text-primary" />
                  </div>
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
