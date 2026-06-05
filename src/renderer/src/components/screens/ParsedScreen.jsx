import { useState, useEffect, useCallback } from 'react'
import { formatDate, formatTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Icon, Pop, PopHead, Composer, FootBar, Kbd } from '../Primitives'
import { highlightParseText } from '@/lib/highlightParseText'
import { Button } from '@/components/ui/button'

const TIME_PRESETS = [
  { label: '8 AM',  h: 8  },
  { label: '9 AM',  h: 9  },
  { label: '12 PM', h: 12 },
  { label: '2 PM',  h: 14 },
  { label: '5 PM',  h: 17 },
  { label: '6 PM',  h: 18 },
]

function buildISO(h, m = 0) {
  const dt = new Date()
  dt.setHours(h, m, 0, 0)
  return dt.toISOString()
}

export function ParsedScreen({ state, dispatch }) {
  const { parsedData, inputText } = state
  if (!parsedData || !Array.isArray(parsedData) || parsedData.length === 0) return null

  const [rowTimes, setRowTimes] = useState(() => parsedData.map(d => d.when))

  const setTimeForRow = (index, isoTime) => {
    setRowTimes(prev => {
      const next = [...prev]
      next[index] = isoTime
      return next
    })
  }

  const allTimesSet = rowTimes.every(t => !!t)
  const hasMultiple = parsedData.length > 1
  const mergedItems = parsedData.map((d, i) => ({ ...d, when: rowTimes[i] }))

  const handleSubmitAll = useCallback(() => {
    if (!allTimesSet) return
    dispatch({ type: 'PARSED', data: mergedItems })
    setTimeout(() => dispatch({ type: 'SUBMIT' }), 0)
  }, [allTimesSet, dispatch, mergedItems])

  const handleAddSingle = useCallback((index) => {
    if (!rowTimes[index]) return
    const item = { ...parsedData[index], when: rowTimes[index] }
    dispatch({ type: 'PARSED', data: [item] })
    setTimeout(() => dispatch({ type: 'SUBMIT' }), 0)
  }, [dispatch, parsedData, rowTimes])

  const handleConfirmAdd = useCallback(() => {
    if (!allTimesSet) return
    if (hasMultiple) handleSubmitAll()
    else handleAddSingle(0)
  }, [allTimesSet, hasMultiple, handleSubmitAll, handleAddSingle])

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); dispatch({ type: 'RESET' }) }
      if (e.key === 'Enter' && !e.shiftKey && allTimesSet) {
        e.preventDefault()
        handleConfirmAdd()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch, allTimesSet, handleConfirmAdd])

  return (
    <Pop>
      <PopHead onSettings={() => dispatch({ type: 'SET_SCREEN', screen: 'settings' })} />

      <Composer
        focused={false}
        sendState="disabled"
        onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'typing' })}
      >
        <div className="text-sm leading-snug text-foreground select-none pointer-events-none pr-1">
          {highlightParseText(inputText, parsedData)}
        </div>
      </Composer>

      <div className="px-2 py-1 flex-1 overflow-y-auto animate-in fade-in slide-in-from-bottom-1 duration-300">
        {parsedData.map((data, index) => {
          const hasTime = !!rowTimes[index]
          const title   = data.what || (parsedData.length === 1 ? inputText : data.originalText)
          const when    = rowTimes[index]
            ? `${formatDate(rowTimes[index])}, ${formatTime(rowTimes[index])}`
            : null

          return (
            <ParsedRowWithPicker
              key={index}
              title={title}
              when={when}
              ctx={data.source}
              hasTime={hasTime}
              showRowAdd={hasMultiple}
              onTimeSet={(iso) => setTimeForRow(index, iso)}
              onAdd={() => handleAddSingle(index)}
            />
          )
        })}
      </div>

      {hasMultiple && (
        <div className="px-3 pb-3">
          <Button
            onClick={handleSubmitAll}
            disabled={!allTimesSet}
            className="w-full h-[38px] text-sm font-semibold gap-1.5"
            variant={allTimesSet ? 'default' : 'outline'}
          >
            <Icon n="calendar.badge.plus" s={13} />
            {allTimesSet ? 'Add all to Calendar' : 'Set all times to continue'}
          </Button>
        </div>
      )}

      {!hasMultiple && allTimesSet && (
        <div className="px-3 pb-3">
          <Button
            onClick={() => handleAddSingle(0)}
            className="w-full h-[38px] text-sm font-semibold gap-1.5"
          >
            <Icon n="calendar.badge.plus" s={13} />
            Add to Calendar
          </Button>
        </div>
      )}

      <FootBar
        left={<span className="text-muted-foreground/60 text-xs">esc to cancel</span>}
        right={
          allTimesSet ? (
            <span className="text-xs text-muted-foreground/60 flex items-center gap-1">
              <Kbd>↵</Kbd> add
            </span>
          ) : (
            <span className="text-xs text-muted-foreground/60">Set a time to add</span>
          )
        }
      />
    </Pop>
  )
}

