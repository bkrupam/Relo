import { T } from '../tokens'
import { SF } from './icons/SF'

// ── Glass popover shell ───────────────────────────────────────────────────────
export function Pop({ children }) {
  return (
    <div style={{
      width: '100%',
      height: '100%',
      position: 'relative',
      background: T.popoverBg,
      backdropFilter: 'blur(36px) saturate(170%)',
      WebkitBackdropFilter: 'blur(36px) saturate(170%)',
      border: `1px solid ${T.glassBorder}`,
      borderRadius: T.radius,
      boxShadow: T.popoverShadow,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      color: T.text,
      fontFamily: T.font,
    }}>
      {children}
    </div>
  )
}

// ── Header (no bottom border — kept airy) ────────────────────────────────────
export function PopHead({ title = 'Relo', right, onRefresh, onSettings }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 14px 10px',
    }}>
      <span style={{
        fontSize: 14, fontWeight: 700,
        letterSpacing: '-0.02em',
        color: T.text,
      }}>
        {title}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: T.textSoft }}>
        {right ?? (
          <>
            <RefreshBtn onClick={onRefresh} />
            <HBtn icon="gearshape" onClick={onSettings} />
          </>
        )}
      </div>
    </div>
  )
}

// ── Refresh button — icon + label ────────────────────────────────────────────
function RefreshBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="icon-btn"
      style={{
        height: 28, padding: '0 8px 0 6px', borderRadius: 6,
        border: 'none',
        background: 'transparent',
        color: T.textSoft,
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 5,
        outline: 'none',
        fontSize: 12, fontWeight: 500, fontFamily: T.font,
      }}
    >
      <SF n="arrow.clockwise" s={14} w={1.6} />
      <span>Refresh</span>
    </button>
  )
}

// ── Composer field ────────────────────────────────────────────────────────────
export function Field({ children, focused = true, minHeight = 88, onClick }) {
  return (
    <div style={{ padding: '0 12px 12px' }}>
      <div
        onClick={onClick}
        style={{
          position: 'relative',
          background: T.fieldFill,
          border: `1px solid ${focused ? T.fieldFocusBorder : T.fieldBorder}`,
          borderRadius: T.radiusMd,
          padding: '11px 40px 11px 13px',
          minHeight,
          boxShadow: focused ? T.accentRing : 'inset 0 1px 2px rgba(0,0,0,0.1)',
          transition: 'all 200ms cubic-bezier(0.16, 1, 0.3, 1)',
          cursor: onClick ? 'text' : 'default',
        }}
      >
        {children}
      </div>
    </div>
  )
}

// ── Send button — monochrome ──────────────────────────────────────────────────
export function SendBtn({ state = 'ready', onClick }) {
  const disabled = state === 'disabled'
  const loading  = state === 'loading'

  return (
    <button
      onClick={disabled || loading ? undefined : onClick}
      style={{
        position: 'absolute', right: 6, bottom: 6,
        width: 28, height: 28, borderRadius: 7,
        background: disabled ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${disabled ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.12)'}`,
        color: disabled ? T.textMuted : T.text,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        cursor: disabled || loading ? 'default' : 'pointer',
        transition: 'all 140ms ease',
        flexShrink: 0,
        outline: 'none',
      }}
    >
      {loading
        ? <span style={{
            width: 11, height: 11,
            border: '1.4px solid currentColor',
            borderTopColor: 'transparent',
            borderRadius: 99,
            display: 'inline-block',
          }} className="animate-spin-sm" />
        : <SF n="arrow.up" s={13} w={1.6} />
      }
    </button>
  )
}

// ── Inline entity chip — subtle, monochrome (or accent when active) ──────────
const CHIP_VARIANTS = {
  // who — green
  who:    { bg: 'rgba(74,222,128,0.13)', border: 'rgba(74,222,128,0.30)', color: 'rgb(74,222,128)' },
  // when — pink
  when:   { bg: 'rgba(251,113,133,0.13)', border: 'rgba(251,113,133,0.30)', color: 'rgb(251,113,133)' },
  // source — blue (existing accent)
  source: { bg: T.accentSoft, border: T.accentBorder, color: T.accentText },
}

export function SubtleChip({ children, active = false, variant }) {
  const v = variant ? CHIP_VARIANTS[variant] : null
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      padding: '1px 5px', margin: '0 -1px',
      borderRadius: T.radiusChip,
      background: v ? v.bg : active ? T.accentSoft : 'rgba(255,255,255,0.05)',
      color:      v ? v.color  : active ? T.accentText : T.text,
      border:     `1px solid ${v ? v.border : active ? T.accentBorder : 'rgba(255,255,255,0.08)'}`,
      fontSize: 13, fontWeight: 500,
      lineHeight: '18px', verticalAlign: 'baseline',
    }}>
      {children}
    </span>
  )
}

