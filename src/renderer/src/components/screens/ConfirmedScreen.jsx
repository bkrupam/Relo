import { useState, useEffect } from 'react'
import { formatTime, formatDate } from '@/lib/utils'
import {
  Icon, Pop, PopHead, Composer, Rule, Lbl, Row,
  FootBar, ViewAllBtn, EmptyState, ConfirmToast,
} from '../Primitives'

export function ConfirmedScreen({ state, dispatch }) {
  const { confirmedReminders = [], confirmedSyncFailed, reminders } = state
  const [toastVisible, setToastVisible] = useState(true)

  const today = new Date().toDateString()
  const todayReminders = reminders.filter(r => !r.done && new Date(r.when).toDateString() === today)

  useEffect(() => {
    const t = setTimeout(() => setToastVisible(false), 5000)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') dispatch({ type: 'RESET' })
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])

  const dismissToasts = () => setToastVisible(false)

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
          Add another reminder…
        </div>
      </Composer>

      {toastVisible && confirmedReminders.length > 0 && (
        <div className="mx-3 mb-2.5 flex flex-col gap-1">
          {confirmedReminders.map((r, i) => (
            <ConfirmToast
              key={r.id ?? i}
              reminder={{
                what: r.what,
                whenLabel: r.when ? `${formatDate(r.when)}, ${formatTime(r.when)}` : null,
              }}
              onDismiss={dismissToasts}
              onEdit={() => dispatch({ type: 'EDIT_REMINDER', reminder: r })}
              onOpen={r.calendarLink ? () => window.api.openExternal(r.calendarLink) : undefined}
            />
          ))}
        </div>
      )}

      <Rule />

      <Lbl>Today</Lbl>
      <div className="px-2 pb-2 flex-1 overflow-y-auto">
        {todayReminders.length === 0 ? (
          <EmptyState message="Nothing else due today." />
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
        <div className="mx-3 mb-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-destructive/10 border border-destructive/20 text-xs text-destructive">
          <Icon n="exclamationmark.triangle" s={12} className="text-destructive" />
          Saved locally — Calendar sync failed
        </div>
      )}

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
