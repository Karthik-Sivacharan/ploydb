"use client"

import { useRef, useState } from "react"
import type { UIMessage, ChatStatus } from "ai"
import { BookOpen, Paperclip } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { cn } from "@/lib/utils"
import type { ContextTag } from "@/data/demo-scripts"
import { getAccumulatedTags, AUTO_ADVANCE_PREFIX } from "@/data/demo-scripts"
import { ToolResultCard } from "@/components/korra/tool-cards/tool-result-card"
import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation"
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message"
import {
  Reasoning,
  ReasoningTrigger,
  ReasoningContent,
} from "@/components/ai-elements/reasoning"
import { Shimmer } from "@/components/ai-elements/shimmer"
import { BrainIcon } from "lucide-react"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  PromptInput,
  PromptInputTextarea,
  PromptInputFooter,
  PromptInputTools,
  PromptInputActionMenu,
  PromptInputActionMenuTrigger,
  PromptInputActionMenuContent,
  PromptInputActionMenuItem,
  PromptInputSubmit,
} from "@/components/ai-elements/prompt-input"

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
  /** Tool execution results map (toolCallId → result data) */
  toolResults?: Map<string, Record<string, unknown>>
  /** Whether audit trail triangles are visible in the grid */
  showAuditTrail?: boolean
  /** Callback to toggle audit trail visibility */
  onShowAuditTrailChange?: (value: boolean) => void
}

// ─── Helpers ─────────────────────────────────────────────────────────

const GOOGLE_SHEETS_ICON =
  "https://cdn.brandfetch.io/id6O2oGzv-/theme/dark/idKa2XnbFY.svg?c=1bxid64Mup7aczewSAYMX&t=1755572735234"

const CLEARBIT_ICON =
  "https://cdn.brandfetch.io/idPfQccWRj/theme/dark/symbol.svg?c=1bxid64Mup7aczewSAYMX&t=1668081777632"

const GOOGLE_ANALYTICS_ICON =
  "https://cdn.brandfetch.io/idYpJMnlBx/w/192/h/192/theme/dark/logo.png?c=1bxid64Mup7aczewSAYMX&t=1768155572893"

function getMessageText(message: UIMessage): string {
  return message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join("")
}

// ─── Context Tags Row ────────────────────────────────────────────────

