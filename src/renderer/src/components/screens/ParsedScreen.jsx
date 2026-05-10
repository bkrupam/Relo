import { useState, useEffect } from 'react'
import { T, formatDate, formatTime } from '../../tokens'
import { SF } from '../icons/SF'
import { Pop, PopHead, Field, SendBtn, FootBar, Kbd, SubtleChip } from '../Primitives'

const TIME_PRESETS = [
  { label: '8 AM',  h: 8  },
  { label: '9 AM',  h: 9  },
  { label: '12 PM', h: 12 },
  { label: '2 PM',  h: 14 },
  { label: '5 PM',  h: 17 },
  { label: '6 PM',  h: 18 },
]

function buildISO(h, m = 0) {
  const dt = new Date()
  dt.setHours(h, m, 0, 0)
  return dt.toISOString()
}

export function ParsedScreen({ state, dispatch }) {
  const { parsedData, inputText } = state
  if (!parsedData || !Array.isArray(parsedData) || parsedData.length === 0) return null

  // Per-row time overrides — starts with whatever the parser found (may be null)
  const [rowTimes, setRowTimes] = useState(() => parsedData.map(d => d.when))

  const setTimeForRow = (index, isoTime) => {
    setRowTimes(prev => {
      const next = [...prev]
      next[index] = isoTime
      return next
    })
  }

  // All rows must have a time before "Add all" is enabled
  const allTimesSet = rowTimes.every(t => !!t)
  const hasMultiple = parsedData.length > 1

  const mergedItems = parsedData.map((d, i) => ({ ...d, when: rowTimes[i] }))

  const handleSubmitAll = () => {
    if (!allTimesSet) return
    dispatch({ type: 'PARSED', data: mergedItems })
    setTimeout(() => dispatch({ type: 'SUBMIT' }), 0)
  }

  const handleAddSingle = (index) => {
    if (!rowTimes[index]) return
    const item = mergedItems[index]
    dispatch({ type: 'PARSED', data: [item] })
    setTimeout(() => dispatch({ type: 'SUBMIT' }), 0)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); dispatch({ type: 'RESET' }) }
      if (e.key === 'Enter' && !e.shiftKey && allTimesSet) { e.preventDefault(); handleSubmitAll() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch, allTimesSet, rowTimes])

  return (
    <Pop>
      <PopHead onSettings={() => dispatch({ type: 'SET_SCREEN', screen: 'settings' })} />

      {/* Input field — click to go back and edit */}
      <Field focused={false} onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'typing' })}>
        <ParsedText text={inputText} dataArray={parsedData} />
        <SendBtn state={allTimesSet ? 'ready' : 'disabled'} onClick={handleSubmitAll} />
      </Field>

      {/* Parsed events list */}
      <div style={{ padding: '4px 8px', flex: 1, overflowY: 'auto' }} className="animate-fade-in">
        {parsedData.map((data, index) => {
          const hasTime = !!rowTimes[index]
          const title = data.what || (parsedData.length === 1 ? inputText : data.originalText)
          const when = rowTimes[index]
            ? `${formatDate(rowTimes[index])}, ${formatTime(rowTimes[index])}`
            : null

          return (
            <ParsedRowWithPicker
              key={index}
              title={title}
              when={when}
              ctx={data.source}
              hasTime={hasTime}
              onTimeSet={(iso) => setTimeForRow(index, iso)}
              onAdd={() => handleAddSingle(index)}
            />
          )
        })}
      </div>

      {/* Prominent "Add all" CTA — only for 2+ items */}
      {hasMultiple && (
        <div style={{ padding: '8px 12px 12px' }}>
          <button
            onClick={handleSubmitAll}
            disabled={!allTimesSet}
            style={{
              width: '100%',
              height: 38,
              borderRadius: T.radiusMd,
              background: allTimesSet ? T.accent : 'rgba(255,255,255,0.06)',
              border: `1px solid ${allTimesSet ? 'rgba(0,122,253,0.60)' : 'rgba(255,255,255,0.10)'}`,
              color: allTimesSet ? '#fff' : T.textMuted,
              fontSize: 13, fontWeight: 600,
              cursor: allTimesSet ? 'pointer' : 'default',
              fontFamily: T.font,
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
              outline: 'none',
              boxShadow: allTimesSet ? '0 2px 8px rgba(0,122,253,0.30)' : 'none',
            }}
          >
            <SF n="calendar.badge.plus" s={13} w={1.8} c={allTimesSet ? '#fff' : T.textMuted} />
            {allTimesSet ? 'Add all to Calendar' : 'Set all times to continue'}
          </button>
        </div>
      )}

      <FootBar
        left={<span style={{ color: T.textMuted, fontSize: 11.5 }}>esc to cancel</span>}
        right={<span style={{ fontSize: 11, color: T.textMuted, display: 'flex', alignItems: 'center', gap: 4 }}><Kbd>↵</Kbd> add</span>}
      />
    </Pop>
  )
}

