import { useState, useEffect, useRef } from 'react'
import { formatTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import {
  Icon, Pop, PopHead, Composer, Rule, Lbl, Row,
  FootBar, ViewAllBtn, EmptyState,
} from '../Primitives'
import { useGemini } from '../../hooks/useGemini'
import { useAutoGrowTextarea } from '../../hooks/useAutoGrowTextarea'
import { routeParseResult } from '@/lib/parseRoute'
import { COMPOSER_EXAMPLE } from '@/lib/copy'
import { MAX_COMPOSER_CHARS } from '@shared/limits'

const WARN_CHARS = 450

export function TypingScreen({ state, dispatch }) {
  const [text, setText]           = useState(state.inputText ?? '')
  const [isFocused, setIsFocused] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState(null)
  const textareaRef = useRef(null)

  const autoParse = state.settings?.autoParse === true
  const { status, result, error } = useGemini(text, autoParse)

  useAutoGrowTextarea(textareaRef, text)

  const atLimit = text.length >= MAX_COMPOSER_CHARS
  const nearLimit = text.length >= WARN_CHARS

  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    requestAnimationFrame(() => {
      el.focus()
      el.selectionStart = el.selectionEnd = el.value.length
    })
  }, [])

  useEffect(() => {
    if (!autoParse || status !== 'done' || !result || atLimit) return
    routeParseResult(dispatch, result)
  }, [autoParse, status, result, dispatch, atLimit])

  const handleChange = (e) => {
    const val = e.target.value.slice(0, MAX_COMPOSER_CHARS)
    setText(val)
    setSubmitError(null)
    dispatch({ type: 'UPDATE_INPUT', text: val })
  }

  const parseAndRoute = async () => {
    if (!canSend || submitting || atLimit) return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const data = await window.api.parseWithGemini(text)
      routeParseResult(dispatch, data)
    } catch (err) {
      setSubmitError(err.message ?? 'Parse failed')
    } finally {
      setSubmitting(false)
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      dispatch({ type: 'RESET' })
      return
    }
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (!atLimit) parseAndRoute()
    }
  }

  const today = new Date().toDateString()
  const todayReminders = state.reminders.filter(r => {
    if (r.done) return false
    return new Date(r.when).toDateString() === today
  })

  const canSend = text.trim().length >= 10 && !atLimit
  const isReading = autoParse
    ? (status === 'pending' || status === 'loading')
    : submitting
  const displayError = atLimit
    ? 'Too long — shorten to parse'
    : (autoParse ? error : submitError)

  const sendState = atLimit
    ? 'disabled'
    : isReading || submitting
      ? 'loading'
      : canSend
        ? 'ready'
        : 'disabled'

  const charFooter = nearLimit ? (
    <p
      className={cn(
        'mt-2 px-0.5 text-xs',
        atLimit ? 'text-destructive font-medium' : 'text-muted-foreground',
      )}
    >
      {atLimit
        ? `${text.length}/${MAX_COMPOSER_CHARS} — shorten text to parse`
        : `${text.length}/${MAX_COMPOSER_CHARS} characters`}
    </p>
  ) : !autoParse && canSend && !isReading && !displayError ? (
    <p className="mt-2 px-0.5 text-xs text-muted-foreground/50">
      Press ↵ to parse · Shift+↵ new line
    </p>
  ) : null

  return (
    <Pop>
      <PopHead
        onRefresh={async () => {
          const stored = await window.api.storeGet('reminders')
          if (Array.isArray(stored)) dispatch({ type: 'LOAD_REMINDERS', reminders: stored })
        }}
        onSettings={() => dispatch({ type: 'SET_SCREEN', screen: 'settings' })}
      />

      <Composer
        focused={isFocused}
        footer={charFooter}
        reading={isReading}
        error={!isReading ? displayError : null}
        sendState={sendState}
        onSend={parseAndRoute}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={COMPOSER_EXAMPLE}
          maxLength={MAX_COMPOSER_CHARS}
          rows={1}
          className={cn(
            'block w-full bg-transparent border-none outline-none resize-none',
            'text-sm leading-snug text-foreground placeholder:text-muted-foreground/60',
            'tracking-[-0.005em]',
          )}
          style={{ minHeight: 52, maxHeight: 132 }}
        />
      </Composer>

      <Rule />

      <Lbl>Today</Lbl>
      <div className="px-1.5 pb-1.5 flex-1 overflow-y-auto">
        {todayReminders.length === 0 ? (
          <EmptyState />
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
