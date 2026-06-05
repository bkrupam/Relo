import { useState, useRef, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { routeParseResult as routeToScreen } from '@/lib/parseRoute'
import { Icon, Kbd } from './Primitives'

const MIN_LEN = 6

function routeParseResult(dispatch, text, dataArr) {
  dispatch({ type: 'UPDATE_INPUT', text })
  routeToScreen(dispatch, dataArr)
  window.api.openPopover()
}

export function HotkeyOverlay({ state, dispatch }) {
  const [text, setText]         = useState('')
  const [parsedList, setParsedList] = useState(null)
  const [parsed, setParsed]     = useState(null)
  const [reading, setReading]   = useState(false)
  const [error, setError]       = useState(null)
  const inputRef = useRef(null)

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const handleChange = (e) => {
    setText(e.target.value)
    setParsed(null)
    setParsedList(null)
    setError(null)
  }

  const parseAndOpen = async () => {
    if (!text.trim() || text.trim().length < MIN_LEN || reading) return
    setReading(true)
    setError(null)
    setParsed(null)
    setParsedList(null)
    try {
      const results = await window.api.parseWithGemini(text)
      const list = Array.isArray(results) ? results : [results]
      setParsedList(list)
      setParsed(list[0] ?? null)
      routeParseResult(dispatch, text, list)
    } catch {
      setError('Parse failed')
    } finally {
      setReading(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { window.api.hideWindow(); return }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      parseAndOpen()
    }
  }

  const canParse = text.trim().length >= MIN_LEN
  const ready = parsed && !parsed.ambiguous
  const showBar = reading || !!error

  return (
    <div className={cn(
      'popover-shell w-full h-full flex flex-col overflow-hidden',
      'rounded-[var(--radius)] border border-border',
      'bg-background/90 backdrop-blur-2xl',
    )}>

      <div className="flex-1 px-5 flex items-center gap-3.5 min-h-0">
        <Icon n="bell" s={19} className="text-muted-foreground/50 shrink-0" />

        <div className="flex-1 relative h-6 min-w-0">
          {ready && (
            <div
              aria-hidden
              className="absolute inset-0 flex items-center pointer-events-none text-lg tracking-[-0.012em] whitespace-pre overflow-hidden leading-6"
            >
              <HighlightedText text={text} parsed={parsed} />
            </div>
          )}

          <input
            ref={inputRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="What do you need to follow up on?"
            className={cn(
              'absolute inset-0 w-full bg-transparent border-none outline-none',
              'text-lg tracking-[-0.012em] caret-foreground',
              ready ? 'text-transparent' : 'text-foreground',
            )}
          />
        </div>

        {reading && (
          <span className="size-[7px] rounded-full bg-ring shrink-0 animate-pulse-dot" />
        )}
        {canParse && !reading && (
          <div className="inline-flex items-center gap-1.5 shrink-0">
            <Kbd>↵</Kbd>
            <span className="text-xs text-muted-foreground/60">parse</span>
          </div>
        )}
      </div>

      {showBar && (
        <div className="border-t border-border px-5 h-11 flex items-center gap-2 bg-black/20">
          {reading ? (
            <span className="text-xs text-muted-foreground/60">Reading…</span>
          ) : error ? (
            <span className="text-xs text-destructive/80">{error}</span>
          ) : null}
        </div>
      )}
    </div>
  )
}

function HighlightedText({ text, parsed }) {
  if (!text || !parsed) return <span className="text-foreground">{text}</span>

  const entities = []
  const tryAdd = (str, type) => {
    if (!str || str.length < 3) return
    const idx = text.toLowerCase().indexOf(str.toLowerCase())
    if (idx === -1) return
    if (entities.some(e => idx < e.end && idx + str.length > e.start)) return
    entities.push({ start: idx, end: idx + str.length, type })
  }

  tryAdd(parsed.timeText, 'time')
  tryAdd(parsed.source,   'source')
  tryAdd(parsed.who,      'who')
  entities.sort((a, b) => a.start - b.start)

  const segments = []
  let pos = 0
  for (const e of entities) {
    if (e.start > pos) segments.push({ text: text.slice(pos, e.start), type: null })
    segments.push({ text: text.slice(e.start, e.end), type: e.type })
    pos = e.end
  }
  if (pos < text.length) segments.push({ text: text.slice(pos), type: null })
  if (segments.length === 0) return <span className="text-foreground">{text}</span>

  return (
    <>
      {segments.map((seg, i) =>
        seg.type ? (
          <mark
            key={i}
            className={cn(
              'rounded not-italic',
              seg.type === 'time'
                ? 'bg-accent text-accent-foreground px-0.5'
                : 'bg-secondary text-foreground px-0.5',
            )}
          >
            {seg.text}
          </mark>
        ) : (
          <span key={i} className="text-foreground">{seg.text}</span>
        )
      )}
    </>
  )
}