// ── Row with optional inline time picker ──────────────────────────────────────
function ParsedRowWithPicker({ title, when, ctx, hasTime, showRowAdd = true, onTimeSet, onAdd }) {
  const [pickerOpen, setPickerOpen] = useState(!hasTime)

  const pickPreset = (h) => {
    onTimeSet(buildISO(h))
    setPickerOpen(false)
  }

  const pickCustom = (val) => {
    if (!val) return
    const [h, m] = val.split(':').map(Number)
    onTimeSet(buildISO(h, m))
    setPickerOpen(false)
  }

  return (
    <div className={cn(
      'rounded-md mb-1 border overflow-hidden transition-all duration-200',
      pickerOpen && !hasTime
        ? 'bg-accent/30 border-ring/30'
        : 'bg-transparent border-transparent',
    )}>
      <div className="flex gap-2.5 px-2 py-1.5 items-center cursor-default">
        <div className={cn(
          'size-3.5 rounded-full shrink-0 border-[1.5px] inline-flex items-center justify-center',
          hasTime ? 'border-ring/40 bg-accent/40' : 'border-border bg-transparent',
        )}>
          {hasTime && <div className="size-1.5 rounded-full bg-ring" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium text-foreground leading-snug truncate">{title}</div>
          <div className={cn(
            'mt-px text-xs flex items-center gap-1.5 truncate',
            hasTime ? 'text-muted-foreground' : 'text-destructive',
          )}>
            <Icon n="clock" s={10} className={hasTime ? 'text-muted-foreground/60 shrink-0' : 'text-destructive shrink-0'} />
            <span>{when ?? 'Set a time'}</span>
            {ctx && (
              <>
                <span className="opacity-40">·</span>
                <span className="text-muted-foreground/60">{ctx}</span>
              </>
            )}
          </div>
        </div>

        {hasTime && showRowAdd ? (
          <Button size="xs" variant="default" onClick={onAdd} className="shrink-0 font-semibold px-3">
            Add
          </Button>
        ) : !hasTime ? (
          <Button
            size="xs"
            variant="secondary"
            onClick={() => setPickerOpen(o => !o)}
            className="shrink-0 gap-1"
          >
            <Icon n="clock" s={10} className="text-muted-foreground" />
            Set time
          </Button>
        ) : null}
      </div>

      {pickerOpen && !hasTime && (
        <div className="px-2.5 pb-2.5 animate-in fade-in duration-200">
          <div className="grid grid-cols-6 gap-1 mb-1.5">
            {TIME_PRESETS.map(p => (
              <button
                key={p.label}
                type="button"
                onClick={() => pickPreset(p.h)}
                className="h-7 rounded-md bg-secondary/50 border border-border text-foreground text-xs font-medium cursor-pointer outline-none transition-all duration-140 hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/30"
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="time"
            onChange={(e) => pickCustom(e.target.value)}
            className="w-full h-[30px] rounded-md bg-input/30 border border-border text-foreground text-xs px-2.5 outline-none"
          />
        </div>
      )}
    </div>
  )
}

