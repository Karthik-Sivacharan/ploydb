import { streamText } from "ai"
import { MockLanguageModelV3 } from "ai/test"
import { korraTools } from "@/lib/ai-tools"

const SCRIPTED_RESPONSES = [
  "I see your CRM data. Let me take a look at what we're working with — 150 contacts across various stages. What would you like me to help with?",
  "Got it! I'll filter down to the most relevant records and analyze them for you. Give me a moment...",
  "Here's what I found: there are several contacts that could use attention. I can prioritize them by engagement level, deal size, or last contact date. Which approach works best?",
  "Done! I've organized everything based on your criteria. You can see the updated view in the table. Let me know if you want to drill deeper into any segment.",
  "Great question. Let me cross-reference that with your pipeline data and get back to you with a recommendation.",
]

let responseIndex = 0

export async function POST() {
  const text = SCRIPTED_RESPONSES[responseIndex % SCRIPTED_RESPONSES.length]
  responseIndex++

  const textId = "text-0"

  const model = new MockLanguageModelV3({
    doStream: async () => ({
      stream: new ReadableStream({
        start(controller) {
          controller.enqueue({
            type: "stream-start" as const,
            warnings: [],
          })
          controller.enqueue({
            type: "text-start" as const,
            id: textId,
          })
          // Stream text character by character for realistic typing effect
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
          controller.enqueue({
            type: "finish" as const,
            finishReason: { unified: "stop", raw: undefined },
            usage: {
              inputTokens: { total: 10, noCache: undefined, cacheRead: undefined, cacheWrite: undefined },
              outputTokens: { total: text.length, text: undefined, reasoning: undefined },
            },
          })
          controller.close()
        },
      }),
    }),
  })

  const result = streamText({
    model,
    messages: [{ role: "user", content: "hello" }],
    tools: korraTools,
  })

  return result.toUIMessageStreamResponse()
}
