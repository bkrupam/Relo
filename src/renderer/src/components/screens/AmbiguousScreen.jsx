import { useState, useEffect } from 'react'
import { T } from '../../tokens'
import { SF } from '../icons/SF'
import { Pop, PopHead, FootBar, SegControl } from '../Primitives'

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
      <div style={{ padding: '12px 14px' }}>
        <div style={{
          fontSize: 14, lineHeight: '20px', color: T.textSoft,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {state.inputText}
        </div>
      </div>

      <div style={{ height: 1, background: T.divider }} />

      {/* Section label */}
      <div style={{ padding: '12px 14px 10px', display: 'flex', alignItems: 'center', gap: 7 }}>
        <SF n="clock" s={11} w={1.5} c={T.textMuted} />
        <span style={{
          fontSize: 10.5, fontWeight: 600,
          letterSpacing: '0.08em', textTransform: 'uppercase',
          color: T.textMuted,
        }}>
          When should this happen?
        </span>
      </div>

      {/* Today / Tomorrow */}
      <div style={{ padding: '0 14px 10px' }}>
        <SegControl
          options={[{ label: 'Today', value: 0 }, { label: 'Tomorrow', value: 1 }]}
          value={dayOffset}
          onChange={switchDay}
        />
      </div>

      {/* Time grid */}
      <div style={{ padding: '0 14px 10px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 5 }}>
          {PRESETS.map(preset => (
            <button
              key={preset.label}
              onClick={() => pickPreset(preset)}
              style={{
                height: 34, borderRadius: 8,
                background: selected === preset.label ? T.accentSoft : 'rgba(255,255,255,0.055)',
                border: `1px solid ${selected === preset.label ? T.accentBorder : 'rgba(255,255,255,0.08)'}`,
                color: selected === preset.label ? T.accentText : T.text,
                fontSize: 12.5, fontWeight: 500,
                cursor: 'pointer', fontFamily: T.font,
                outline: 'none',
                transition: 'background 140ms ease, border-color 140ms ease, color 140ms ease',
              }}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      {/* Custom time input */}
      <div style={{ padding: '0 14px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
        <input
          type="time"
          onChange={(e) => pickCustom(e.target.value)}
          style={{
            flex: 1, height: 34, borderRadius: 8,
            background: selected === 'custom' ? T.accentSoft : 'rgba(255,255,255,0.055)',
            border: `1px solid ${selected === 'custom' ? T.accentBorder : 'rgba(255,255,255,0.08)'}`,
            color: selected === 'custom' ? T.accentText : T.text,
            fontSize: 13, padding: '0 11px',
            fontFamily: T.font, outline: 'none',
            colorScheme: 'dark',
          }}
        />
        <span style={{ fontSize: 12, color: T.textMuted, whiteSpace: 'nowrap' }}>or pick above</span>
      </div>

      <FootBar
        left={<span style={{ color: T.textMuted }}>Pick a time to continue</span>}
        right={<span style={{ fontSize: 11.5, color: T.textMuted }}>esc to cancel</span>}
      />
    </Pop>
  )
}
