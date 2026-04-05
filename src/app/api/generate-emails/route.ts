import { generateText } from "ai"
import { anthropic } from "@ai-sdk/anthropic"

interface ContactInfo {
  rowIndex: number
  name: string
  company: string
  title: string
  industry: string
  daysSinceContact: number
}

export async function POST(req: Request) {
  const { contacts } = (await req.json()) as { contacts: ContactInfo[] }

  if (!contacts?.length) {
    return Response.json({ updates: [] })
  }

  // Build a batch prompt — one call for all contacts
  const contactList = contacts
    .map(
      (c, i) =>
        `${i + 1}. Name: ${c.name}, Company: ${c.company}, Title: ${c.title}, Industry: ${c.industry}, Days since last contact: ${c.daysSinceContact}`
    )
    .join("\n")

  try {
    const { text } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      prompt: `Write short, personalized follow-up emails for each of these contacts. Each email should:
- Be 2-3 sentences max
- Address them by first name
- Reference their company and how long it's been
- Feel warm and natural, not salesy
- End with a soft ask for a 15-minute call

Contacts:
${contactList}

Respond with ONLY a JSON array of strings, one email per contact, in the same order. No markdown, no code blocks, just the raw JSON array.`,
      maxOutputTokens: 4000,
    })

    // Parse the response
    let emails: string[]
    try {
      emails = JSON.parse(text)
    } catch {
      // Fallback: try to extract JSON from the response
      const match = text.match(/\[[\s\S]*\]/)
      emails = match ? JSON.parse(match[0]) : []
    }

    // Map back to cell updates
    const updates = contacts.map((c, i) => ({
      rowIndex: c.rowIndex,
      columnId: "fld_followup_draft",
      value: emails[i] ?? `Hi ${c.name} — it's been ${c.daysSinceContact} days since we last connected. Would love to catch up. Free for a quick call?`,
    }))

    return Response.json({ updates })
  } catch (err) {
    console.error("[generate-emails] API error:", err)
    // Return template fallbacks so the UI still works
    const updates = contacts.map((c) => ({
      rowIndex: c.rowIndex,
      columnId: "fld_followup_draft",
      value: `Hi ${c.name} — it's been ${c.daysSinceContact} days since we last connected at ${c.company}. Would love to catch up — free for a quick call?`,
    }))
    return Response.json({ updates })
  }
}
