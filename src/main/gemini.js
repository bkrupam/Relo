import { MAX_PARSE_CHARS, MAX_PARSED_ITEMS } from '@shared/limits'
import { extractJsonPayload } from '@shared/extractJson'

const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const SYSTEM_PROMPT = (today) => `Extract one or more reminders from the input text and return a JSON array only.

Today is ${today}. Assume current year.
- If a time is vague (e.g. "end of day", "later", "soon"), set ambiguous: true and when: null.
- If the input contains multiple people or times ("Reply to Priya at 6pm and Roman at 10pm"), split into separate reminder objects.
- Input may be truncated; extract at most ${MAX_PARSED_ITEMS} reminders.

Return exactly this shape — a JSON array, no markdown, no explanation:
[
  {
    "what": "short task title (max 60 chars)",
    "who": "person name or null",
    "when": "ISO 8601 datetime or null if ambiguous/missing",
    "timeText": "exact time phrase from input (e.g. 'at 6 pm', '10 pm') or null",
    "source": "Slack | Gmail | Linear | Notion | GitHub | other label | null",
    "ambiguous": true or false
  }
]`

function normalizeItems(list) {
  return list.slice(0, MAX_PARSED_ITEMS).map(parsed => ({
    what:      parsed.what      ?? null,
    who:       parsed.who       ?? null,
    when:      parsed.when      ?? null,
    timeText:  parsed.timeText  ?? null,
    source:    parsed.source    ?? null,
    ambiguous: parsed.ambiguous ?? true,
  }))
}

export async function geminiParse(text) {
  const apiKey = import.meta.env.MAIN_VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('MAIN_VITE_GEMINI_API_KEY not set')

  const input = String(text ?? '').slice(0, MAX_PARSE_CHARS)

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const body = JSON.stringify({
    contents: [{
      parts: [{ text: `${SYSTEM_PROMPT(today)}\n\nText: "${input.replace(/"/g, '\\"')}"` }]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 1024,
    },
  })

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${err.slice(0, 400)}`)
  }

  const json = await response.json()

  const parts = json.candidates?.[0]?.content?.parts ?? []
  const textPart = parts.find(p => p.text && !p.thought)?.text
    ?? parts.find(p => p.text)?.text
    ?? ''

  const raw = extractJsonPayload(textPart)
  if (!raw) {
    console.error('[gemini] no JSON in response (first 500 chars):', textPart.slice(0, 500))
    throw new Error('No JSON in Gemini response')
  }

  let items
  try {
    items = JSON.parse(raw)
  } catch (parseErr) {
    console.error('[gemini] JSON.parse failed:', parseErr.message)
    throw new Error('Invalid JSON in Gemini response')
  }

  const list = Array.isArray(items) ? items : [items]
  return normalizeItems(list)
}
