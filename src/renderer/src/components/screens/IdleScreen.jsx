import { T, formatTime } from '../../tokens'
import { SF } from '../icons/SF'
import { Pop, PopHead, Field, SendBtn, Rule, Lbl, Row, FootBar, ViewAllBtn } from '../Primitives'

export function IdleScreen({ state, dispatch }) {
  const today = new Date().toDateString()
  const todayReminders = state.reminders.filter(r => {
    if (r.done) return false
    return new Date(r.when).toDateString() === today
  })

  return (
    <Pop>
      <PopHead onSettings={() => dispatch({ type: 'SET_SCREEN', screen: 'settings' })} />

      <Field
        focused={false}
        onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'typing' })}
      >
        <div style={{
          fontSize: 13.5, lineHeight: '19px',
          color: T.textMuted,
          userSelect: 'none',
        }}>
          Reply to Priya at 6 PM…
        </div>
        <SendBtn state="disabled" />
      </Field>

      <Rule />

      <Lbl>Today</Lbl>
      <div style={{ padding: '0 8px 8px', flex: 1, overflowY: 'auto' }}>
        {todayReminders.length === 0
          ? <EmptyToday />
          : todayReminders.map(r => (
            <Row
              key={r.id}
              title={r.what}
              when={formatTime(r.when)}
              ctx={r.source}
              urgent={r.urgent}
              onToggle={() => dispatch({ type: 'TOGGLE_REMINDER', id: r.id })}
              onDelete={() => {
                window.api.cancelNotification(r.id).catch(() => {})
                dispatch({ type: 'DELETE_REMINDER', id: r.id })
              }}
            />
          ))
        }
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

function EmptyToday() {
  return (
    <div style={{
      padding: '20px 12px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6,
    }}>
      <SF n="calendar" s={24} w={1.3} c={T.textMuted} />
      <span style={{ fontSize: 11.5, color: T.textMuted, textAlign: 'center', lineHeight: '16px' }}>
        Nothing due today.
      </span>
    </div>
  )
}
