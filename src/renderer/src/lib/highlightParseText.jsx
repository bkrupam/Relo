import { SubtleChip } from '@/components/Primitives'
import {
  MAX_HIGHLIGHT_INPUT_CHARS,
  MIN_HIGHLIGHT_CHARS,
} from '@shared/limits'

const MAX_SEGMENTS = 64

/**
 * Inline chips for parsed entities. Skips regex when input is long or tokens are
 * too short — otherwise a single-letter "who" can match hundreds of times and freeze the UI.
 */
export function highlightParseText(text, dataArray) {
  if (!text || !dataArray?.length) return null

  if (text.length > MAX_HIGHLIGHT_INPUT_CHARS) {
    return <span className="text-sm leading-snug text-foreground line-clamp-4">{text}</span>
  }

  const phraseMap = new Map()
  for (const d of dataArray) {
    if (d.timeText?.length >= MIN_HIGHLIGHT_CHARS) {
      phraseMap.set(d.timeText.toLowerCase(), 'when')
    }
    if (d.who?.length >= MIN_HIGHLIGHT_CHARS) {
      phraseMap.set(d.who.toLowerCase(), 'who')
    }
    if (d.source?.length >= MIN_HIGHLIGHT_CHARS) {
      phraseMap.set(d.source.toLowerCase(), 'source')
    }
  }

  if (phraseMap.size === 0) {
    return <span className="text-sm leading-snug text-foreground">{text}</span>
  }

  const phrases = [...phraseMap.keys()].sort((a, b) => b.length - a.length)
  const pattern = phrases.map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const re = new RegExp(`(${pattern})`, 'gi')
  const parts = text.split(re).filter((p, i, arr) => p !== '' || i < arr.length - 1)

  if (parts.length > MAX_SEGMENTS) {
    return <span className="text-sm leading-snug text-foreground">{text}</span>
  }

  return (
    <span className="text-sm leading-snug text-foreground">
      {parts.map((part, i) => {
        const variant = phraseMap.get(part.toLowerCase())
        return variant
          ? <SubtleChip key={i} variant={variant}>{part}</SubtleChip>
          : part
      })}
    </span>
  )
}
