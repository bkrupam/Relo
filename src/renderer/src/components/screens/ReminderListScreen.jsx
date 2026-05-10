import { useEffect, useState } from 'react'
import { formatTime } from '@/lib/utils'
import { Icon, Pop, Rule, Lbl, Row, FootBar, HBtn } from '../Primitives'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const TABS = [
  { label: 'Relo', value: 'relo' },
  { label: 'All',  value: 'all'  },
]

export function ReminderListScreen({ state, dispatch }) {
  const { reminders, listTab } = state
  const [allCalendarEvents, setAllCalendarEvents] = useState([])
  const [loadingAll, setLoadingAll] = useState(false)

  useEffect(() => {
    if (listTab !== 'all') return
    setLoadingAll(true)
    window.api.listAllCalendarEvents()
      .then(events => setAllCalendarEvents(events ?? []))
      .catch(() => setAllCalendarEvents([]))
      .finally(() => setLoadingAll(false))
  }, [listTab])

  const activeCount = reminders.filter(r => !r.done).length
  const now     = new Date()
  const today   = now.toDateString()
  const tomorrow = new Date(now); tomorrow.setDate(now.getDate() + 1)
  const tomStr  = tomorrow.toDateString()

  const source       = listTab === 'relo' ? reminders : (allCalendarEvents ?? reminders)
  const todayItems   = source.filter(r => new Date(r.when).toDateString() === today && !r.done)
  const tomorrowItems = source.filter(r => new Date(r.when).toDateString() === tomStr && !r.done)
  const upcomingItems = source.filter(r => new Date(r.when) > tomorrow && !r.done)
  const doneItems    = source.filter(r => r.done)

  return (
    <Pop>
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-2.5">
        <div className="flex items-center gap-2">
          <HBtn icon="chevron.left" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'idle' })} />
          <span className="text-sm font-bold tracking-tight text-foreground">
            Reminders
          </span>
        </div>
        <div className="flex gap-0.5">
          <HBtn icon="magnifying" />
          <HBtn icon="plus" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'typing' })} />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-3.5 pb-2.5">
        <Tabs value={listTab} onValueChange={(tab) => dispatch({ type: 'SET_LIST_TAB', tab })}>
          <TabsList className="w-full">
            {TABS.map(t => (
              <TabsTrigger key={t.value} value={t.value} className="flex-1">
                {t.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      </div>

      {/* Scrollable list */}
      <div className="flex-1 overflow-y-auto px-1.5 pb-1.5">
        <Group label="Today"    items={todayItems}    dispatch={dispatch} />
        <Group label="Tomorrow" items={tomorrowItems} dispatch={dispatch} />
        <Group label="Upcoming" items={upcomingItems} dispatch={dispatch} />
        {doneItems.length > 0 && (
          <Group label="Done" items={doneItems} dispatch={dispatch} />
        )}

        {source.length === 0 && (
          <div className="py-8 px-3 text-center text-[12px] text-muted-foreground/60 leading-5 whitespace-pre-line">
            {listTab === 'all' && loadingAll
              ? (
                <div className="flex flex-col items-center gap-2">
                  <span className="size-4 rounded-full border-[1.5px] border-muted-foreground border-t-transparent animate-spin" />
                  <span>Loading calendar…</span>
                </div>
              )
              : listTab === 'all'
                ? 'No upcoming calendar events.\nConnect Google Calendar in Settings.'
                : 'No reminders yet.\nType in the popover to add one.'}
          </div>
        )}
      </div>

      <FootBar
        left={
          <>
            <Icon n="checkmark.circle" s={14} className="text-ring" />
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
