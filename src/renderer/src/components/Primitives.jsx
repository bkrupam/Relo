import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { Card } from '@/components/ui/card'
import {
  RefreshCw, Settings, ChevronLeft, ChevronRight, X,
  Search, Plus, ArrowUp, Clock, Calendar, CalendarPlus,
  Check, CircleCheck, CircleX, AlertCircle, AlertTriangle,
  Bell, Link, User,
} from 'lucide-react'

// ── Icon registry ─────────────────────────────────────────────────────────────
const ICONS = {
  'arrow.clockwise':          RefreshCw,
  'gearshape':                Settings,
  'chevron.left':             ChevronLeft,
  'chevron.right':            ChevronRight,
  'xmark':                    X,
  'magnifying':               Search,
  'plus':                     Plus,
  'arrow.up':                 ArrowUp,
  'clock':                    Clock,
  'calendar':                 Calendar,
  'calendar.badge.plus':      CalendarPlus,
  'check':                    Check,
  'checkmark.circle':         CircleCheck,
  'xmark.circle':             CircleX,
  'exclamationmark.circle':   AlertCircle,
  'exclamationmark.triangle': AlertTriangle,
  'bell':                     Bell,
  'link':                     Link,
  'person':                   User,
}

export function Icon({ n, s = 16, className, ...rest }) {
  const Comp = ICONS[n]
  if (!Comp) return null
  return (
    <Comp
      style={{ width: s, height: s }}
      className={className}
      strokeWidth={1.5}
      {...rest}
    />
  )
}

