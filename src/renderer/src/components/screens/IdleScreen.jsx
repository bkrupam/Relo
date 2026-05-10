import { formatTime } from '@/lib/utils'
import { Icon, Pop, PopHead, Field, SendBtn, Rule, Lbl, Row, FootBar, ViewAllBtn } from '../Primitives'

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
        <div className="text-sm leading-snug text-muted-foreground/60 select-none">
          Reply to Priya at 6 PM…
        </div>
        <SendBtn state="disabled" />
      </Field>

      <Rule />

      <Lbl>Today</Lbl>
      <div className="px-2 pb-2 flex-1 overflow-y-auto">
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

function EmptyToday() {
  return (
    <div className="py-5 px-3 flex flex-col items-center gap-1.5">
      <Icon n="calendar" s={24} className="text-muted-foreground/40" />
      <span className="text-xs text-muted-foreground/50 text-center">
        Nothing due today.
      </span>
    </div>
  )
}