// ── Row with optional inline time picker ─────────────────────────────────────
function ParsedRowWithPicker({ title, when, ctx, hasTime, onTimeSet, onAdd }) {
  const [pickerOpen, setPickerOpen] = useState(!hasTime) // auto-open if no time

  const pickPreset = (h) => {
    onTimeSet(buildISO(h))
    setPickerOpen(false)
  }

  const pickCustom = (val) => {
    if (!val) return
    const [h, m] = val.split(':').map(Number)
    onTimeSet(buildISO(h, m))
    setPickerOpen(false)
  }

  return (
    <div style={{
      borderRadius: T.radiusSm,
      marginBottom: 4,
      background: pickerOpen && !hasTime ? 'rgba(0,122,253,0.06)' : 'transparent',
      border: pickerOpen && !hasTime ? '1px solid rgba(0,122,253,0.15)' : '1px solid transparent',
      transition: 'all 200ms ease',
      overflow: 'hidden',
    }}>
      {/* Main row */}
      <div style={{
        display: 'flex', gap: 10, padding: '7px 8px',
        alignItems: 'center', cursor: 'default',
      }}>
        {/* Status dot */}
        <div style={{
          width: 14, height: 14, borderRadius: 99, flexShrink: 0,
          border: `1.5px solid ${hasTime ? T.accentBorder : 'rgba(255,255,255,0.25)'}`,
          background: hasTime ? T.accentSoft : 'transparent',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        }}>
          {hasTime && <div style={{ width: 6, height: 6, borderRadius: 99, background: T.accent }} />}
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 13, fontWeight: 500, color: T.text,
            lineHeight: '18px',
            whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
          }}>
            {title}
          </div>
          <div style={{
            marginTop: 1, fontSize: 11.5,
            display: 'flex', alignItems: 'center', gap: 5,
            color: hasTime ? T.textSoft : T.warningDot,
            whiteSpace: 'nowrap', overflow: 'hidden',
          }}>
            <SF n="clock" s={10} w={1.4} c={hasTime ? T.textMuted : T.warningDot} />
            <span>{when ?? 'Tap to set time'}</span>
            {ctx && (
              <>
                <span style={{ opacity: 0.4 }}>·</span>
                <span style={{ color: T.textMuted }}>{ctx}</span>
              </>
            )}
          </div>
        </div>

        {/* Right action */}
        {hasTime ? (
          <button
            onClick={onAdd}
            className="add-btn"
            style={{
              padding: '4px 12px', borderRadius: 6, flexShrink: 0,
              background: 'transparent',
              border: '1px solid rgba(0,122,253,0.55)',
              color: T.accentText, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', fontFamily: T.font, outline: 'none',
              transition: 'all 160ms ease',
            }}
          >
            Add
          </button>
        ) : (
          <button
            onClick={() => setPickerOpen(o => !o)}
            style={{
              padding: '4px 10px', borderRadius: 5, flexShrink: 0,
              background: 'rgba(0,122,253,0.15)',
              border: '1px solid rgba(0,122,253,0.30)',
              color: T.accentText, fontSize: 11, fontWeight: 500,
              cursor: 'pointer', fontFamily: T.font, outline: 'none',
              display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <SF n="clock" s={10} w={1.6} c={T.accentText} />
            Set time
          </button>
        )}
      </div>

      {/* Inline time picker — only shown when no time set */}
      {pickerOpen && !hasTime && (
        <div style={{ padding: '4px 10px 10px' }} className="animate-fade-in">
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 4, marginBottom: 6,
          }}>
            {TIME_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => pickPreset(p.h)}
                style={{
                  height: 28, borderRadius: 6,
                  background: 'rgba(255,255,255,0.07)',
                  border: '1px solid rgba(255,255,255,0.10)',
                  color: T.text, fontSize: 11, fontWeight: 500,
                  cursor: 'pointer', fontFamily: T.font, outline: 'none',
                  transition: 'all 140ms ease',
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="time"
            onChange={(e) => pickCustom(e.target.value)}
            placeholder="Custom time"
            style={{
              width: '100%', height: 30, borderRadius: 6,
              background: 'rgba(0,0,0,0.20)',
              border: '1px solid rgba(255,255,255,0.10)',
              color: T.text, fontSize: 12, padding: '0 10px',
              fontFamily: T.font, outline: 'none', colorScheme: 'dark',
            }}
          />
        </div>
      )}
    </div>
  )
}

function ParsedText({ text, dataArray }) {
  if (!text || !dataArray) return null

  // Build a map from lowercased phrase → variant
  const phraseMap = new Map()
  for (const d of dataArray) {
    if (d.timeText) phraseMap.set(d.timeText.toLowerCase(), 'when')
    if (d.who)      phraseMap.set(d.who.toLowerCase(),      'who')
    if (d.source)   phraseMap.set(d.source.toLowerCase(),   'source')
  }

  if (phraseMap.size === 0) {
    return <div style={{ fontSize: 14, lineHeight: '20px', color: T.text, paddingRight: 4 }}>{text}</div>
  }

  // Sort longest first to avoid partial matches
  const phrases = [...phraseMap.keys()].sort((a, b) => b.length - a.length)
  const pattern = phrases.map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const re = new RegExp(`(${pattern})`, 'i')
  const parts = text.split(re)

  return (
    <div style={{ fontSize: 14, lineHeight: '20px', color: T.text, paddingRight: 4 }}>
      {parts.map((part, i) => {
        const variant = phraseMap.get(part.toLowerCase())
        return variant
          ? <SubtleChip key={i} variant={variant}>{part}</SubtleChip>
          : part
      })}
    </div>
  )
}

