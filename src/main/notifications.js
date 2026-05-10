import { exec } from 'child_process'

// id → timeout handle
const scheduled = new Map()

/**
 * Schedule a macOS notification to fire `leadTimeMinutes` before `reminder.when`.
 * `getPopoverWindow` is a function returning the current popover BrowserWindow.
 */
export function scheduleNotification(reminder, leadTimeMinutes, getPopoverWindow) {
  const { id, what, when, source } = reminder
  if (!id || !when) return

  const eventTime = new Date(when).getTime()
  const fireAt    = eventTime - leadTimeMinutes * 60 * 1000
  const now       = Date.now()
  const delay     = fireAt - now

  // Event itself already passed — nothing to do
  if (eventTime <= now) {
    console.log(`[notifications] skipping past event: "${what}"`)
    return
  }

  cancelNotification(id)

  // Lead time window already passed but event hasn't — fire immediately
  const effectiveDelay = Math.max(delay, 0)

  const handle = setTimeout(() => {
    scheduled.delete(id)
    _showNotification({ id, what, source }, getPopoverWindow)
  }, effectiveDelay)

  scheduled.set(id, handle)
  console.log(
    effectiveDelay === 0
      ? `[notifications] firing immediately (lead time passed): "${what}"`
      : `[notifications] scheduled "${what}" in ${Math.round(effectiveDelay / 1000)}s (lead ${leadTimeMinutes}m, event in ${Math.round((eventTime - now) / 1000)}s)`
  )
}

export function cancelNotification(id) {
  const h = scheduled.get(id)
  if (h !== undefined) {
    clearTimeout(h)
    scheduled.delete(id)
  }
}

export function cancelAll() {
  for (const h of scheduled.values()) clearTimeout(h)
  scheduled.clear()
}

/** Schedule all non-done reminders from the store on app startup. */
export function scheduleAll(reminders, leadTimeMinutes, getPopoverWindow) {
  for (const r of reminders) {
    if (!r.done) scheduleNotification(r, leadTimeMinutes, getPopoverWindow)
  }
}

/** Fire a test notification immediately — used to bootstrap macOS permissions. */
export function sendTestNotification(getPopoverWindow) {
  _showNotification(
    { id: 'test', what: 'Relo notifications are working!', source: null },
    getPopoverWindow
  )
}

// ── Internal ──────────────────────────────────────────────────────────────────

function _showNotification({ id, what, source }, getPopoverWindow) {
  console.log(`[notifications] firing: "${what}"`)

  // Use osascript — works on macOS without entitlements or permission prompts
  const title    = _esc('Relo')
  const subtitle = _esc(what)
  const body     = _esc(source ? `via ${source}` : 'Time to follow up')

  const script = `display notification ${body} with title ${title} subtitle ${subtitle}`

  exec(`osascript -e '${script}'`, (err) => {
    if (err) {
      console.error('[notifications] osascript error:', err.message)
      return
    }
    console.log(`[notifications] shown: "${what}"`)

    // Bring popover to front — osascript can't callback, so we show proactively
    const win = getPopoverWindow()
    if (win) {
      win.show()
      win.focus()
      win.webContents.send('reminder:fire', { id, what, source })
    }
  })
}

// Escape a string for embedding in a single-quoted AppleScript string
function _esc(str) {
  return `"${String(str ?? '').replace(/\\/g, '\\\\').replace(/"/g, '\\"')}"`
}
