import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Icon, Pop } from '../Primitives'
import { Button } from '@/components/ui/button'

const STEPS = [
  {
    icon: 'bell',
    title: 'Welcome to Relo',
    body: 'Relo lives in your menu bar. Type a follow-up in plain English — "Reply to Priya at 6 PM on Slack" — and it\'s in your calendar instantly.',
    cta: 'Get started',
  },
  {
    icon: 'calendar.badge.plus',
    title: 'Connect Google Calendar',
    body: 'Reminders sync to your primary Google Calendar so they show up everywhere. You can still use Relo locally without connecting.',
    cta: 'Connect Calendar',
    ctaSkip: 'Skip for now',
  },
  {
    icon: 'checkmark.circle',
    title: 'You\'re all set',
    body: 'Click the menu bar icon to add reminders, or press ⌘⇧R from anywhere. Right-click a reminder to delete it.',
    cta: 'Start using Relo',
  },
]

export function OnboardingScreen({ state, dispatch }) {
  const [step, setStep]         = useState(0)
  const [connecting, setConnecting] = useState(false)
  const [connectError, setConnectError] = useState(null)

  const current = STEPS[step]
  const isCalendarStep = step === 1
  const isLast = step === STEPS.length - 1

  const handleConnect = async () => {
    setConnecting(true)
    setConnectError(null)
    try {
      const { connected, email } = await window.api.connectCalendar()
      if (connected) {
        dispatch({ type: 'SET_SETTING', key: 'calendarConnected', value: true })
        dispatch({ type: 'SET_SETTING', key: 'calendarEmail', value: email })
        setStep(s => s + 1)
      }
    } catch {
      setConnectError('Connection failed — try again')
    } finally {
      setConnecting(false)
    }
  }

  const handleCta = () => {
    if (isCalendarStep && !state.settings.calendarConnected) {
      handleConnect()
      return
    }
    if (isLast) {
      window.api.storeSet('firstLaunch', false).catch(() => {})
      dispatch({ type: 'SET_SCREEN', screen: 'idle' })
      return
    }
    setStep(s => s + 1)
  }

  const handleSkip = () => {
    if (isLast) {
      window.api.storeSet('firstLaunch', false).catch(() => {})
      dispatch({ type: 'SET_SCREEN', screen: 'idle' })
    } else {
      setStep(s => s + 1)
    }
  }

  return (
    <Pop>
      {/* Progress dots */}
      <div className="flex items-center justify-center gap-1.5 pt-4 pb-2">
        {STEPS.map((_, i) => (
          <div
            key={i}
            className={cn(
              'rounded-full transition-all duration-300',
              i === step
                ? 'w-4 h-1.5 bg-primary'
                : i < step
                  ? 'w-1.5 h-1.5 bg-primary/40'
                  : 'w-1.5 h-1.5 bg-border',
            )}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pb-2 text-center gap-4">
        <div className="size-12 rounded-2xl bg-secondary border border-border inline-flex items-center justify-center">
          <Icon n={current.icon} s={22} className="text-foreground" />
        </div>

        <div className="space-y-2">
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {current.title}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {current.body}
          </p>
        </div>

        {isCalendarStep && state.settings.calendarConnected && (
          <div className="flex items-center gap-1.5 text-xs text-ring font-medium">
            <Icon n="checkmark.circle" s={13} className="text-ring" />
            Connected as {state.settings.calendarEmail}
          </div>
        )}

        {connectError && (
          <p className="text-xs text-destructive">{connectError}</p>
        )}
      </div>

      {/* Actions */}
      <div className="px-4 pb-4 flex flex-col gap-2">
        <Button
          onClick={handleCta}
          disabled={connecting}
          className="w-full h-9 text-sm font-semibold"
        >
          {connecting ? 'Opening browser…' : (isCalendarStep && state.settings.calendarConnected) ? 'Continue' : current.cta}
        </Button>

        {current.ctaSkip && !state.settings.calendarConnected && (
          <button
            onClick={handleSkip}
            className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors py-1"
          >
            {current.ctaSkip}
          </button>
        )}
      </div>
    </Pop>
  )
}
