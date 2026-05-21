import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Icon, Pop, Rule, Lbl, FootBar, HBtn, Toggle, Kbd, SettingRow } from '../Primitives'
import { Button } from '@/components/ui/button'

const LEAD_TIMES = [1, 5, 10, 15, 30]

export function SettingsScreen({ state, dispatch }) {
  const { settings } = state
  const [autoLaunch, setAutoLaunch] = useState(false)
  const [connecting, setConnecting] = useState(false)

  useEffect(() => {
    window.api.getAutoLaunch().then(setAutoLaunch).catch(() => {})
  }, [])
  const [connectError, setConnectError] = useState(null)

  const set = (key, value) => {
    dispatch({ type: 'SET_SETTING', key, value })
    window.api.storeSet(`settings.${key}`, value).catch(() => {})
  }

  const handleAutoLaunch = async (val) => {
    setAutoLaunch(val)
    await window.api.setAutoLaunch(val)
  }

  const handleConnect = async () => {
    setConnecting(true)
    setConnectError(null)
    try {
      const { connected, email } = await window.api.connectCalendar()
      if (connected) {
        dispatch({ type: 'SET_SETTING', key: 'calendarConnected', value: true })
        dispatch({ type: 'SET_SETTING', key: 'calendarEmail', value: email })
      }
    } catch (err) {
      setConnectError('Connection failed — try again')
      console.error('[settings] connect error:', err.message)
    } finally {
      setConnecting(false)
    }
  }

  const handleDisconnect = async () => {
    await window.api.disconnectCalendar()
    dispatch({ type: 'SET_SETTING', key: 'calendarConnected', value: false })
    dispatch({ type: 'SET_SETTING', key: 'calendarEmail', value: null })
  }

  return (
    <Pop>
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 pt-3 pb-2.5">
        <div className="flex items-center gap-2">
          <HBtn icon="chevron.left" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'idle' })} />
          <span className="text-sm font-bold tracking-tight text-foreground">
            Settings
          </span>
        </div>
        <HBtn icon="xmark" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'idle' })} />
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden">
        {/* Capture */}
        <Lbl>Capture</Lbl>
        <SettingRow
          title="Global hotkey"
          sub="Open from anywhere"
          control={
            <div className="flex gap-0.5">
              <Kbd>⌘</Kbd><Kbd>⇧</Kbd><Kbd>R</Kbd>
            </div>
          }
        />
        <SettingRow
          title="Auto-parse"
          sub="Detect time, person and source"
          control={<Toggle on={settings.autoParse ?? true} onChange={(v) => set('autoParse', v)} />}
        />
        <SettingRow
          title="Launch at login"
          sub="Keep Relo in menu bar always"
          control={<Toggle on={autoLaunch} onChange={handleAutoLaunch} />}
        />

        <Rule />

        {/* Connections */}
        <Lbl>Connections</Lbl>
        <SettingRow
          title="Google Calendar"
          sub={
            settings.calendarConnected
              ? (settings.calendarEmail ?? 'Connected')
              : connectError ?? 'Not connected'
          }
          control={
            settings.calendarConnected ? (
              <div className="flex items-center gap-2">
                <Icon n="checkmark.circle" s={15} className="text-ring" />
                <ConnectBtn variant="ghost" onClick={handleDisconnect}>Disconnect</ConnectBtn>
              </div>
            ) : (
              <ConnectBtn onClick={handleConnect} disabled={connecting}>
                {connecting ? 'Opening…' : 'Connect'}
              </ConnectBtn>
            )
          }
        />
        <SettingRow
          title="Slack"
          sub="Label only — deep-link coming soon"
          control={
            <span className="text-xs font-medium text-muted-foreground/60 bg-secondary/50 border border-border rounded px-1.5 py-0.5">
              Label
            </span>
          }
        />

        <Rule />

        {/* Reminders */}
        <Lbl>Reminders</Lbl>
        <SettingRow
          title="Notification lead time"
          sub="How early to fire the reminder"
          control={
            <LeadTimePicker
              value={settings.leadTimeMinutes}
              onChange={(v) => set('leadTimeMinutes', v)}
            />
          }
        />
        <SettingRow
          title="Auto-focus source app"
          sub="Jump to Slack, Linear, etc. on notification"
          control={
            <Toggle
              on={settings.autoFocus ?? true}
              onChange={(v) => set('autoFocus', v)}
            />
          }
        />
      </div>

      <FootBar
        left={<span className="text-muted-foreground/50 text-xs">Relo v1.0</span>}
      />
    </Pop>
  )
}

function ConnectBtn({ onClick, children, disabled = false, variant = 'filled' }) {
  return (
    <Button
      size="xs"
      variant={variant === 'ghost' ? 'ghost' : 'secondary'}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      className={cn(
        'h-[23px] text-xs',
        variant === 'ghost' && 'text-muted-foreground',
      )}
    >
      {children}
    </Button>
  )
}

function LeadTimePicker({ value, onChange }) {
  return (
    <div className="flex gap-0.5">
      {LEAD_TIMES.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          className={cn(
            'h-[22px] px-1.5 rounded-md text-xs font-medium cursor-pointer outline-none transition-all duration-140',
            value === t
              ? 'bg-accent border border-ring/30 text-accent-foreground'
              : 'bg-secondary/50 border border-border text-muted-foreground hover:text-foreground hover:bg-accent',
          )}
        >
          {t}m
        </button>
      ))}
    </div>
  )
}
