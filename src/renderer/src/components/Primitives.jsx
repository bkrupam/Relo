import { useState } from 'react'
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
      'popover-shell relative flex flex-col w-full h-full overflow-hidden',
      'bg-background/90 backdrop-blur-2xl',
      'border border-border rounded-[var(--radius)]',
      'text-foreground',
    )}>
      {children}
    </div>
  )
}

// ── Header ────────────────────────────────────────────────────────────────────
export function PopHead({ title = 'Relo', right, onRefresh, onSettings }) {
  const [refreshing, setRefreshing] = useState(false)

  const handleRefresh = async () => {
    if (refreshing) return
    setRefreshing(true)
    const minSpin = new Promise((r) => setTimeout(r, 600))
    try {
      await Promise.all([onRefresh?.() ?? Promise.resolve(), minSpin])
    } finally {
      setRefreshing(false)
    }
  }

  return (
    <div className="flex items-center justify-between px-3.5 pt-3 pb-2.5">
      <span className="text-sm font-bold tracking-tight text-foreground">
        {title}
      </span>
      <div className="flex items-center gap-0.5 text-muted-foreground">
        {right ?? (
          <>
            <HBtn icon="arrow.clockwise" onClick={handleRefresh} spinning={refreshing} />
            <HBtn icon="gearshape" onClick={onSettings} />
          </>
        )}
      </div>
    </div>
  )
}

// ── Composer (idle + typing — one shell) ────────────────────────────────────
export function Composer({
  children,
  focused = true,
  minHeight = 88,
  onClick,
  footer,
  className,
  reading = false,
  error = null,
  sendState = 'disabled',
  onSend,
}) {
  const showStatus = reading || !!error

  return (
    <div className={cn('px-3.5 pb-3', className)}>
      <div
        onClick={onClick}
        className={cn(
          'relative rounded-lg bg-input/30 transition-colors duration-200',
          'box-border border px-3 py-2.5 pr-11',
          focused
            ? 'border-ring/55 shadow-[inset_0_0_0_1px_oklch(1_0_0/6%)]'
            : 'border-border',
          onClick && 'cursor-text',
        )}
        style={{ minHeight }}
      >
        <div className={cn(showStatus && 'pb-7')}>{children}</div>

        {showStatus && (
          <div className="absolute left-2.5 bottom-2 right-11 z-10 pointer-events-none">
            <div className="inline-flex max-w-full items-center rounded-md border border-border/70 bg-background/95 px-2 py-1 shadow-sm backdrop-blur-sm">
              <ComposerStatus reading={reading} error={error} />
            </div>
          </div>
        )}

        <SendBtn state={sendState} onClick={onSend} />
      </div>
      {footer}
    </div>
  )
}

/** @deprecated alias */
export const Field = Composer

// ── Composer status (reading / error) ───────────────────────────────────────
export function ComposerStatus({ reading, error }) {
  if (!reading && !error) return null
  return (
    <div className="inline-flex items-center gap-1.5 min-w-0">
      {reading ? (
        <>
          <span
            className="size-1.5 rounded-full bg-ring shrink-0 animate-pulse-dot"
            aria-hidden
          />
          <span className="text-xs font-medium text-foreground">Reading…</span>
        </>
      ) : (
        <>
          <Icon n="exclamationmark.circle" s={12} className="text-destructive shrink-0" />
          <span
            className="text-xs font-medium text-destructive truncate"
            title={error}
          >
            {error}
          </span>
        </>
      )}
    </div>
  )
}

