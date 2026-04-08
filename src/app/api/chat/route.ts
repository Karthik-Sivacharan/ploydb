import { streamText } from "ai"
import { MockLanguageModelV3 } from "ai/test"
import { DEMO_STEPS } from "@/data/demo-scripts"
import { korraTools } from "@/lib/ai-tools"

export async function POST(req: Request) {
  const body = await req.json()

  // Client sends messages array — count assistant messages to determine step
  const messages = body.messages ?? []
  const stepIndex = messages.filter((m: { role: string }) => m.role === "assistant").length

  const step = DEMO_STEPS[stepIndex] ?? DEMO_STEPS[DEMO_STEPS.length - 1]
  const text = step.response
  const toolCalls = step.toolCalls ?? []
  const thinkingDelay = step.thinkingDelay ?? 800
  const reasoning = step.reasoning ?? null
  const followUp = step.followUp ?? null

  const textId = "text-0"
  const reasoningId = "reasoning-0"

  const model = new MockLanguageModelV3({
    doStream: async () => ({
      stream: new ReadableStream({
        async start(controller) {
          // ─── Stream start ──────────────────────────────────────
          controller.enqueue({
            type: "stream-start" as const,
            warnings: [],
          })

          // Thinking delay — shows the "Thinking..." shimmer in the UI.
          // Longer delays make it feel like Korra is analyzing data.
          await new Promise((r) => setTimeout(r, thinkingDelay))

          // ─── Reasoning / chain of thought (optional) ───────────
          // Streamed line by line with delays to simulate research.
          if (reasoning) {
            controller.enqueue({
              type: "reasoning-start" as const,
              id: reasoningId,
            })
            const lines = reasoning.split("\n")
            for (const line of lines) {
              controller.enqueue({
                type: "reasoning-delta" as const,
                id: reasoningId,
                delta: line + "\n",
              })
              // Stagger each line — feels like Korra is working through sources
              await new Promise((r) => setTimeout(r, 300))
            }
            controller.enqueue({
              type: "reasoning-end" as const,
              id: reasoningId,
            })
          }

          // ─── Text content ──────────────────────────────────────
          controller.enqueue({
            type: "text-start" as const,
            id: textId,
          })
          for (let i = 0; i < text.length; i++) {
            controller.enqueue({
              type: "text-delta" as const,
              id: textId,
              delta: text[i],
            })
          }
          controller.enqueue({
            type: "text-end" as const,
            id: textId,
          })

          // ─── Tool calls ────────────────────────────────────────
          for (let t = 0; t < toolCalls.length; t++) {
            const tc = toolCalls[t]
            const toolCallId = `call-${stepIndex}-${t}`

            // Stream tool input progressively
            controller.enqueue({
              type: "tool-input-start" as const,
              id: toolCallId,
              toolName: tc.name,
            })
            controller.enqueue({
              type: "tool-input-delta" as const,
              id: toolCallId,
              delta: JSON.stringify(tc.args),
            })
            controller.enqueue({
              type: "tool-input-end" as const,
              id: toolCallId,
            })
            // Emit tool-call so streamText → toUIMessageStream produces
            // a tool-input-available event, which triggers onToolCall
            controller.enqueue({
              type: "tool-call" as const,
              toolCallId,
              toolName: tc.name,
              input: JSON.stringify(tc.args),
            })
          }

          // ─── Follow-up text (after tool cards) ─────────────────
          if (followUp) {
            const followUpId = "text-1"
            controller.enqueue({ type: "text-start" as const, id: followUpId })
            for (let i = 0; i < followUp.length; i++) {
              controller.enqueue({
                type: "text-delta" as const,
                id: followUpId,
                delta: followUp[i],
              })
            }
            controller.enqueue({ type: "text-end" as const, id: followUpId })
          }

          // ─── Finish ────────────────────────────────────────────
          const finishReason = toolCalls.length > 0 ? "tool-calls" : "stop"
          controller.enqueue({
            type: "finish" as const,
            finishReason: {
              unified: finishReason as "stop" | "tool-calls",
              raw: undefined,
            },
            usage: {
              inputTokens: {
                total: 10,
                noCache: undefined,
                cacheRead: undefined,
                cacheWrite: undefined,
              },
              outputTokens: {
                total: text.length,
                text: undefined,
                reasoning: undefined,
              },
            },
          })
          controller.close()
        },
      }),
    }),
  })

  const result = streamText({
    model,
    tools: korraTools,
    messages: [{ role: "user", content: "hello" }],
  })

  return result.toUIMessageStreamResponse()
}
