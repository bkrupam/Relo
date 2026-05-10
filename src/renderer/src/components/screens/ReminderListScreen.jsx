import { useEffect, useState } from 'react'
import { T, formatTime, formatDate } from '../../tokens'
import { SF } from '../icons/SF'
import { Pop, Rule, Lbl, Row, FootBar, HBtn, SegControl } from '../Primitives'

const TABS = [
  { label: 'Relo', value: 'relo' },
  { label: 'All',  value: 'all'      },
]

export function ReminderListScreen({ state, dispatch }) {
  const { reminders, listTab } = state
  const [allCalendarEvents, setAllCalendarEvents] = useState([])
  const [loadingAll, setLoadingAll] = useState(false)

  // Fetch all calendar events when the "All" tab is active
  useEffect(() => {
    if (listTab !== 'all') return
    setLoadingAll(true)
    window.api.listAllCalendarEvents()
      .then(events => setAllCalendarEvents(events ?? []))
      .catch(() => setAllCalendarEvents([]))
      .finally(() => setLoadingAll(false))
  }, [listTab])
  const activeCount = reminders.filter(r => !r.done).length

  const now = new Date()
  const today = now.toDateString()
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1)
  const tomStr = tomorrow.toDateString()

  const source = listTab === 'relo' ? reminders : (allCalendarEvents ?? reminders)

  const todayItems     = source.filter(r => new Date(r.when).toDateString() === today && !r.done)
  const tomorrowItems  = source.filter(r => new Date(r.when).toDateString() === tomStr && !r.done)
  const upcomingItems  = source.filter(r => new Date(r.when) > tomorrow && !r.done)
  const doneItems      = source.filter(r => r.done)

  return (
    <Pop>
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 12px 8px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HBtn icon="chevron.left" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'idle' })} />
          <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.012em', color: T.text }}>
            Reminders
          </span>
        </div>
        <div style={{ display: 'flex', gap: 1 }}>
          <HBtn icon="magnifying" />
          <HBtn icon="plus" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'typing' })} />
        </div>
      </div>

      {/* Segmented control */}
      <div style={{ padding: '0 11px 8px' }}>
        <SegControl
          options={TABS}
          value={listTab}
          onChange={(tab) => dispatch({ type: 'SET_LIST_TAB', tab })}
        />
      </div>

      {/* Scrollable list */}
      <div style={{ flex: 1, overflow: 'hidden auto', padding: '0 6px 6px' }}>
        <Group label="Today" items={todayItems} dispatch={dispatch} />
        <Group label="Tomorrow" items={tomorrowItems} dispatch={dispatch} />
        <Group label="Upcoming" items={upcomingItems} dispatch={dispatch} />
        {doneItems.length > 0 && (
          <Group label="Done" items={doneItems} dispatch={dispatch} />
        )}

        {source.length === 0 && (
          <div style={{
            padding: '32px 12px', textAlign: 'center',
            fontSize: 12, color: T.textMuted, lineHeight: '20px',
          }}>
            {listTab === 'all' && loadingAll
              ? 'Loading calendar…'
              : listTab === 'all'
                ? 'No upcoming calendar events.\nConnect Google Calendar in Settings.'
                : 'No reminders yet.\nType in the popover to add one.'}
          </div>
        )}
      </div>

      <FootBar
        left={
          <>
            <SF n="checkmark.circle" s={14} w={1.5} c={T.accent} />
            <span>{activeCount} active</span>
          </>
        }
      />
    </Pop>
  )
}

function Group({ label, items, dispatch }) {
  if (!items.length) return null
  return (
    <>
      <Lbl>{label}</Lbl>
      {items.map(r => (
        <Row
          key={r.id}
          title={r.what}
          when={formatTime(r.when)}
          ctx={r.source}
          done={r.done}
          onToggle={() => dispatch({ type: 'TOGGLE_REMINDER', id: r.id })}
          onDelete={r.id ? () => {
            window.api.cancelNotification(r.id).catch(() => {})
            dispatch({ type: 'DELETE_REMINDER', id: r.id })
          } : undefined}
        />
      ))}
    </>
  )
}