// ── Send button ───────────────────────────────────────────────────────────────
export function SendBtn({ state = 'ready', onClick }) {
  const disabled = state === 'disabled'
  const loading  = state === 'loading'

  return (
    <button
      type="button"
      onClick={disabled || loading ? undefined : onClick}
      disabled={disabled || loading}
      aria-label={loading ? 'Parsing' : 'Parse reminder'}
      className={cn(
        'absolute right-2 bottom-2 size-7 rounded-md shrink-0',
        'inline-flex items-center justify-center transition-all duration-150',
        'border outline-none focus-visible:ring-2 focus-visible:ring-ring/40',
        disabled || loading
          ? 'bg-secondary/50 border-border text-muted-foreground cursor-not-allowed opacity-60'
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

const CHIP_STYLES = {
  when:   'bg-accent/90 text-accent-foreground border-transparent',
  who:    'bg-secondary text-foreground border-border/60',
  source: 'bg-secondary/60 text-muted-foreground border-transparent',
}

// ── Inline entity chip ────────────────────────────────────────────────────────
export function SubtleChip({ children, variant }) {
  return (
    <Badge
      variant="secondary"
      className={cn(
        'rounded px-1.5 py-px text-sm font-medium leading-snug align-baseline mx-[-1px] gap-1.5 border',
        CHIP_STYLES[variant] ?? CHIP_STYLES.who,
      )}
    >
      {children}
    </Badge>
  )
}

// ── Empty list placeholder ────────────────────────────────────────────────────
export function EmptyState({ icon = 'calendar', message = 'Nothing due today.' }) {
  return (
    <div className="py-5 px-3 flex flex-col items-center gap-1.5">
      <Icon n={icon} s={24} className="text-muted-foreground/40" />
      <span className="text-xs text-muted-foreground/50 text-center">
        {message}
      </span>
    </div>
  )
}

// ── Confirmed reminder toast ──────────────────────────────────────────────────
export function ConfirmToast({ reminder, onDismiss, onEdit, onOpen }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-secondary/80 border border-border animate-in fade-in slide-in-from-bottom-1 duration-300">
      <div className="size-4 rounded-full shrink-0 bg-accent border border-ring/30 inline-flex items-center justify-center">
        <Icon n="check" s={8} className="text-ring" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground truncate">
          {reminder.what ?? 'Reminder'} added
        </div>
        {reminder.whenLabel && (
          <div className="text-xs text-muted-foreground mt-px truncate">
            {reminder.whenLabel}
          </div>
        )}
      </div>
      <div className="flex gap-1 shrink-0 items-center">
        {onEdit && (
          <ToastBtn onClick={onEdit}>Edit</ToastBtn>
        )}
        {onOpen && (
          <ToastBtn onClick={onOpen}>Open</ToastBtn>
        )}
        {onDismiss && (
          <button
            type="button"
            onClick={onDismiss}
            aria-label="Dismiss"
            className="size-6 rounded-md inline-flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-accent outline-none cursor-pointer"
          >
            <Icon n="xmark" s={12} />
          </button>
        )}
      </div>
    </div>
  )
}

function ToastBtn({ onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="px-2 py-[3px] rounded-md bg-transparent border border-border text-foreground text-xs font-medium cursor-pointer outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-ring/30"
    >
      {children}
    </button>
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
        type="button"
        onClick={onToggle}
        className={cn(
          'size-3.5 rounded-full mt-0.5 shrink-0 inline-flex items-center justify-center cursor-pointer p-0 outline-none border transition-colors',
          'focus-visible:ring-2 focus-visible:ring-ring/40',
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
          'text-sm font-medium text-foreground leading-snug truncate',
          done && 'line-through opacity-50',
        )}>
          {title}
        </div>
        <div className="mt-px text-xs text-muted-foreground flex items-center gap-1.5 truncate">
          <Icon n="clock" s={10} className="text-muted-foreground shrink-0" />
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
        <div className="text-sm font-medium text-foreground leading-snug truncate">{title}</div>
        <div className="mt-px text-xs text-muted-foreground flex items-center gap-1.5 truncate">
          <Icon n="clock" s={10} className="text-muted-foreground shrink-0" />
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
      <span className="text-xs text-muted-foreground inline-flex items-center gap-1.5 font-medium">
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
      <span className="text-xs font-semibold tracking-widest uppercase text-muted-foreground/50">
        {children}
      </span>
      {action}
    </div>
  )
}

// ── Icon button ───────────────────────────────────────────────────────────────
export function HBtn({ icon, onClick, active = false, spinning = false }) {
  return (
    <Button
      variant="ghost"
      size="icon-sm"
      onClick={onClick}
      disabled={spinning}
      className={cn(
        'text-muted-foreground',
        active && 'bg-accent text-accent-foreground',
      )}
    >
      <Icon
        n={icon}
        s={16}
        className={spinning ? 'animate-spin motion-reduce:animate-none' : undefined}
      />
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
    <kbd className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded bg-secondary border border-border text-xs font-mono text-muted-foreground">
      {children}
    </kbd>
  )
}

// ── Settings row ──────────────────────────────────────────────────────────────
export function SettingRow({ title, sub, control }) {
  return (
    <div className="flex items-center justify-between px-3.5 py-2 gap-2.5">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-foreground">{title}</div>
        {sub && <div className="text-xs text-muted-foreground mt-px">{sub}</div>}
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
              'flex-1 h-[28px] rounded-md text-xs font-medium cursor-pointer outline-none transition-all duration-150',
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
    <Button variant="outline" size="sm" onClick={onClick} className="flex-1 h-[26px] text-xs">
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
