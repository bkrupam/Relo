const GEMINI_URL =
  'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent'

const SYSTEM_PROMPT = (today) => `Extract one or more reminders from the input text and return a JSON array only.

Today is ${today}. Assume current year.
- If the input contains multiple people or times ("Reply to Priya at 6pm and Roman at 10pm"), split into separate reminder objects.
- If a time is vague (e.g. "end of day", "later", "soon"), set ambiguous: true and when: null.

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

export async function geminiParse(text) {
  const apiKey = import.meta.env.MAIN_VITE_GEMINI_API_KEY
  if (!apiKey) throw new Error('MAIN_VITE_GEMINI_API_KEY not set')

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  const body = JSON.stringify({
    contents: [{
      parts: [{ text: `${SYSTEM_PROMPT(today)}\n\nText: "${text}"` }]
    }],
    generationConfig: {
      temperature: 0.1,
      maxOutputTokens: 2048,
    },
  })

  const response = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`Gemini API error ${response.status}: ${err}`)
  }

  const json = await response.json()

  // Find the text part (skip thinking parts)
  const parts = json.candidates?.[0]?.content?.parts ?? []
  const textPart = parts.find(p => p.text && !p.thought)?.text
    ?? parts.find(p => p.text)?.text
    ?? ''

  // Extract JSON array (or fall back to object wrapped in array)
  const arrMatch = textPart.match(/\[[\s\S]*\]/)
  const objMatch = textPart.match(/\{[\s\S]*\}/)
  if (!arrMatch && !objMatch) {
    console.error('[gemini] raw response:', JSON.stringify(json, null, 2))
    throw new Error('No JSON in Gemini response')
  }

  const raw = arrMatch ? arrMatch[0] : `[${objMatch[0]}]`
  const items = JSON.parse(raw)
  const list = Array.isArray(items) ? items : [items]

  return list.map(parsed => ({
    what:      parsed.what      ?? null,
    who:       parsed.who       ?? null,
    when:      parsed.when      ?? null,
    timeText:  parsed.timeText  ?? null,
    source:    parsed.source    ?? null,
    ambiguous: parsed.ambiguous ?? true,
  }))
}
