import { useState, useEffect } from 'react'
import { formatDate, formatTime } from '@/lib/utils'
import { cn } from '@/lib/utils'
import { Icon, Pop, PopHead, Field, SendBtn, FootBar, Kbd, SubtleChip } from '../Primitives'
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

  const handleSubmitAll = () => {
    if (!allTimesSet) return
    dispatch({ type: 'PARSED', data: mergedItems })
    setTimeout(() => dispatch({ type: 'SUBMIT' }), 0)
  }

  const handleAddSingle = (index) => {
    if (!rowTimes[index]) return
    const item = mergedItems[index]
    dispatch({ type: 'PARSED', data: [item] })
    setTimeout(() => dispatch({ type: 'SUBMIT' }), 0)
  }

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') { e.preventDefault(); dispatch({ type: 'RESET' }) }
      if (e.key === 'Enter' && !e.shiftKey && allTimesSet) { e.preventDefault(); handleSubmitAll() }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch, allTimesSet, rowTimes])

  return (
    <Pop>
      <PopHead onSettings={() => dispatch({ type: 'SET_SCREEN', screen: 'settings' })} />

      <Field focused={false} onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'typing' })}>
        <ParsedText text={inputText} dataArray={parsedData} />
        <SendBtn state={allTimesSet ? 'ready' : 'disabled'} onClick={handleSubmitAll} />
      </Field>

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
            className={cn(
              'w-full h-[38px] text-[13px] font-semibold gap-1.5',
              allTimesSet
                ? 'bg-primary text-primary-foreground border-ring/30'
                : 'bg-secondary/50 border-border text-muted-foreground',
            )}
            variant={allTimesSet ? 'default' : 'outline'}
          >
            <Icon n="calendar.badge.plus" s={13} />
            {allTimesSet ? 'Add all to Calendar' : 'Set all times to continue'}
          </Button>
        </div>
      )}

      <FootBar
        left={<span className="text-muted-foreground/60 text-[11.5px]">esc to cancel</span>}
        right={
          <span className="text-[11px] text-muted-foreground/60 flex items-center gap-1">
            <Kbd>↵</Kbd> add
          </span>
        }
      />
    </Pop>
  )
}

// ── Row with optional inline time picker ──────────────────────────────────────
function ParsedRowWithPicker({ title, when, ctx, hasTime, onTimeSet, onAdd }) {
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
        {/* Status dot */}
        <div className={cn(
          'size-3.5 rounded-full shrink-0 border-[1.5px] inline-flex items-center justify-center',
          hasTime ? 'border-ring/40 bg-accent/40' : 'border-border bg-transparent',
        )}>
          {hasTime && <div className="size-1.5 rounded-full bg-ring" />}
        </div>

        <div className="flex-1 min-w-0">
          <div className="text-[13px] font-medium text-foreground leading-[18px] truncate">{title}</div>
          <div className={cn(
            'mt-px text-[11.5px] flex items-center gap-1.5 truncate',
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

        {hasTime ? (
          <button
            onClick={onAdd}
            className="px-3 py-1 rounded-md shrink-0 bg-transparent border border-border text-foreground text-[12px] font-semibold cursor-pointer outline-none transition-all duration-160 hover:bg-accent"
          >
            Add
          </button>
        ) : (
          <button
            onClick={() => setPickerOpen(o => !o)}
            className="px-2.5 py-1 rounded-md shrink-0 bg-secondary border border-border text-foreground text-[11px] font-medium cursor-pointer outline-none flex items-center gap-1 hover:bg-accent"
          >
            <Icon n="clock" s={10} className="text-muted-foreground" />
            Set time
          </button>
        )}
      </div>

      {pickerOpen && !hasTime && (
        <div className="px-2.5 pb-2.5 animate-in fade-in duration-200">
          <div className="grid grid-cols-6 gap-1 mb-1.5">
            {TIME_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => pickPreset(p.h)}
                className="h-7 rounded-md bg-secondary/50 border border-border text-foreground text-[11px] font-medium cursor-pointer outline-none transition-all duration-140 hover:bg-accent"
              >
                {p.label}
              </button>
            ))}
          </div>
          <input
            type="time"
            onChange={(e) => pickCustom(e.target.value)}
            className="w-full h-[30px] rounded-md bg-input/30 border border-border text-foreground text-[12px] px-2.5 outline-none"
          />
        </div>
      )}
    </div>
  )
}

function ParsedText({ text, dataArray }) {
  if (!text || !dataArray) return null

  const phraseMap = new Map()
  for (const d of dataArray) {
    if (d.timeText) phraseMap.set(d.timeText.toLowerCase(), 'when')
    if (d.who)      phraseMap.set(d.who.toLowerCase(),      'who')
    if (d.source)   phraseMap.set(d.source.toLowerCase(),   'source')
  }

  if (phraseMap.size === 0) {
    return <div className="text-[14px] leading-5 text-foreground pr-1">{text}</div>
  }

  const phrases  = [...phraseMap.keys()].sort((a, b) => b.length - a.length)
  const pattern  = phrases.map(m => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')
  const re       = new RegExp(`(${pattern})`, 'i')
  const parts    = text.split(re)

  return (
    <div className="text-[14px] leading-5 text-foreground pr-1">
      {parts.map((part, i) => {
        const variant = phraseMap.get(part.toLowerCase())
        return variant
          ? <SubtleChip key={i} variant={variant}>{part}</SubtleChip>
          : part
      })}
    </div>
  )
}
