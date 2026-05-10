import { google } from 'googleapis'

// ── Create a single calendar event ───────────────────────────────────────────
export async function createEvent(authClient, { what, when, source, leadTimeMinutes = 5 }) {
  const cal = google.calendar({ version: 'v3', auth: authClient })

  const tz    = Intl.DateTimeFormat().resolvedOptions().timeZone
  const start = new Date(when)
  const end   = new Date(start.getTime() + 15 * 60 * 1000) // +15 min

  const resource = {
    summary:     what,
    description: `Created by Relo${source ? ` · via ${source}` : ''}`,
    start: { dateTime: start.toISOString(), timeZone: tz },
    end:   { dateTime: end.toISOString(),   timeZone: tz },
    reminders: {
      useDefault: false,
      overrides:  [{ method: 'popup', minutes: leadTimeMinutes }],
    },
    extendedProperties: {
      private: { createdByRelo: 'true' },
    },
  }

  const res = await cal.events.insert({ calendarId: 'primary', resource })
  console.log('[calendar] created event:', res.data.id)
  return res.data
}

// ── List events created by Relo (7-day window from today) ────────────────────
export async function listReloEvents(authClient) {
  const cal = google.calendar({ version: 'v3', auth: authClient })

  const timeMin = startOfToday()
  const timeMax = daysFromNow(7)

  const res = await cal.events.list({
    calendarId:              'primary',
    timeMin:                 timeMin.toISOString(),
    timeMax:                 timeMax.toISOString(),
    singleEvents:            true,
    orderBy:                 'startTime',
    privateExtendedProperty: 'createdByRelo=true',
  })

  return (res.data.items ?? []).map(normalizeEvent)
}

// ── List all events from primary calendar (7-day window) ─────────────────────
export async function listAllEvents(authClient) {
  const cal = google.calendar({ version: 'v3', auth: authClient })

  const timeMin = startOfToday()
  const timeMax = daysFromNow(7)

  const res = await cal.events.list({
    calendarId:   'primary',
    timeMin:      timeMin.toISOString(),
    timeMax:      timeMax.toISOString(),
    singleEvents: true,
    orderBy:      'startTime',
  })

  return (res.data.items ?? []).map(normalizeEvent)
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function startOfToday() {
  const d = new Date()
  d.setHours(0, 0, 0, 0)
  return d
}

function daysFromNow(n) {
  const d = new Date()
  d.setDate(d.getDate() + n)
  d.setHours(23, 59, 59, 999)
  return d
}

function normalizeEvent(ev) {
  return {
    id:           ev.id,
    what:         ev.summary ?? 'Untitled',
    when:         ev.start?.dateTime ?? ev.start?.date ?? null,
    source:       null,
    done:         false,
    calendarLink: ev.htmlLink ?? null,
  }
}
