import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Icon, Pop, PopHead, FootBar } from '../Primitives'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'

const PRESETS = [
  { label: '8 AM',  h: 8,  m: 0  },
  { label: '9 AM',  h: 9,  m: 0  },
  { label: '10 AM', h: 10, m: 0  },
  { label: '11 AM', h: 11, m: 0  },
  { label: '12 PM', h: 12, m: 0  },
  { label: '1 PM',  h: 13, m: 0  },
  { label: '2 PM',  h: 14, m: 0  },
  { label: '3 PM',  h: 15, m: 0  },
  { label: '4 PM',  h: 16, m: 0  },
  { label: '5 PM',  h: 17, m: 0  },
  { label: '6 PM',  h: 18, m: 0  },
  { label: 'EOD',   h: 17, m: 30 },
]

export function AmbiguousScreen({ state, dispatch }) {
  const [selected, setSelected]   = useState(null)
  const [dayOffset, setDayOffset] = useState(state.parsedData?.[0]?.dayOffset ?? 0)

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') dispatch({ type: 'RESET' }) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [dispatch])

  const buildISO = (h, m, offset) => {
    const dt = new Date()
    dt.setDate(dt.getDate() + offset)
    dt.setHours(h, m, 0, 0)
    return dt.toISOString()
  }

  const pickPreset = (preset) => {
    setSelected(preset.label)
    dispatch({ type: 'PICK_TIME', isoTime: buildISO(preset.h, preset.m, dayOffset) })
  }

  const pickCustom = (val) => {
    if (!val) return
    const [h, m] = val.split(':').map(Number)
    setSelected('custom')
    dispatch({ type: 'PICK_TIME', isoTime: buildISO(h, m, dayOffset) })
  }

  const switchDay = (val) => {
    setDayOffset(val)
    setSelected(null)
  }

  return (
    <Pop>
      <PopHead onSettings={() => dispatch({ type: 'SET_SCREEN', screen: 'settings' })} />

      {/* Text preview */}
      <div className="px-3.5 py-3">
        <div className="text-[14px] leading-5 text-muted-foreground truncate">
          {state.inputText}
        </div>
      </div>

      <div className="h-px mx-0 bg-border" />

      {/* Section label */}
      <div className="px-3.5 pt-3 pb-2.5 flex items-center gap-1.5">
        <Icon n="clock" s={11} className="text-muted-foreground/60" />
        <span className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-muted-foreground/60">
          When should this happen?
        </span>
      </div>

      {/* Today / Tomorrow */}
      <div className="px-3.5 pb-2.5">
        <Tabs value={String(dayOffset)} onValueChange={(v) => switchDay(Number(v))}>
          <TabsList className="w-full">
            <TabsTrigger value="0" className="flex-1">Today</TabsTrigger>
            <TabsTrigger value="1" className="flex-1">Tomorrow</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Time grid */}
      <div className="px-3.5 pb-2.5">
        <div className="grid grid-cols-4 gap-1.5">
          {PRESETS.map(preset => (
            <button
              key={preset.label}
              onClick={() => pickPreset(preset)}
              className={cn(
                'h-[34px] rounded-lg text-[12.5px] font-medium cursor-pointer outline-none',
                'border transition-all duration-150',
                selected === preset.label
                  ? 'bg-accent border-ring/40 text-accent-foreground'
                  : 'bg-secondary/50 border-border text-foreground hover:bg-accent',
              )}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom time input */}
      <div className="px-3.5 pb-3.5">
        <input
          type="time"
          onChange={(e) => pickCustom(e.target.value)}
          className={cn(
            'w-full h-[34px] rounded-lg text-[13px] px-3 outline-none',
            'border transition-all duration-150',
            selected === 'custom'
              ? 'bg-accent border-ring/40 text-accent-foreground'
              : 'bg-secondary/50 border-border text-foreground',
          )}
        />
      </div>

      <FootBar
        left={<span className="text-muted-foreground/70">Pick a time to continue</span>}
        right={<span className="text-[11.5px] text-muted-foreground/60">esc to cancel</span>}
      />
    </Pop>
  )
}