// ── Reminder row ──────────────────────────────────────────────────────────────
export function Row({ title, when, ctx, done = false, urgent = false, onToggle, onDelete }) {
  return (
    <div
      className="reminder-row"
      onContextMenu={(e) => { e.preventDefault(); onDelete?.() }}
      style={{
        display: 'flex', gap: 10, padding: '7px 10px',
        borderRadius: T.radiusSm, alignItems: 'flex-start',
        cursor: 'default',
      }}
    >
      <button
        onClick={onToggle}
        style={{
          width: 14, height: 14, borderRadius: 99,
          marginTop: 2, flexShrink: 0,
          border: `1.3px solid ${urgent ? T.accentText : 'rgba(255,255,255,0.30)'}`,
          background: done ? T.accent : 'transparent',
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
          cursor: 'pointer', padding: 0,
          outline: 'none',
        }}
      >
        {done && <SF n="check" s={9} w={2} c={T.accentText} />}
      </button>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 500, color: T.text,
          lineHeight: '18px',
          textDecoration: done ? 'line-through' : 'none',
          opacity: done ? 0.5 : 1,
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {title}
        </div>
        <div style={{
          marginTop: 1, fontSize: 11.5, color: T.textSoft,
          display: 'flex', alignItems: 'center', gap: 6,
          whiteSpace: 'nowrap', overflow: 'hidden',
        }}>
          <SF n="clock" s={10} w={1.4} c={T.textMuted} />
          <span>{when}</span>
          {ctx && (
            <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', color: T.textMuted }}>{ctx}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Parsed item row (used in ParsedScreen) ────────────────────────────────────
export function ParsedRow({ title, when, ctx, onAdd }) {
  return (
    <div
      className="reminder-row"
      style={{
        display: 'flex', gap: 10, padding: '7px 10px',
        borderRadius: T.radiusSm, alignItems: 'center',
        cursor: 'default',
      }}
    >
      <div style={{
        width: 14, height: 14, borderRadius: 99,
        border: `1.3px solid ${T.accentBorder}`,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <div style={{ width: 6, height: 6, borderRadius: 99, background: T.accentSoft }} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 500, color: T.text,
          lineHeight: '18px',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {title}
        </div>
        <div style={{
          marginTop: 1, fontSize: 11.5, color: T.textSoft,
          display: 'flex', alignItems: 'center', gap: 6,
          whiteSpace: 'nowrap', overflow: 'hidden',
        }}>
          <SF n="clock" s={10} w={1.4} c={T.textMuted} />
          <span>{when}</span>
          {ctx && (
            <>
              <span style={{ opacity: 0.4 }}>·</span>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', color: T.textMuted }}>{ctx}</span>
            </>
          )}
        </div>
      </div>
      
      <button
        onClick={onAdd}
        className="action-btn"
        style={{
          padding: '4px 8px', borderRadius: 5,
          background: 'rgba(255,255,255,0.08)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: T.text, fontSize: 11, fontWeight: 500,
          cursor: 'pointer', fontFamily: T.font,
          flexShrink: 0,
        }}
      >
        Add
      </button>
    </div>
  )
}

// ── Footer bar ────────────────────────────────────────────────────────────────
export function FootBar({ left, right }) {
  return (
    <div style={{
      borderTop: `1px solid ${T.divider}`,
      padding: '9px 10px 9px 14px',
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: T.footerBg,
      marginTop: 'auto',
      flexShrink: 0,
    }}>
      <span style={{
        fontSize: 12.5, color: T.textSoft,
        display: 'inline-flex', alignItems: 'center', gap: 6,
        fontWeight: 500,
      }}>
        {left}
      </span>
      {right}
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Rule() {
  return <div style={{ height: 1, margin: '0 14px', background: T.divider }} />
}

// ── Section label ─────────────────────────────────────────────────────────────
export function Lbl({ children, action }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '12px 16px 8px',
    }}>
      <span style={{
        fontSize: 10.5, fontWeight: 600,
        letterSpacing: '0.08em', textTransform: 'uppercase',
        color: T.textMuted,
      }}>
        {children}
      </span>
      {action}
    </div>
  )
}

// ── Icon button — small monochrome ───────────────────────────────────────────
export function HBtn({ icon, onClick, active = false }) {
  return (
    <button
      onClick={onClick}
      className="icon-btn"
      style={{
        width: 30, height: 30, borderRadius: 7,
        border: '1px solid transparent',
        background: active ? 'rgba(255,255,255,0.10)' : 'transparent',
        color: active ? T.text : T.textSoft,
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
        outline: 'none',
        transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      <SF n={icon} s={16} w={1.5} />
    </button>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({ on = false, onChange }) {
  return (
    <div
      onClick={() => onChange?.(!on)}
      style={{
        width: 32, height: 20, borderRadius: 99,
        background: on ? T.accent : 'rgba(255,255,255,0.15)',
        position: 'relative', cursor: 'pointer',
        flexShrink: 0,
        transition: 'background 250ms cubic-bezier(0.16, 1, 0.3, 1)',
        boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.2)',
      }}
    >
      <div style={{
        position: 'absolute', top: 2, left: on ? 14 : 2,
        width: 16, height: 16, borderRadius: 99,
        background: '#fff',
        boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
        transition: 'left 250ms cubic-bezier(0.16, 1, 0.3, 1)',
      }} />
    </div>
  )
}

// ── Keyboard key ──────────────────────────────────────────────────────────────
export function Kbd({ children }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
      minWidth: 18, height: 18, padding: '0 4px',
      borderRadius: 4,
      background: 'rgba(255,255,255,0.06)',
      border: '1px solid rgba(255,255,255,0.10)',
      fontSize: 10.5, fontFamily: T.mono, color: T.text,
    }}>
      {children}
    </span>
  )
}

// ── Settings row ──────────────────────────────────────────────────────────────
export function SettingRow({ title, sub, control }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '9px 14px', gap: 10,
    }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 12.5, fontWeight: 500, color: T.text }}>{title}</div>
        {sub && <div style={{ fontSize: 11, color: T.textSoft, marginTop: 1 }}>{sub}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  )
}

// ── Segmented control ─────────────────────────────────────────────────────────
export function SegControl({ options, value, onChange }) {
  return (
    <div style={{
      display: 'flex', gap: 2, padding: 2,
      borderRadius: 7, background: T.segBg,
      border: `1px solid ${T.fieldBorder}`,
    }}>
      {options.map(opt => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            style={{
              flex: 1, height: 22, borderRadius: 5,
              background: active ? 'rgba(255,255,255,0.08)' : 'transparent',
              boxShadow: active ? 'inset 0 0 0 0.5px rgba(255,255,255,0.10)' : 'none',
              border: 'none',
              color: active ? T.text : T.textSoft,
              fontSize: 11, fontWeight: 500, cursor: 'pointer',
              fontFamily: T.font,
              transition: 'all 150ms ease',
              outline: 'none',
            }}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Glass card — subtle light fill ───────────────────────────────────────────
export function GlassCard({ children, style, strong = false }) {
  return (
    <div style={{
      borderRadius: T.radiusMd,
      background: strong ? T.cardFillStrong : T.cardFill,
      border: `1px solid ${T.cardBorder}`,
      ...style,
    }}>
      {children}
    </div>
  )
}

// ── Action button — small monochrome ─────────────────────────────────────────
export function ActionBtn({ icon, children, onClick }) {
  return (
    <button
      onClick={onClick}
      className="action-btn"
      style={{
        flex: 1, height: 26, borderRadius: 6,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.12)',
        color: T.text, fontSize: 11.5, fontWeight: 500,
        cursor: 'pointer', fontFamily: T.font,
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 5,
        outline: 'none',
      }}
    >
      {icon && <SF n={icon} s={11} w={1.4} />}
      {children}
    </button>
  )
}

// ── "View all" link button (footer right) ───────────────────────────────────
export function ViewAllBtn({ onClick }) {
  return (
    <button
      onClick={onClick}
      className="view-all-btn"
      style={{
        height: 26, padding: '0 10px', borderRadius: 6,
        fontSize: 12, fontWeight: 500,
        background: 'rgba(255,255,255,0.04)',
        color: T.textSoft,
        border: '1px solid rgba(255,255,255,0.10)',
        cursor: 'pointer',
        display: 'inline-flex', alignItems: 'center', gap: 5,
        fontFamily: T.font, outline: 'none',
        transition: 'all 180ms cubic-bezier(0.4, 0, 0.2, 1)',
      }}
    >
      View all
      <SF n="chevron.right" s={11} w={1.6} c={T.textSoft} />
    </button>
  )
}
