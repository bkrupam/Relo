import { useState, useEffect, useRef } from 'react'
import { formatTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Icon, Pop, PopHead, Rule, Lbl, Row, FootBar, ViewAllBtn } from '../Primitives'
import { useGemini } from '../../hooks/useGemini'

export function TypingScreen({ state, dispatch }) {
  const [text, setText]         = useState(state.inputText ?? '')
  const [isFocused, setIsFocused] = useState(true)
  const textareaRef = useRef(null)

  const { status, result, error } = useGemini(text, state.settings?.autoParse !== false)

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = el.selectionEnd = el.value.length
    })
  }, [])

  useEffect(() => {
    if (status !== 'done' || !result) return
    const dataArr = Array.isArray(result) ? result : [result]
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
      // error surfaced by status indicator
    }
  }

  const today = new Date().toDateString()
  const todayReminders = state.reminders.filter(r => {
    if (r.done) return false
    return new Date(r.when).toDateString() === today
  })

  const canSend  = text.trim().length >= 10
  const isReading = status === 'pending' || status === 'loading'

  return (
    <Pop>
      <PopHead onSettings={() => dispatch({ type: 'SET_SCREEN', screen: 'settings' })} />

      <div className="px-3 pb-4">
        <div className={cn(
          'relative rounded-lg bg-input/30 border transition-all duration-150',
          'px-3.5 pt-3 pb-3 pr-12',
          isFocused
            ? 'border-ring ring-2 ring-ring/20'
            : 'border-border',
        )} style={{ minHeight: 88 }}>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder="Reply to Priya at 6 PM on Slack…"
            rows={3}
            className={cn(
              'block w-full bg-transparent border-none outline-none resize-none',
              'text-foreground text-sm leading-relaxed',
              'tracking-[-0.005em]',
            )}
            style={{ minHeight: 52 }}
          />

          {/* Status indicator — bottom-left inside the field */}
          {(isReading || error) && (
            <div className="absolute left-3.5 bottom-2.5 inline-flex items-center gap-1.5 pointer-events-none">
              {isReading ? (
                <>
                  <span className="size-1.5 rounded-full bg-ring inline-block shrink-0 animate-pulse-dot" />
                  <span className="text-xs font-medium text-foreground">Reading…</span>
                </>
              ) : error ? (
                <>
                  <Icon n="exclamationmark.circle" s={12} className="text-destructive" />
                  <span
                    className="text-xs font-medium text-destructive max-w-[200px] truncate"
                    title={error}
                  >
                    {error}
                  </span>
                </>
              ) : null}
            </div>
          )}

          {/* Send button */}
          <button
            onClick={handleSend}
            className={cn(
              'absolute right-2 bottom-2 size-[30px] rounded-lg',
              'inline-flex items-center justify-center transition-all duration-180 outline-none border',
              canSend
                ? 'bg-primary border-ring/30 text-primary-foreground cursor-pointer'
                : 'bg-secondary/50 border-border text-muted-foreground cursor-default',
            )}
          >
            <Icon n="arrow.up" s={14} />
          </button>
        </div>
      </div>

      <Rule />

      <Lbl>Today</Lbl>
      <div className="px-1.5 pb-1.5 flex-1 overflow-y-auto">
        {todayReminders.length === 0 ? (
          <div className="py-5 px-3 flex flex-col items-center gap-1.5">
            <Icon n="calendar" s={24} className="text-muted-foreground/40" />
            <span className="text-xs text-muted-foreground/50 text-center">
              Nothing due today.
            </span>
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
              <Icon n="checkmark.circle" s={14} className="text-ring" />
              <span>Calendar synced</span>
            </>
          ) : (
            <>
              <Icon n="xmark.circle" s={14} className="text-muted-foreground/50" />
              <span className="text-muted-foreground/50">Not connected</span>
            </>
          )
        }
        right={<ViewAllBtn onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'list' })} />}
      />
    </Pop>
  )
}
