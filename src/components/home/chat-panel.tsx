"use client"

import {
  Database,
  Sparkles,
  Users,
  HandshakeIcon,
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

interface ChatPanelProps {
  onSubmit: (message: { text: string }) => void
}

export function ChatPanel({ onSubmit }: ChatPanelProps) {
  return (
    <div className="flex h-full flex-col border-l border-border/40">
      {/* Header */}
      <div className="flex h-12 shrink-0 items-center border-b border-border/40 px-4">
        <span className="text-sm font-medium">Korra</span>
      </div>

      {/* Messages area — empty for now, Phase 3 will add useChat messages */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex h-full items-center justify-center">
          <p className="text-sm text-muted-foreground">
            Ask Korra to help with your data
          </p>
        </div>
      </div>

      {/* Input at bottom */}
      <div className="shrink-0 p-4 pt-0">
        <PromptInput
          onSubmit={onSubmit}
          className="[&_[data-slot=input-group]]:rounded-xl [&_[data-slot=input-group]]:border-border/50"
        >
          <PromptInputTextarea placeholder="Ask Korra..." className="min-h-16" />
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
      </div>
    </div>
  )
}
