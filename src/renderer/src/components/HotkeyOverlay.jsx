import { useState, useRef, useEffect, useCallback } from 'react'
import { formatTime, formatDate } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Icon, Kbd } from './Primitives'

const DEBOUNCE_MS = 500
const MIN_LEN = 6

export function HotkeyOverlay({ state, dispatch }) {
  const [text, setText]       = useState('')
  const [parsed, setParsed]   = useState(null)  // first item from Gemini array
  const [reading, setReading] = useState(false)
  const [error, setError]     = useState(null)
  const timerRef  = useRef(null)
  const inputRef  = useRef(null)
  const latestRef = useRef('')

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const handleChange = useCallback((e) => {
    const val = e.target.value
    setText(val)
    latestRef.current = val
    setParsed(null)
    setError(null)
    clearTimeout(timerRef.current)

    if (!val.trim() || val.trim().length < MIN_LEN) { setReading(false); return }

    setReading(true)
    timerRef.current = setTimeout(async () => {
      if (latestRef.current !== val) return
      try {
        const results = await window.api.parseWithGemini(val)
        if (latestRef.current !== val) return
        // results is always an array; take the first item for the overlay preview
        const first = Array.isArray(results) ? results[0] : results
        setParsed(first ?? null)
      } catch (err) {
        if (latestRef.current !== val) return
        setError('Parse failed')
      } finally {
        if (latestRef.current === val) setReading(false)
      }
    }, DEBOUNCE_MS)
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { window.api.hideWindow(); return }
    if (e.key === 'Enter' && parsed && !parsed.ambiguous) {
      dispatch({ type: 'UPDATE_INPUT', text })
      dispatch({ type: 'PARSED', data: [parsed] })
      window.api.openPopover()
    }
    if (e.key === 'Enter' && parsed && parsed.ambiguous) {
      dispatch({ type: 'UPDATE_INPUT', text })
      dispatch({ type: 'AMBIGUOUS', data: [parsed] })
      window.api.openPopover()
    }
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const ready   = parsed && !parsed.ambiguous
  const showBar = reading || !!parsed || !!error

  return (
    <div className={cn(
      'w-full h-full flex flex-col overflow-hidden',
      'rounded-[var(--radius)] border border-border',
      'bg-background/90 backdrop-blur-2xl',
      'shadow-[0_0_0_0.5px_oklch(0_0_0/85%),0_32px_90px_oklch(0_0_0/70%),0_8px_28px_oklch(0_0_0/50%),inset_0_1px_0_oklch(1_0_0/8%)]',
    )}>

      {/* ── Main input row ─────────────────────────────────────── */}
      <div className="flex-1 px-5 flex items-center gap-3.5 min-h-0">
        <Icon n="bell" s={19} className="text-muted-foreground/50 shrink-0" />

        <div className="flex-1 relative h-6 min-w-0">
          {/* Highlight layer */}
          {ready && (
            <div
              aria-hidden
              className="absolute inset-0 flex items-center pointer-events-none text-lg tracking-[-0.012em] whitespace-pre overflow-hidden leading-6"
            >
              <HighlightedText text={text} parsed={parsed} />
            </div>
          )}

          {/* Real input */}
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
        {parsed && !reading && (
          <div className="inline-flex items-center gap-1.5 shrink-0">
            <Kbd>↵</Kbd>
            <span className="text-xs text-muted-foreground/60">
              {parsed.ambiguous ? 'pick time' : 'add'}
            </span>
          </div>
        )}
      </div>

      {/* ── Parsed entity bar ─────────────────────────────────── */}
      {showBar && (
        <div className="border-t border-border px-5 h-11 flex items-center gap-2 bg-black/20">
          {reading ? (
            <span className="text-xs text-muted-foreground/60">Reading…</span>
          ) : error ? (
            <span className="text-xs text-destructive/80">{error}</span>
          ) : parsed ? (
            <>
              {parsed.when && (
                <EntityPill icon="clock" accent>
                  {formatDate(parsed.when)}, {formatTime(parsed.when)}
                </EntityPill>
              )}
              {parsed.source && <EntityPill icon="link">{parsed.source}</EntityPill>}
              {parsed.who    && <EntityPill icon="person">{parsed.who}</EntityPill>}
              {parsed.ambiguous && (
                <span className="text-xs text-muted-foreground/60">
                  No time — press ↵ to pick one
                </span>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}

// ── Inline highlight renderer ─────────────────────────────────────────────────
function HighlightedText({ text, parsed }) {
  if (!text || !parsed) return <span className="text-foreground">{text}</span>

  const entities = []
  const tryAdd = (str, type) => {
    if (!str) return
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

// ── Entity pill ───────────────────────────────────────────────────────────────
function EntityPill({ icon, children, accent = false }) {
  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 h-6 px-[9px] rounded-md',
      'border text-xs font-medium',
      accent
        ? 'bg-accent border-ring/30 text-accent-foreground'
        : 'bg-secondary border-border text-muted-foreground',
    )}>
      <Icon
        n={icon}
        s={11}
        className={accent ? 'text-ring' : 'text-muted-foreground/60'}
      />
      {children}
    </div>
  )
}