// ── Glass popover shell ───────────────────────────────────────────────────────
export function Pop({ children }) {
  return (
    <div className={cn(
      'relative flex flex-col w-full h-full overflow-hidden',
      'bg-background/90 backdrop-blur-2xl',
      'border border-border rounded-[var(--radius)]',
      'text-foreground shadow-2xl shadow-black/30',
    )}>
      {children}
    </div>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────
export function PopHead({ title = 'Relo', right, onRefresh, onSettings }) {
  return (
    <div className="flex items-center justify-between px-3.5 pt-3 pb-2.5">
      <span className="text-sm font-bold tracking-tight text-foreground">
        {title}
      </span>
      <div className="flex items-center gap-0.5 text-muted-foreground">
        {right ?? (
          <>
            <HBtn icon="arrow.clockwise" onClick={onRefresh} />
            <HBtn icon="gearshape" onClick={onSettings} />
          </>
        )}
      </div>
    </div>
  )
}

// ── Composer field ────────────────────────────────────────────────────────────
export function Field({ children, focused = true, minHeight = 88, onClick }) {
  return (
    <div className="px-3 pb-3">
      <div
        onClick={onClick}
        className={cn(
          'relative rounded-lg bg-input/30 border transition-all duration-200',
          'px-3 py-2.5 pr-10',
          focused
            ? 'border-ring ring-2 ring-ring/20'
            : 'border-border',
          onClick && 'cursor-text',
        )}
        style={{ minHeight }}
      >
        {children}
      </div>
    </div>
  )
}

// ── Send button ───────────────────────────────────────────────────────────────
export function SendBtn({ state = 'ready', onClick }) {
  const disabled = state === 'disabled'
  const loading  = state === 'loading'

  return (
    <button
      onClick={disabled || loading ? undefined : onClick}
      className={cn(
        'absolute right-1.5 bottom-1.5 size-7 rounded-md',
        'inline-flex items-center justify-center transition-all duration-150',
        'border outline-none',
        disabled || loading
          ? 'bg-secondary/50 border-border text-muted-foreground cursor-default'
          : 'bg-primary border-ring/30 text-primary-foreground cursor-pointer hover:bg-primary/90',
      )}
    >
      {loading ? (
        <span className="size-2.5 rounded-full border-[1.4px] border-current border-t-transparent animate-spin" />
      ) : (
        <Icon n="arrow.up" s={13} />
      )}
    </button>
  )
}

// ── Inline entity chip — uses Badge, monochromatic mist tokens ────────────────
export function SubtleChip({ children, variant }) {
  return (
    <Badge
      variant="secondary"
      className="rounded px-1.5 py-px text-[13px] font-medium leading-[18px] align-baseline mx-[-1px] gap-1.5"
    >
      {children}
    </Badge>
  )
}

// ── Reminder row ──────────────────────────────────────────────────────────────
export function Row({ title, when, ctx, done = false, urgent = false, onToggle, onDelete }) {
  return (
    <div
      className="reminder-row flex gap-2.5 px-2.5 py-1.5 cursor-default"
      onContextMenu={(e) => { e.preventDefault(); onDelete?.() }}
    >
      <button
        onClick={onToggle}
        className={cn(
          'size-3.5 rounded-full mt-0.5 shrink-0 inline-flex items-center justify-center cursor-pointer p-0 outline-none border transition-colors',
          done
            ? 'bg-primary border-primary'
            : urgent
              ? 'bg-transparent border-ring'
              : 'bg-transparent border-border',
        )}
      >
        {done && <Icon n="check" s={9} className="text-primary-foreground" />}
      </button>

      <div className="flex-1 min-w-0">
        <div className={cn(
          'text-[13px] font-medium text-foreground leading-[18px] truncate',
          done && 'line-through opacity-50',
        )}>
          {title}
        </div>
        <div className="mt-px text-[11.5px] text-muted-foreground flex items-center gap-1.5 truncate">
          <Icon n="clock" s={10} className="text-muted-foreground/50 shrink-0" />
          <span>{when}</span>
          {ctx && (
            <>
              <span className="opacity-40">·</span>
              <span className="truncate text-muted-foreground/50">{ctx}</span>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Parsed item row ───────────────────────────────────────────────────────────
export function ParsedRow({ title, when, ctx, onAdd }) {
  return (
    <div className="reminder-row flex gap-2.5 px-2.5 py-1.5 items-center cursor-default">
      <div className="size-3.5 rounded-full border border-ring/40 inline-flex items-center justify-center shrink-0">
        <div className="size-1.5 rounded-full bg-ring/40" />
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[13px] font-medium text-foreground leading-[18px] truncate">{title}</div>
        <div className="mt-px text-[11.5px] text-muted-foreground flex items-center gap-1.5 truncate">
          <Icon n="clock" s={10} className="text-muted-foreground/50 shrink-0" />
          <span>{when}</span>
          {ctx && (
            <>
              <span className="opacity-40">·</span>
              <span className="truncate text-muted-foreground/50">{ctx}</span>
            </>
          )}
        </div>
      </div>

      <Button variant="outline" size="xs" onClick={onAdd} className="shrink-0">
        Add
      </Button>
    </div>
  )
}

// ── Footer bar ────────────────────────────────────────────────────────────────
export function FootBar({ left, right }) {
  return (
    <div className="border-t border-border px-3.5 py-2.5 flex items-center justify-between bg-background/60 shrink-0 mt-auto">
      <span className="text-[12px] text-muted-foreground inline-flex items-center gap-1.5 font-medium">
        {left}
      </span>
      {right}
    </div>
  )
}

// ── Divider ───────────────────────────────────────────────────────────────────
export function Rule() {
  return <Separator className="mx-3.5" />
}

// ── Section label ─────────────────────────────────────────────────────────────
export function Lbl({ children, action }) {
  return (
    <div className="flex items-center justify-between px-4 pt-2.5 pb-1.5">
      <span className="text-[10.5px] font-semibold tracking-[0.08em] uppercase text-muted-foreground/50">
        {children}
      </span>
      {action}
    </div>
  )
}

// ── Icon button ───────────────────────────────────────────────────────────────
export function HBtn({ icon, onClick, active = false }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      className={cn(
        'text-muted-foreground',
        active && 'bg-accent text-accent-foreground',
      )}
    >
      <Icon n={icon} s={16} />
    </Button>
  )
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({ on = false, onChange }) {
  return <Switch checked={on} onCheckedChange={onChange} />
}

// ── Keyboard key ──────────────────────────────────────────────────────────────
export function Kbd({ children }) {
  return (
    <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded bg-secondary border border-border text-[10.5px] font-mono text-muted-foreground">
      {children}
    </kbd>
  )
}

// ── Settings row ──────────────────────────────────────────────────────────────
export function SettingRow({ title, sub, control }) {
  return (
    <div className="flex items-center justify-between px-3.5 py-2 gap-2.5">
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] font-medium text-foreground">{title}</div>
        {sub && <div className="text-[11px] text-muted-foreground mt-px">{sub}</div>}
      </div>
      <div className="shrink-0">{control}</div>
    </div>
  )
}

// ── Segmented control ─────────────────────────────────────────────────────────
export function SegControl({ options, value, onChange }) {
  return (
    <div className="flex gap-0.5 p-0.5 rounded-lg bg-secondary/70 border border-border">
      {options.map(opt => {
        const active = value === opt.value
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              'flex-1 h-[28px] rounded-md text-[12px] font-medium cursor-pointer outline-none transition-all duration-150',
              active
                ? 'bg-accent text-accent-foreground shadow-sm'
                : 'bg-transparent text-muted-foreground hover:text-foreground',
            )}
          >
            {opt.label}
          </button>
        )
      })}
    </div>
  )
}

// ── Glass card ────────────────────────────────────────────────────────────────
export function GlassCard({ children, className, strong = false }) {
  return (
    <Card className={cn(
      'rounded-lg border-border',
      strong ? 'bg-card' : 'bg-secondary/50',
      className,
    )}>
      {children}
    </Card>
  )
}

// ── Action button ─────────────────────────────────────────────────────────────
export function ActionBtn({ icon, children, onClick }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="flex-1 h-[26px] text-[11.5px]">
      {icon && <Icon n={icon} s={11} />}
      {children}
    </Button>
  )
}

// ── "View all" link button ────────────────────────────────────────────────────
export function ViewAllBtn({ onClick }) {
  return (
    <Button variant="outline" size="sm" onClick={onClick} className="gap-1.5 px-4 text-muted-foreground">
      View all
      <Icon n="chevron.right" s={11} />
    </Button>
  )
}
