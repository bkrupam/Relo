import { useReducer, useEffect, useRef } from 'react'
import { IdleScreen }          from './components/screens/IdleScreen'
import { TypingScreen }        from './components/screens/TypingScreen'
import { AmbiguousScreen }     from './components/screens/AmbiguousScreen'
import { ParsedScreen }        from './components/screens/ParsedScreen'
import { LoadingScreen }       from './components/screens/LoadingScreen'
import { ConfirmedScreen }     from './components/screens/ConfirmedScreen'
import { ReminderListScreen }  from './components/screens/ReminderListScreen'
import { SettingsScreen }      from './components/screens/SettingsScreen'
import { HotkeyOverlay }       from './components/HotkeyOverlay'

function makeId() {
  return `r${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
}

// ── Window height per screen (triggers Electron resize) ───────────────────────
const HEIGHTS = {
  idle:      500,
  typing:    440,
  ambiguous: 400,
  parsed:    440,
  loading:   220,
  confirmed: 500,
  list:      500,
  settings:  500,
}

// ── State shape ───────────────────────────────────────────────────────────────
const initialState = {
  screen:              'idle',
  inputText:           '',
  parsedData:          null,
  confirmedReminder:   null,
  confirmedReminders:  [],
  confirmedSyncFailed: false,
  reminders:           [],          // loaded from store on startup
  allCalendarEvents:   [],
  listTab:             'relo',
  settings: {
    autoParse:         true,
    autoFocus:         true,
    leadTimeMinutes:   5,
    calendarConnected: false,
    calendarEmail:     null,
    slackLabel:        true,
  },
}

// ── Reducer ───────────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'LOAD_REMINDERS':
      return { ...state, reminders: action.reminders }

    case 'SET_SCREEN':
      return { ...state, screen: action.screen }

    case 'UPDATE_INPUT':
      return { ...state, inputText: action.text }

    case 'PARSED':
      return { ...state, parsedData: Array.isArray(action.data) ? action.data : [action.data], screen: 'parsed' }

    case 'AMBIGUOUS':
      return { ...state, parsedData: Array.isArray(action.data) ? action.data : [action.data], screen: 'ambiguous' }

    case 'PICK_TIME': {
      // Pick time currently only applies if there is one parsed item
      const updated = [...state.parsedData]
      if (updated.length > 0) {
        updated[0] = { ...updated[0], when: action.isoTime, ambiguous: false }
      }
      return { ...state, parsedData: updated, screen: 'parsed' }
    }

    case 'SUBMIT':
      return { ...state, screen: 'loading' }

    case 'CONFIRMED': {
      // handle either single reminder or array of reminders
      const toAdd = action.reminders || (action.reminder ? [action.reminder] : state.parsedData)

      // Preserve pre-generated ids from the hook (needed for notification scheduling)
      const newReminders = toAdd.map(r => ({
        id:     r.id || makeId(),
        what:   r.what,
        when:   r.when,
        source: r.source ?? null,
        done:   false,
        calendarLink: r.calendarLink ?? null,
      }))

      return {
        ...state,
        screen:             'confirmed',
        confirmedReminder:  newReminders[0],
        confirmedReminders: newReminders,
        confirmedSyncFailed: action.syncFailed ?? false,
        reminders:          [...newReminders, ...state.reminders],
        inputText:          '',
        parsedData:         null,
      }
    }

    case 'RESET':
      return { ...state, screen: 'idle', inputText: '', parsedData: null, confirmedReminder: null, confirmedReminders: [], confirmedSyncFailed: false }

    case 'TOGGLE_REMINDER':
      return {
        ...state,
        reminders: state.reminders.map(r =>
          r.id === action.id ? { ...r, done: !r.done } : r
        ),
      }

    case 'DELETE_REMINDER':
      return {
        ...state,
        reminders: state.reminders.filter(r => r.id !== action.id),
      }

    case 'SET_LIST_TAB':
      return { ...state, listTab: action.tab }

    case 'TOGGLE_SETTING':
      return { ...state, settings: { ...state.settings, [action.key]: !state.settings[action.key] } }

    case 'SET_SETTING':
      return { ...state, settings: { ...state.settings, [action.key]: action.value } }

    case 'EDIT_REMINDER':
      return {
        ...state,
        screen:    'typing',
        inputText: action.reminder?.what ?? '',
        parsedData: null,
      }

    case 'SET_ALL_EVENTS':
      return { ...state, allCalendarEvents: action.events }

    default:
      return state
  }
}

// ── Loading → create calendar event(s) → confirmed ───────────────────────────
function useCalendarCreate(state, dispatch) {
  const fired = useRef(false)

  useEffect(() => {
    if (state.screen !== 'loading') { fired.current = false; return }
    if (fired.current) return
    fired.current = true

    const rawItems = state.parsedData?.length
      ? state.parsedData
      : [{ what: state.inputText, when: new Date().toISOString(), source: null }]

    // Pre-assign IDs so we can schedule notifications with the same IDs
    const items = rawItems.map(r => ({ ...r, id: r.id || makeId() }))

    const leadTime = state.settings.leadTimeMinutes ?? 5

    async function run() {
      let reminders

      if (!state.settings.calendarConnected) {
        reminders = items.map(r => ({ ...r, calendarLink: null, done: false }))
      } else {
        try {
          const results = await Promise.all(
            items.map(item =>
              window.api.createCalendarEvent({
                what:            item.what ?? state.inputText,
                when:            item.when,
                source:          item.source ?? null,
                leadTimeMinutes: leadTime,
              })
            )
          )
          reminders = items.map((item, i) => ({
            ...item,
            calendarLink: results[i]?.htmlLink ?? null,
            done:         false,
          }))
        } catch (err) {
          console.error('[calendar:create] failed, confirming locally:', err.message)
          reminders = items.map(r => ({ ...r, calendarLink: null, done: false }))
          dispatch({ type: 'CONFIRMED', reminders, syncFailed: true })
          for (const r of reminders) window.api.scheduleNotification(r, leadTime).catch(() => {})
          return
        }
      }

      dispatch({ type: 'CONFIRMED', reminders })

      // Schedule a notification for each new reminder
      for (const r of reminders) {
        window.api.scheduleNotification(r, leadTime).catch(() => {})
      }
    }

    run()
  }, [state.screen]) // eslint-disable-line react-hooks/exhaustive-deps
}

// ── Window resize on screen change ────────────────────────────────────────────
function useWindowResize(screen, windowType) {
  useEffect(() => {
    if (windowType !== 'popover') return
    const h = HEIGHTS[screen]
    if (h) window.api.resizeWindow(h)
  }, [screen, windowType])
}

// ── Root app ──────────────────────────────────────────────────────────────────
export default function App() {
  const [windowType, setWindowType] = React.useState(null)
  const [state, dispatch] = useReducer(reducer, initialState)

  useEffect(() => {
    window.api.getWindowType().then(setWindowType)
  }, [])

  useCalendarCreate(state, dispatch)
  useWindowResize(state.screen, windowType)

  // Load auth status + stored reminders once on startup
  useEffect(() => {
    window.api.getAuthStatus().then(({ connected, email }) => {
      if (connected) {
        dispatch({ type: 'SET_SETTING', key: 'calendarConnected', value: true })
        dispatch({ type: 'SET_SETTING', key: 'calendarEmail', value: email })
      }
    }).catch(() => {/* not critical */})

    window.api.storeGet('reminders').then(stored => {
      if (Array.isArray(stored) && stored.length > 0) {
        dispatch({ type: 'LOAD_REMINDERS', reminders: stored })
      }
    }).catch(() => {})

    window.api.storeGet('settings.leadTimeMinutes').then(v => {
      if (typeof v === 'number') dispatch({ type: 'SET_SETTING', key: 'leadTimeMinutes', value: v })
    }).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist reminders to store whenever they change
  const remindersRef = useRef(state.reminders)
  useEffect(() => {
    if (remindersRef.current === state.reminders) return
    remindersRef.current = state.reminders
    window.api.storeSet('reminders', state.reminders).catch(() => {})
  }, [state.reminders])

  // Handle notification click from main process → bring reminder into view
  useEffect(() => {
    const unsub = window.api.on('reminder:fire', (reminder) => {
      dispatch({ type: 'SET_SCREEN', screen: 'idle' })
      // Scroll to reminder if list is visible — for now just go idle so popover is seen
      console.log('[reminder:fire] notification clicked for:', reminder?.what)
    })
    return () => unsub?.()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Escape key → idle (for any screen without its own escape handler)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (windowType === 'hotkey') { window.api.hideWindow(); return }
        if (['list', 'settings'].includes(state.screen)) {
          dispatch({ type: 'SET_SCREEN', screen: 'idle' })
        }
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [windowType, state.screen])

  if (!windowType) return null

  if (windowType === 'hotkey') {
    return <HotkeyOverlay state={state} dispatch={dispatch} />
  }

  // Popover screens
  const props = { state, dispatch }
  switch (state.screen) {
    case 'idle':      return <IdleScreen      {...props} />
    case 'typing':    return <TypingScreen    {...props} />
    case 'ambiguous': return <AmbiguousScreen {...props} />
    case 'parsed':    return <ParsedScreen    {...props} />
    case 'loading':   return <LoadingScreen   {...props} />
    case 'confirmed': return <ConfirmedScreen {...props} />
    case 'list':      return <ReminderListScreen {...props} />
    case 'settings':  return <SettingsScreen  {...props} />
    default:          return <IdleScreen      {...props} />
  }
}

// Need React in scope for useState above
import React from 'react'
