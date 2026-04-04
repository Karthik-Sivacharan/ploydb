import { streamText } from "ai"
import { MockLanguageModelV3 } from "ai/test"
import { getNextDemoStep, getCurrentStep } from "@/data/demo-scripts"
import { korraTools } from "@/lib/ai-tools"

export async function POST() {
  const stepIndex = getCurrentStep()
  const step = getNextDemoStep()
  const text = step.response
  const toolCalls = step.toolCalls ?? []

  const textId = "text-0"

  const model = new MockLanguageModelV3({
    doStream: async () => ({
      stream: new ReadableStream({
        start(controller) {
          // ─── Stream start ──────────────────────────────────────
          controller.enqueue({
            type: "stream-start" as const,
            warnings: [],
          })

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
