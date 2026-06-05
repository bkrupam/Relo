import { formatTime } from '@/lib/utils'
import { COMPOSER_EXAMPLE } from '@/lib/copy'
import { Icon, Pop, PopHead, Composer, Rule, Lbl, Row, FootBar, ViewAllBtn, EmptyState } from '../Primitives'

export function IdleScreen({ state, dispatch }) {
  const today = new Date().toDateString()
  const todayReminders = state.reminders.filter(r => {
    if (r.done) return false
    return new Date(r.when).toDateString() === today
  })

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
        focused={false}
        sendState="disabled"
        onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'typing' })}
      >
        <div className="text-sm leading-snug text-muted-foreground/60 select-none pointer-events-none">
          {COMPOSER_EXAMPLE}
        </div>
      </Composer>

      <Rule />

      <Lbl>Today</Lbl>
      <div className="px-2 pb-2 flex-1 overflow-y-auto">
        {todayReminders.length === 0
          ? <EmptyState />
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
