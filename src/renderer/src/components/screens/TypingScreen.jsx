import { useState, useEffect, useRef } from 'react'
import { T, formatTime } from '../../tokens'
import { SF } from '../icons/SF'
import { Pop, PopHead, Field, SendBtn, Rule, Lbl, Row, FootBar, ViewAllBtn } from '../Primitives'
import { useGemini } from '../../hooks/useGemini'

export function TypingScreen({ state, dispatch }) {
  const [text, setText]     = useState(state.inputText ?? '')
  const [isFocused, setIsFocused] = useState(true)
  const textareaRef = useRef(null)

  const { status, result, error } = useGemini(text, state.settings?.autoParse !== false)

  // Auto-focus on mount
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = el.selectionEnd = el.value.length
    })
  }, [])

  // Route to parsed/ambiguous when Gemini returns a result
  useEffect(() => {
    if (status !== 'done' || !result) return
    // result is always an array from geminiParse
    const dataArr = Array.isArray(result) ? result : [result]
    // Go to ambiguous only when there's a single item with no time
    const goAmbiguous = dataArr.length === 1 && (dataArr[0].ambiguous || !dataArr[0].when)
    if (goAmbiguous) {
      dispatch({ type: 'AMBIGUOUS', data: dataArr })
    } else {
      dispatch({ type: 'PARSED', data: dataArr })
    }
  }, [status, result, dispatch])

  const handleChange = (e) => {
    const val = e.target.value
    setText(val)
    dispatch({ type: 'UPDATE_INPUT', text: val })
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') dispatch({ type: 'RESET' })
  }

  // Manual send — fire Gemini immediately (ignore debounce)
  const handleSend = async () => {
    if (!canSend) return
    try {
      const data = await window.api.parseWithGemini(text)
      const dataArr = Array.isArray(data) ? data : [data]
      const goAmbiguous = dataArr.length === 1 && (dataArr[0].ambiguous || !dataArr[0].when)
      if (goAmbiguous) {
        dispatch({ type: 'AMBIGUOUS', data: dataArr })
      } else {
        dispatch({ type: 'PARSED', data: dataArr })
      }
    } catch {
      // error surfaced by footer
    }
  }

  const today = new Date().toDateString()
  const todayReminders = state.reminders.filter(r => {
    if (r.done) return false
    return new Date(r.when).toDateString() === today
  })

  const canSend = text.trim().length >= 10
  const isReading = status === 'pending' || status === 'loading'

  return (
    <Pop>
      <PopHead
        onSettings={() => dispatch({ type: 'SET_SCREEN', screen: 'settings' })}
      />

      <div style={{ padding: '0 12px 16px' }}>
        <div style={{
          position: 'relative',
          background: T.fieldFill,
          border: `1px solid ${isFocused ? T.fieldFocusBorder : T.fieldBorder}`,
          borderRadius: T.radiusMd,
          padding: '12px 48px 12px 14px',
          minHeight: 88,
          boxShadow: isFocused ? `${T.accentRing}, inset 0 1px 0 rgba(255,255,255,0.05)` : 'none',
          transition: 'border-color 150ms ease, box-shadow 150ms ease',
        }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Reply to Priya at 6 PM on Slack…"
            rows={3}
            style={{
              display: 'block',
              width: '100%',
              background: 'transparent',
              border: 'none',
              outline: 'none',
              resize: 'none',
              color: T.text,
              fontSize: 14,
              lineHeight: '21px',
              fontFamily: T.font,
              minHeight: 52,
              letterSpacing: '-0.005em',
            }}
          />

          {/* Reading / error — bottom-left inside the field, no pill */}
          {(isReading || error) && (
            <div style={{
              position: 'absolute', left: 14, bottom: 10,
              display: 'inline-flex', alignItems: 'center', gap: 6,
              pointerEvents: 'none',
            }}>
              {isReading ? (
                <>
                  <span
                    style={{ width: 6, height: 6, borderRadius: 99, background: T.accent, display: 'inline-block', flexShrink: 0 }}
                    className="animate-pulse-dot"
                  />
                  <span style={{ fontSize: 12, fontWeight: 500, color: T.text }}>Reading…</span>
                </>
              ) : error ? (
                <>
                  <SF n="exclamationmark.circle" s={12} w={1.5} c="rgba(255,100,100,0.9)" />
                  <span style={{ fontSize: 12, fontWeight: 500, color: 'rgba(255,100,100,0.9)', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={error}>
                    {error}
                  </span>
                </>
              ) : null}
            </div>
          )}

          <button
            onClick={handleSend}
            style={{
              position: 'absolute', right: 8, bottom: 8,
              width: 30, height: 30, borderRadius: 8,
              background: canSend ? T.accent : 'rgba(255,255,255,0.04)',
              border: `1px solid ${canSend ? 'rgba(0,122,253,0.6)' : 'rgba(255,255,255,0.07)'}`,
              color: '#fff',
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              cursor: canSend ? 'pointer' : 'default',
              transition: 'all 180ms ease',
              boxShadow: canSend ? '0 2px 8px rgba(0,122,253,0.40)' : 'none',
            }}
          >
            <SF n="arrow.up" s={14} w={1.8} c={canSend ? '#fff' : T.textMuted} />
          </button>
        </div>
      </div>

      <Rule />

      <Lbl>Today</Lbl>
      <div style={{ padding: '0 6px 6px', flex: 1, overflowY: 'auto' }}>
        {todayReminders.length === 0 ? (
          <div style={{ padding: '12px 10px', fontSize: 12.5, color: T.textMuted }}>
            Nothing due today.
          </div>
        ) : (
          todayReminders.map(r => (
            <Row
              key={r.id}
              title={r.what}
              when={formatTime(r.when)}
              ctx={r.source}
              onToggle={() => dispatch({ type: 'TOGGLE_REMINDER', id: r.id })}
            />
          ))
        )}
      </div>

      <FootBar
        left={
          state.settings.calendarConnected ? (
            <>
              <SF n="checkmark.circle" s={14} w={1.5} c={T.accent} />
              <span>Calendar synced</span>
            </>
          ) : (
            <>
              <SF n="xmark.circle" s={14} w={1.5} c={T.textMuted} />
              <span style={{ color: T.textMuted }}>Not connected</span>
            </>
          )
        }
        right={<ViewAllBtn onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'list' })} />}
      />
    </Pop>
  )
}