function ContextTagsRow({ tags }: { tags: ContextTag[] }) {
  if (tags.length === 0) return null

  return (
    <div className="flex w-full flex-wrap items-center gap-1.5 border-t border-border/20 px-3 pt-3 pb-1.5">
      {tags.map((tag) => (
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
          ) : tag.icon === "clearbit" ? (
            <img
              src={CLEARBIT_ICON}
              alt="Clearbit"
              width={12}
              height={12}
              className="size-3 object-contain"
            />
          ) : tag.icon === "google-analytics" ? (
            <img
              src={GOOGLE_ANALYTICS_ICON}
              alt="Google Analytics"
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
  )
}

// ─── Model Data ─────────────────────────────────────────────────────

type ModelProvider = "anthropic" | "openai" | "google"

const MODELS: { id: string; name: string; provider: ModelProvider }[] = [
  { id: "claude-sonnet-4", name: "Claude Sonnet 4", provider: "anthropic" },
  { id: "claude-opus-4", name: "Claude Opus 4", provider: "anthropic" },
  { id: "claude-haiku-4-5", name: "Claude Haiku 4.5", provider: "anthropic" },
  { id: "gpt-4o", name: "GPT-4o", provider: "openai" },
  { id: "gpt-4o-mini", name: "GPT-4o Mini", provider: "openai" },
  { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", provider: "google" },
  { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", provider: "google" },
]

/** Renders a provider logo from models.dev — uniform sizing, dark:invert for dark mode */
function ProviderLogo({ provider, className }: { provider: ModelProvider; className?: string }) {
  return (
    <img
      alt={`${provider} logo`}
      src={`https://models.dev/logos/${provider}.svg`}
      width={16}
      height={16}
      className={cn("size-4 shrink-0 dark:invert", className)}
    />
  )
}

// ─── Korra Prompt Input ──────────────────────────────────────────────

function KorraPromptInput({
  onSend,
  onStop,
  status,
  variant,
  contextTags = [],
}: {
  onSend: (text: string) => void
  onStop: () => void
  status: ChatStatus
  variant: "home" | "panel"
  contextTags?: ContextTag[]
}) {
  const [autopilot, setAutopilot] = useState(false)
  const [selectedModel, setSelectedModel] = useState(MODELS[0])

  const handleSubmit = ({ text }: { text: string }) => {
    if (!text.trim()) return
    onSend(text)
  }

  // Group models by provider for the dropdown
  const grouped = MODELS.reduce<Record<ModelProvider, typeof MODELS>>((acc, m) => {
    ;(acc[m.provider] ??= []).push(m)
    return acc
  }, {} as Record<ModelProvider, typeof MODELS>)

  return (
    <PromptInput onSubmit={handleSubmit}>
      <PromptInputTextarea
        placeholder={variant === "home" ? "What should we work on?" : "Ask Korra..."}
        className={cn(
          variant === "home" ? "min-h-[7rem]" : "min-h-[3rem] max-h-[8rem]"
        )}
      />

      {/* Context tags — only shown when tags exist */}
      <ContextTagsRow tags={contextTags} />

      <PromptInputFooter>
        <PromptInputTools>
          {/* 1. Model selector — logo only trigger, logo + name in dropdown */}
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger>
              <ProviderLogo provider={selectedModel.provider} />
            </PromptInputActionMenuTrigger>
            <PromptInputActionMenuContent>
              {(Object.keys(grouped) as ModelProvider[]).map((provider) => (
                grouped[provider].map((model) => (
                  <PromptInputActionMenuItem
                    key={model.id}
                    onSelect={() => setSelectedModel(model)}
                  >
                    <ProviderLogo provider={model.provider} />
                    <span>{model.name}</span>
                  </PromptInputActionMenuItem>
                ))
              ))}
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>

          {/* 2. File upload */}
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger>
              <Paperclip className="size-4" />
            </PromptInputActionMenuTrigger>
            <PromptInputActionMenuContent>
              <PromptInputActionMenuItem>Upload from computer</PromptInputActionMenuItem>
              <PromptInputActionMenuItem>Google Drive</PromptInputActionMenuItem>
              <PromptInputActionMenuItem>Paste URL</PromptInputActionMenuItem>
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>

          {/* 3. Ploybooks menu */}
          <PromptInputActionMenu>
            <PromptInputActionMenuTrigger>
              <BookOpen className="size-4" />
              {variant === "home" && <span className="text-sm">Ploybooks</span>}
            </PromptInputActionMenuTrigger>
            <PromptInputActionMenuContent>
              <PromptInputActionMenuItem>
                Lead Prioritization
              </PromptInputActionMenuItem>
              <PromptInputActionMenuItem>
                Client Health Assessment
              </PromptInputActionMenuItem>
              <PromptInputActionMenuItem>
                Deal Pipeline Review
              </PromptInputActionMenuItem>
            </PromptInputActionMenuContent>
          </PromptInputActionMenu>
        </PromptInputTools>

        {/* Right side: Autopilot toggle + Submit */}
        <div className="flex items-center gap-4">
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
          <PromptInputSubmit status={status} onStop={onStop} />
        </div>
      </PromptInputFooter>
    </PromptInput>
  )
}

// ─── Message List ────────────────────────────────────────────────────

function MessageList({
  messages,
  status,
  toolResults,
}: {
  messages: UIMessage[]
  status: ChatStatus
  toolResults?: Map<string, Record<string, unknown>>
}) {
  // Filter out auto-advance user messages (hidden from UI)
  const visibleMessages = messages.filter((msg) => {
    if (msg.role !== "user") return true
    const text = getMessageText(msg)
    return !text.startsWith(AUTO_ADVANCE_PREFIX)
  })

  const isStreaming = status === "streaming" || status === "submitted"
  const lastMsg = visibleMessages[visibleMessages.length - 1]

  // Show thinking indicator when waiting for response or response is starting.
  // Check against the ORIGINAL messages (including hidden auto-advance) so the
  // thinking shimmer shows during auto-advance steps too.
  const realLastMsg = messages[messages.length - 1]
  const lastAssistantText =
    realLastMsg?.role === "assistant"
      ? realLastMsg.parts
          .filter((p): p is { type: "text"; text: string } => p.type === "text")
          .map((p) => p.text)
          .join("")
      : ""
  const lastAssistantHasReasoning =
    realLastMsg?.role === "assistant" &&
    realLastMsg.parts.some((p) => p.type === "reasoning")

  // Check if tool calls are still executing (parts exist but results not yet in map)
  const hasUnresolvedTools =
    isStreaming &&
    realLastMsg?.role === "assistant" &&
    realLastMsg.parts.some(
      (p) =>
        typeof p.type === "string" &&
        p.type.startsWith("tool-") &&
        !(toolResults?.has((p as unknown as { toolCallId: string }).toolCallId))
    )

  const isThinking =
    (status === "submitted" && realLastMsg?.role === "user") ||
    (status === "streaming" && realLastMsg?.role === "assistant" && !lastAssistantText && !lastAssistantHasReasoning) ||
    hasUnresolvedTools

  return (
    <>
      {visibleMessages.map((msg) => {
        const isLastAssistant =
          msg === lastMsg && msg.role === "assistant" && isStreaming

        // Extract reasoning parts for chain-of-thought display
        const reasoningParts = msg.parts.filter(
          (p) => p.type === "reasoning"
        ) as Array<{ type: "reasoning"; text: string }>
        const reasoningText = reasoningParts.map((p) => p.text).join("")
        const hasReasoning = reasoningText.length > 0

        return (
          <Message from={msg.role} key={msg.id}>
            <MessageContent>
              {hasReasoning && (
                <Reasoning isStreaming={isLastAssistant} defaultOpen={isLastAssistant}>
                  <ReasoningTrigger />
                  <ReasoningContent>{reasoningText}</ReasoningContent>
                </Reasoning>
              )}
              {msg.parts.map((part, i) => {
                if (part.type === "text") {
                  return (
                    <MessageResponse key={i} isAnimating={isLastAssistant}>
                      {part.text}
                    </MessageResponse>
                  )
                }
                // Tool result cards — render for tool-invocation parts
                if (typeof part.type === "string" && part.type.startsWith("tool-")) {
                  const toolName = part.type.replace(/^tool-/, "")
                  // Skip searchNews — handled by Reasoning block
                  if (toolName === "searchNews") return null
                  const toolPart = part as unknown as {
                    toolCallId: string
                    input: Record<string, unknown>
                    state: string
                  }
                  // Only render when input is available (not during streaming)
                  if (toolPart.state === "input-streaming") return null
                  const result = toolResults?.get(toolPart.toolCallId)
                  return (
                    <ToolResultCard
                      key={i}
                      toolName={toolName}
                      input={toolPart.input ?? {}}
                      result={result}
                    />
                  )
                }
                return null
              })}
            </MessageContent>
          </Message>
        )
      })}

      {/* Thinking indicator — Reasoning component with shimmer animation */}
      {isThinking && (
        <Message from="assistant">
          <MessageContent>
            <Reasoning isStreaming>
              <ReasoningTrigger>
                <BrainIcon className="size-4" />
                <Shimmer duration={1}>Thinking...</Shimmer>
              </ReasoningTrigger>
            </Reasoning>
          </MessageContent>
        </Message>
      )}
    </>
  )
}

// ─── Main Component ──────────────────────────────────────────────────

export function KorraChat({ variant, chat, onFirstMessage, toolResults, showAuditTrail, onShowAuditTrailChange }: KorraChatProps) {
  const { messages, status, sendMessage, stop } = chat
  const hasCalledFirstMessage = useRef(false)

  const handleSend = (text: string) => {
    if (!hasCalledFirstMessage.current && onFirstMessage) {
      hasCalledFirstMessage.current = true
      onFirstMessage()
    }
    sendMessage({ text })
  }

  const hasMessages = messages.length > 0

  // Derive current demo step from assistant message count
  const assistantCount = messages.filter((m) => m.role === "assistant").length
  const stepIndex = Math.max(0, assistantCount - 1)
  const contextTags = variant === "panel" ? getAccumulatedTags(stepIndex) : []

  // ─── Panel variant ───────────────────────────────────────────────
  if (variant === "panel") {
    return (
      <div className="flex h-full flex-col border-l border-border/40">
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-border/40 px-4 py-2">
          {/* Left: Audit trail toggle */}
          <div className="flex items-center gap-1.5">
            <Switch
              id="audit-trail"
              checked={showAuditTrail ?? true}
              onCheckedChange={onShowAuditTrailChange}
              className="h-4 w-7 data-[state=checked]:bg-sky-600 [&_span]:size-3 [&_span]:data-[state=checked]:translate-x-3"
            />
            <Label
              htmlFor="audit-trail"
              className="cursor-pointer text-xs text-muted-foreground select-none"
            >
              Audit Trail
            </Label>
          </div>
          {/* Right: Korra avatar + name */}
          <div className="flex items-center gap-2">
            <Avatar className="size-7">
              <AvatarFallback className="bg-sky-100 text-xs font-semibold text-sky-700 dark:bg-sky-900 dark:text-sky-300">
                KO
              </AvatarFallback>
            </Avatar>
            <span className="flex h-9 items-center text-sm font-medium">Korra</span>
          </div>
        </div>

        {/* Messages — Conversation provides auto-scroll via use-stick-to-bottom */}
        <Conversation className="flex-1">
          <ConversationContent className="gap-4 px-4 py-3">
            {hasMessages ? (
              <MessageList messages={messages} status={status} toolResults={toolResults} />
            ) : (
              <ConversationEmptyState
                title="Ask Korra to help with your data"
                description=""
              />
            )}
          </ConversationContent>
          <ConversationScrollButton />
        </Conversation>

        {/* Input */}
        <div className="shrink-0 p-4 pt-2">
          <KorraPromptInput
            onSend={handleSend}
            onStop={stop}
            status={status}
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
        <div className="max-h-64 space-y-4 overflow-y-auto rounded-xl border border-border/30 p-4">
          <MessageList messages={messages} status={status} toolResults={toolResults} />
        </div>
      )}

      {/* Input */}
      <KorraPromptInput
        onSend={handleSend}
        onStop={stop}
        status={status}
        variant="home"
      />
    </div>
  )
}
