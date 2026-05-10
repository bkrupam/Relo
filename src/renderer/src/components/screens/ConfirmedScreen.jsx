import { useState, useEffect } from 'react'
import { formatTime, formatDate } from '@/lib/utils'
import { Icon, Pop, PopHead, Field, SendBtn, Rule, Lbl, Row, FootBar, ViewAllBtn } from '../Primitives'

export function ConfirmedScreen({ state, dispatch }) {
  const { confirmedReminders = [], confirmedSyncFailed, reminders } = state
  const [toastVisible, setToastVisible] = useState(true)

  const today = new Date().toDateString()
  const todayReminders = reminders.filter(r => !r.done && new Date(r.when).toDateString() === today)

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

      <Field
        focused={false}
        onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'typing' })}
      >
        <div className="text-[13.5px] leading-[19px] text-muted-foreground/60 select-none">
          Add another reminder…
        </div>
        <SendBtn state="disabled" />
      </Field>

      {/* Toasts */}
      {toastVisible && confirmedReminders.length > 0 && (
        <div className="mx-3 mb-2.5 flex flex-col gap-1 animate-in fade-in slide-in-from-bottom-1 duration-300">
          {confirmedReminders.map((r, i) => (
            <div
              key={r.id ?? i}
              className="flex items-center gap-2 px-3 py-2 rounded-md bg-secondary border border-border"
            >
              <div className="size-4 rounded-full shrink-0 bg-accent border border-ring/30 inline-flex items-center justify-center">
                <Icon n="check" s={8} className="text-ring" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[12.5px] font-medium text-foreground truncate">
                  {r.what ?? 'Reminder'} added
                </div>
                {r.when && (
                  <div className="text-[11px] text-muted-foreground mt-px">
                    {formatDate(r.when)}, {formatTime(r.when)}
                  </div>
                )}
              </div>
              <div className="flex gap-1 shrink-0">
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

      <Lbl>Today</Lbl>
      <div className="px-2 pb-2 flex-1 overflow-y-auto">
        {todayReminders.length === 0 ? (
          <div className="py-5 px-3 flex flex-col items-center gap-1.5">
            <Icon n="calendar" s={24} className="text-muted-foreground/40" />
            <span className="text-[11.5px] text-muted-foreground/50 text-center leading-4">
              Nothing else due today.
            </span>
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
        <div className="mx-3 mb-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-destructive/10 border border-destructive/20 text-[11.5px] text-destructive">
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

function ToastBtn({ onClick, children }) {
  return (
    <button
      onClick={onClick}
      className="px-2 py-[3px] rounded-md bg-transparent border border-border text-foreground text-[11px] font-medium cursor-pointer outline-none hover:bg-accent"
    >
      {children}
    </button>
  )
}
