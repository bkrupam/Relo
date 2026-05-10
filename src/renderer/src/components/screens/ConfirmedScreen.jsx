import { useState, useEffect } from 'react'
import { T, formatTime, formatDate } from '../../tokens'
import { SF } from '../icons/SF'
import { Pop, PopHead, Field, SendBtn, Rule, Lbl, Row, FootBar, ViewAllBtn } from '../Primitives'

export function ConfirmedScreen({ state, dispatch }) {
  const { confirmedReminders = [], confirmedSyncFailed, reminders } = state
  const [toastVisible, setToastVisible] = useState(true)

  const today = new Date().toDateString()
  const todayReminders = reminders.filter(r => !r.done && new Date(r.when).toDateString() === today)

  // Auto-dismiss the toasts after 4 seconds
  useEffect(() => {
    const t = setTimeout(() => setToastVisible(false), 4000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') dispatch({ type: 'RESET' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])

  return (
    <Pop>
      <PopHead onSettings={() => dispatch({ type: 'SET_SCREEN', screen: 'settings' })} />

      {/* Input field — click to start a new reminder */}
      <Field
        focused={false}
        onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'typing' })}
      >
        <div style={{ fontSize: 13.5, lineHeight: '19px', color: T.textMuted, userSelect: 'none' }}>
          Add another reminder…
        </div>
        <SendBtn state="disabled" />
      </Field>

      {/* One compact toast per confirmed item */}
      {toastVisible && confirmedReminders.length > 0 && (
        <div className="animate-fade-in" style={{ margin: '0 12px 10px', display: 'flex', flexDirection: 'column', gap: 4 }}>
          {confirmedReminders.map((r, i) => (
            <div
              key={r.id ?? i}
              style={{
                padding: '8px 12px',
                borderRadius: T.radiusSm,
                background: 'rgba(0, 122, 253, 0.10)',
                border: '1px solid rgba(0, 122, 253, 0.22)',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <div style={{
                width: 16, height: 16, borderRadius: 99, flexShrink: 0,
                background: T.accentSoft,
                border: `1px solid ${T.accentBorder}`,
                display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <SF n="check" s={8} w={2.6} c={T.accent} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontSize: 12.5, fontWeight: 500, color: T.text,
                  whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                }}>
                  {r.what ?? 'Reminder'} added
                </div>
                {r.when && (
                  <div style={{ fontSize: 11, color: T.textSoft, marginTop: 1 }}>
                    {formatDate(r.when)}, {formatTime(r.when)}
                  </div>
                )}
              </div>
              <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                <ToastBtn onClick={() => dispatch({ type: 'EDIT_REMINDER', reminder: r })}>
                  Edit
                </ToastBtn>
                {r.calendarLink && (
                  <ToastBtn onClick={() => window.api.openExternal(r.calendarLink)}>
                    Open
                  </ToastBtn>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Rule />

      {/* Today list */}
      <Lbl>Today</Lbl>
      <div style={{ padding: '0 8px 8px', flex: 1, overflowY: 'auto' }}>
        {todayReminders.length === 0 ? (
          <div style={{ padding: '16px 10px', fontSize: 12.5, color: T.textMuted, textAlign: 'center' }}>
            Nothing else due today.
          </div>
        ) : (
          todayReminders.map(r => (
            <Row
              key={r.id}
              title={r.what}
              when={formatTime(r.when)}
              ctx={r.source}
              done={r.done}
              onToggle={() => dispatch({ type: 'TOGGLE_REMINDER', id: r.id })}
              onDelete={() => {
                window.api.cancelNotification(r.id).catch(() => {})
                dispatch({ type: 'DELETE_REMINDER', id: r.id })
              }}
            />
          ))
        )}
      </div>

      {confirmedSyncFailed && (
        <div style={{
          margin: '0 12px 8px',
          padding: '6px 10px',
          borderRadius: 6,
          background: 'rgba(255,100,60,0.08)',
          border: '1px solid rgba(255,100,60,0.20)',
          fontSize: 11.5, color: 'rgba(255,140,100,0.9)',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          <SF n="exclamationmark.triangle" s={12} w={1.8} c="rgba(255,140,100,0.9)" />
          Saved locally — Calendar sync failed
        </div>
      )}

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

function ToastBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '3px 8px', borderRadius: 5,
        background: 'transparent',
        border: '1px solid rgba(0,122,253,0.25)',
        color: T.accentText, fontSize: 11, fontWeight: 500,
        cursor: 'pointer', fontFamily: T.font, outline: 'none',
      }}
    >
      {children}
    </button>
  )
}
