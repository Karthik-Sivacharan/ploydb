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

  const textId = "text-0"

  const model = new MockLanguageModelV3({
    doStream: async () => ({
      stream: new ReadableStream({
        async start(controller) {
          // ─── Stream start ──────────────────────────────────────
          controller.enqueue({
            type: "stream-start" as const,
            warnings: [],
          })

          // Brief pause so the "Thinking..." shimmer is visible
          await new Promise((r) => setTimeout(r, 800))

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
