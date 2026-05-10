import { useState } from 'react'
import { T } from '../../tokens'
import { SF } from '../icons/SF'
import { Pop, Rule, Lbl, FootBar, HBtn, Toggle, Kbd, SettingRow } from '../Primitives'

const LEAD_TIMES = [1, 5, 10, 15, 30]

export function SettingsScreen({ state, dispatch }) {
  const { settings } = state
  const [autoLaunch, setAutoLaunch] = useState(false)
  const [connecting, setConnecting] = useState(false)
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
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '11px 12px 9px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <HBtn icon="chevron.left" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'idle' })} />
          <span style={{ fontSize: 13.5, fontWeight: 600, letterSpacing: '-0.012em', color: T.text }}>
            Settings
          </span>
        </div>
        <HBtn icon="xmark" onClick={() => dispatch({ type: 'SET_SCREEN', screen: 'idle' })} />
      </div>

      <div style={{ flex: 1, overflow: 'hidden auto' }}>
        {/* Capture */}
        <Lbl>Capture</Lbl>
        <SettingRow
          title="Global hotkey"
          sub="Open from anywhere"
          control={
            <div style={{ display: 'flex', gap: 2 }}>
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
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <SF n="checkmark.circle" s={15} w={1.4} c={T.accent} />
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
            <span style={{
              fontSize: 10.5, fontWeight: 500, color: T.textMuted,
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.09)',
              borderRadius: 4, padding: '2px 6px',
            }}>
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
        left={<span style={{ color: T.textMuted, fontSize: 12 }}>Relo v1.0</span>}
      />
    </Pop>
  )
}

function ConnectBtn({ onClick, children, disabled = false, variant = 'filled' }) {
  const isGhost = variant === 'ghost'
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{
        height: 23, padding: '0 10px', borderRadius: 5,
        fontSize: 11.5, fontWeight: 500,
        background: isGhost ? 'transparent' : T.accentSoft,
        border: `1px solid ${isGhost ? 'rgba(255,255,255,0.12)' : T.accentBorder}`,
        color: isGhost ? T.textMuted : T.accentText,
        cursor: disabled ? 'default' : 'pointer',
        opacity: disabled ? 0.6 : 1,
        fontFamily: T.font,
        transition: 'all 150ms ease',
      }}
    >
      {children}
    </button>
  )
}

function LeadTimePicker({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 3 }}>
      {LEAD_TIMES.map(t => (
        <button
          key={t}
          onClick={() => onChange(t)}
          style={{
            height: 22, padding: '0 7px', borderRadius: 5,
            fontSize: 11, fontWeight: 500, cursor: 'pointer',
            background: value === t ? T.accentSoft : 'rgba(255,255,255,0.04)',
            border: `1px solid ${value === t ? T.accentBorder : 'rgba(255,255,255,0.08)'}`,
            color: value === t ? T.accentText : T.textSoft,
            fontFamily: T.font,
            transition: 'all 140ms ease',
          }}
        >
          {t}m
        </button>
      ))}
    </div>
  )
}
