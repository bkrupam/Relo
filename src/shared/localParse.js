import { MAX_PARSE_CHARS, MAX_PARSED_ITEMS } from './limits.js'

// Local fallback when Gemini is unavailable — also used for offline / no-key dev.

const SOURCES = ['Slack', 'Gmail', 'Linear', 'Notion', 'GitHub', 'Teams', 'Email', 'Zoom']

function toISO(h, m, ampm, dayOffset = 0) {
  let hours = parseInt(h)
  const mins = parseInt(m ?? 0)
  if (ampm?.toLowerCase() === 'pm' && hours !== 12) hours += 12
  if (ampm?.toLowerCase() === 'am' && hours === 12) hours = 0
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset, hours, mins).toISOString()
}

const TIME_PATTERNS = [
  { re: /\bat\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)/i,  fn: (m, d) => toISO(m[1], m[2], m[3], d) },
  { re: /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/i,     fn: (m, d) => toISO(m[1], m[2], m[3], d) },
  { re: /\bnoon\b/i,       fn: (_, d) => toISO(12, 0, 'pm', d) },
  { re: /\bmidnight\b/i,   fn: (_, d) => toISO(12, 0, 'am', d) },
  { re: /\bmorning\b/i,    fn: (_, d) => toISO(9,  0, null,  d) },
  { re: /\bafternoon\b/i,  fn: (_, d) => toISO(14, 0, null,  d) },
  { re: /\bevening\b/i,    fn: (_, d) => toISO(18, 0, null,  d) },
  { re: /\btonight\b/i,    fn: (_, d) => toISO(19, 0, null,  d) },
  { re: /\b(end of (?:the )?day|eod)\b/i, fn: (_, d) => toISO(17, 0, null, d) },
]

function extractWhen(text, dayOffset) {
  for (const { re, fn } of TIME_PATTERNS) {
    const m = text.match(re)
    if (m) return { iso: fn(m, dayOffset), match: m[0] }
  }
  return { iso: null, match: null }
}

function extractWho(text) {
  const m = text.match(/\b(?:to|with|for)\s+([A-Z][a-z]+)/i)
  return m ? m[1] : null
}

function extractSource(text) {
  return SOURCES.find(s => text.toLowerCase().includes(s.toLowerCase())) ?? null
}

function buildTitle(text) {
  let t = text
  for (const s of SOURCES) {
    t = t.replace(new RegExp(`\\b(on|via|in|through)\\s+${s}\\b`, 'gi'), '')
  }
  return t.replace(/\s+/g, ' ').trim().slice(0, 60)
}

export function parseLocally(fullText) {
  const trimmed = String(fullText ?? '').slice(0, MAX_PARSE_CHARS)
  const parts = trimmed.split(/\b(?:and|&)\b/i).map(s => s.trim()).filter(Boolean).slice(0, MAX_PARSED_ITEMS)

  return parts.map(text => {
    const dayOffset = /\btomorrow\b/i.test(text) ? 1 : 0
    const { iso: when, match: timeText } = extractWhen(text, dayOffset)
    const who    = extractWho(text)
    const source = extractSource(text)
    const what   = buildTitle(text)

    return {
      what,
      who,
      when,
      source,
      timeText,
      dayOffset,
      ambiguous: when === null,
      originalText: text,
    }
  })
}
