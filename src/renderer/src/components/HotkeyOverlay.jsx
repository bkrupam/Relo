import { useState, useRef, useEffect, useCallback } from 'react'
import { T, formatTime, formatDate } from '../tokens'
import { SF } from './icons/SF'
import { Kbd } from './Primitives'
import { simulateParse } from '../utils/parser'

const DEBOUNCE_MS = 500

export function HotkeyOverlay({ state, dispatch }) {
  const [text, setText]     = useState('')
  const [parsed, setParsed] = useState(null)
  const [reading, setReading] = useState(false)
  const timerRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    requestAnimationFrame(() => inputRef.current?.focus())
  }, [])

  const handleChange = useCallback((e) => {
    const val = e.target.value
    setText(val)
    setParsed(null)
    clearTimeout(timerRef.current)

    if (!val.trim() || val.trim().length < 4) { setReading(false); return }

    setReading(true)
    timerRef.current = setTimeout(() => {
      setParsed(simulateParse(val))
      setReading(false)
    }, DEBOUNCE_MS)
  }, [])

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') { window.api.hideWindow(); return }
    if (e.key === 'Enter' && parsed && !parsed.ambiguous) {
      dispatch({ type: 'UPDATE_INPUT', text })
      dispatch({ type: 'PARSED', data: parsed })
      window.api.openPopover()
    }
  }

  useEffect(() => () => clearTimeout(timerRef.current), [])

  const ready = parsed && !parsed.ambiguous
  const showBar = reading || ready

  return (
    <div style={{
      width: '100%', height: '100%',
      background: 'linear-gradient(160deg, rgba(11,15,24,0.88) 0%, rgba(7,10,18,0.92) 100%)',
      border: `1px solid rgba(255,255,255,0.11)`,
      borderRadius: 16,
      boxShadow: [
        '0 0 0 0.5px rgba(0,0,0,0.85)',
        '0 32px 90px rgba(0,0,0,0.70)',
        '0 8px 28px rgba(0,0,0,0.50)',
        'inset 0 1px 0 rgba(255,255,255,0.08)',
      ].join(', '),
      display: 'flex', flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: T.font, color: T.text,
    }}>

      {/* ── Main input row ─────────────────────────────────────── */}
      <div style={{
        flex: 1,
        padding: '0 20px',
        display: 'flex', alignItems: 'center', gap: 14,
        minHeight: 0,
      }}>
        <SF n="bell" s={19} w={1.3} c={T.textMuted} style={{ flexShrink: 0 }} />

        {/* Text + highlight overlay wrapper */}
        <div style={{ flex: 1, position: 'relative', height: 24, minWidth: 0 }}>

          {/* Highlight layer — visible only when parsed */}
          {ready && (
            <div aria-hidden style={{
              position: 'absolute', inset: 0,
              display: 'flex', alignItems: 'center',
              pointerEvents: 'none',
              fontSize: 17, letterSpacing: '-0.012em',
              fontFamily: T.font, fontWeight: 400,
              whiteSpace: 'pre', overflow: 'hidden',
              lineHeight: '24px',
            }}>
              <HighlightedText text={text} parsed={parsed} />
            </div>
          )}

          {/* Real input — transparent text when highlighted */}
          <input
            ref={inputRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder="What do you need to follow up on?"
            style={{
              position: 'absolute', inset: 0,
              background: 'transparent', border: 'none', outline: 'none',
              color: ready ? 'transparent' : T.text,
              caretColor: T.text,
              fontSize: 17, fontWeight: 400,
              letterSpacing: '-0.012em', fontFamily: T.font,
              width: '100%',
            }}
          />
        </div>

        {/* State indicator */}
        {reading && (
          <span
            style={{ width: 7, height: 7, borderRadius: 99, background: T.accent, flexShrink: 0 }}
            className="animate-pulse-dot"
          />
        )}
        {ready && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            flexShrink: 0,
          }}>
            <Kbd>↵</Kbd>
            <span style={{ fontSize: 11.5, color: T.textMuted }}>add</span>
          </div>
        )}
      </div>

      {/* ── Parsed entity bar ─────────────────────────────────── */}
      {showBar && (
        <div style={{
          borderTop: `1px solid rgba(255,255,255,0.07)`,
          padding: '0 20px',
          height: 44,
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(0,0,0,0.20)',
        }}>
          {reading ? (
            <span style={{ fontSize: 12, color: T.textMuted }}>Reading…</span>
          ) : (
            <>
              {parsed.when && (
                <EntityPill icon="clock" color="accent">
                  {formatDate(parsed.when)}, {formatTime(parsed.when)}
                </EntityPill>
              )}
              {parsed.source && (
                <EntityPill icon="link">{parsed.source}</EntityPill>
              )}
              {parsed.who && (
                <EntityPill icon="person">{parsed.who}</EntityPill>
              )}
              {parsed.ambiguous && (
                <span style={{ fontSize: 12, color: T.textMuted }}>
                  No time found — press ↵ to pick one
                </span>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

// ── Inline highlight renderer ─────────────────────────────────────────────────
function HighlightedText({ text, parsed }) {
  if (!text || !parsed) return <span style={{ color: T.text }}>{text}</span>

  const entities = []

  // Find each entity's position in the original text
  const tryAdd = (str, type) => {
    if (!str) return
    const idx = text.toLowerCase().indexOf(str.toLowerCase())
    if (idx === -1) return
    // Skip if overlapping an existing entity
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
  if (segments.length === 0) return <span style={{ color: T.text }}>{text}</span>

  const chipStyle = (type) => ({
    background: type === 'time' ? T.accentSoft : 'rgba(255,255,255,0.10)',
    borderRadius: 4,
    color: type === 'time' ? T.accentText : T.text,
    padding: '0 3px',
  })

  return (
    <>
      {segments.map((seg, i) =>
        seg.type
          ? <mark key={i} style={{ ...chipStyle(seg.type), fontStyle: 'normal' }}>{seg.text}</mark>
          : <span key={i} style={{ color: T.text }}>{seg.text}</span>
      )}
    </>
  )
}

// ── Small pill chip for the entity bar ───────────────────────────────────────
function EntityPill({ icon, children, color }) {
  const isAccent = color === 'accent'
  return (
    <div style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      height: 24, padding: '0 9px', borderRadius: 6,
      background: isAccent ? T.accentSoft : 'rgba(255,255,255,0.07)',
      border: `1px solid ${isAccent ? T.accentBorder : 'rgba(255,255,255,0.11)'}`,
      fontSize: 12, fontWeight: 500,
      color: isAccent ? T.accentText : T.textSoft,
    }}>
      <SF n={icon} s={11} w={1.5} c={isAccent ? T.accent : T.textMuted} />
      {children}
    </div>
  )
}
