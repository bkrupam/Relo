import { useReducer, useEffect, useRef } from 'react'
import { IdleScreen }          from './components/screens/IdleScreen'
import { TypingScreen }        from './components/screens/TypingScreen'
import { AmbiguousScreen }     from './components/screens/AmbiguousScreen'
import { ParsedScreen }        from './components/screens/ParsedScreen'
import { LoadingScreen }       from './components/screens/LoadingScreen'
import { ConfirmedScreen }     from './components/screens/ConfirmedScreen'
import { ReminderListScreen }  from './components/screens/ReminderListScreen'
import { SettingsScreen }      from './components/screens/SettingsScreen'
import { OnboardingScreen }    from './components/screens/OnboardingScreen'
import { HotkeyOverlay }       from './components/HotkeyOverlay'

function makeId() {
  return `r${Date.now()}_${Math.random().toString(36).substr(2, 5)}`
}


// ── State shape ───────────────────────────────────────────────────────────────
const initialState = {
  screen:              'idle',
  inputText:           '',
  parsedData:          null,
  editingId:           null,
  confirmedReminder:   null,
  confirmedReminders:  [],
  confirmedSyncFailed: false,
  reminders:           [],          // loaded from store on startup
  allCalendarEvents:   [],
  listTab:             'relo',
  settings: {
    autoParse:         false,
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
      const newReminders = toAdd.map((r, i) => ({
        id:     (state.editingId && i === 0) ? state.editingId : (r.id || makeId()),
        what:   r.what,
        when:   r.when,
        source: r.source ?? null,
        done:   false,
        calendarLink: r.calendarLink ?? null,
      }))

      // If editing an existing reminder, replace it in the list
      let updatedList
      if (state.editingId) {
        updatedList = state.reminders.map(r =>
          r.id === state.editingId ? newReminders[0] : r
        )
        // If somehow not found (e.g. was deleted), just prepend
        if (!updatedList.some(r => r.id === newReminders[0].id)) {
          updatedList = [...newReminders, ...state.reminders]
        }
      } else {
        updatedList = [...newReminders, ...state.reminders]
      }

      return {
        ...state,
        screen:             'confirmed',
        confirmedReminder:  newReminders[0],
        confirmedReminders: newReminders,
        confirmedSyncFailed: action.syncFailed ?? false,
        reminders:          updatedList,
        inputText:          '',
        parsedData:         null,
        editingId:          null,
      }
    }

    case 'RESET':
      return { ...state, screen: 'idle', inputText: '', parsedData: null, editingId: null, confirmedReminder: null, confirmedReminders: [], confirmedSyncFailed: false }

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

    case 'EDIT_REMINDER': {
      const reminder = action.reminder
      const parsedSeed = reminder?.when
        ? [{
            what:      reminder.what,
            when:      reminder.when,
            source:    reminder.source ?? null,
            ambiguous: false,
          }]
        : null
      return {
        ...state,
        screen:     parsedSeed ? 'parsed' : 'typing',
        inputText:  reminder?.what ?? '',
        parsedData: parsedSeed,
        editingId:  reminder?.id ?? null,
      }
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

    const existingEdit = state.editingId
      ? state.reminders.find(r => r.id === state.editingId)
      : null

    // Pre-assign IDs — keep same id when editing
    const items = rawItems.map(r => ({
      ...r,
      id: state.editingId || r.id || makeId(),
    }))

    const leadTime = state.settings.leadTimeMinutes ?? 5

    async function run() {
      if (state.editingId) {
        window.api.cancelNotification(state.editingId).catch(() => {})
      }

      let reminders

      // Edit: update local reminder only — do not create another Calendar event
      if (state.editingId) {
        reminders = items.map(r => ({
          ...r,
          id: state.editingId,
          calendarLink: existingEdit?.calendarLink ?? null,
          done: false,
        }))
        dispatch({ type: 'CONFIRMED', reminders })
        for (const r of reminders) {
          if (r.when) window.api.scheduleNotification(r, leadTime).catch(() => {})
        }
        return
      }

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

// ── Root app ──────────────────────────────────────────────────────────────────
export default function App() {
  const [windowType, setWindowType] = React.useState(null)
  const [bootstrapped, setBootstrapped] = React.useState(false)
  const [state, dispatch] = useReducer(reducer, initialState)
  const doneSnapshotRef = useRef(new Map())

  useEffect(() => {
    window.api.getWindowType().then(setWindowType)
  }, [])

  useCalendarCreate(state, dispatch)

  // Load auth status + stored reminders once on startup
  useEffect(() => {
    // Determine whether to show onboarding (first launch = store key absent or true)
    window.api.storeGet('firstLaunch').then(val => {
      const isFirst = val === undefined || val === null || val === true
      dispatch({ type: 'SET_SCREEN', screen: isFirst ? 'onboarding' : 'idle' })
      setBootstrapped(true)
    }).catch(() => {
      dispatch({ type: 'SET_SCREEN', screen: 'idle' })
      setBootstrapped(true)
    })

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

    window.api.storeGet('settings.autoParse').then(v => {
      if (typeof v === 'boolean') dispatch({ type: 'SET_SETTING', key: 'autoParse', value: v })
    }).catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Persist reminders to store whenever they change
  const remindersRef = useRef(state.reminders)
  useEffect(() => {
    if (remindersRef.current === state.reminders) return
    remindersRef.current = state.reminders
    window.api.storeSet('reminders', state.reminders).catch(() => {})
  }, [state.reminders])

  // Sync notifications when reminders are marked done / undone
  useEffect(() => {
    const leadTime = state.settings.leadTimeMinutes ?? 5
    for (const r of state.reminders) {
      const wasDone = doneSnapshotRef.current.get(r.id)
      if (wasDone === undefined) {
        doneSnapshotRef.current.set(r.id, r.done)
        continue
      }
      if (wasDone === r.done) continue
      doneSnapshotRef.current.set(r.id, r.done)
      if (r.done) {
        window.api.cancelNotification(r.id).catch(() => {})
      } else if (r.when) {
        window.api.scheduleNotification(r, leadTime).catch(() => {})
      }
    }
    for (const id of [...doneSnapshotRef.current.keys()]) {
      if (!state.reminders.some(r => r.id === id)) doneSnapshotRef.current.delete(id)
    }
  }, [state.reminders, state.settings.leadTimeMinutes])

  // Notification click → open reminders list
  useEffect(() => {
    const unsub = window.api.on('reminder:fire', () => {
      dispatch({ type: 'SET_SCREEN', screen: 'list' })
    })
    return () => unsub?.()
  }, [])

  // Escape key → idle (for any screen without its own escape handler)
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (windowType === 'hotkey') { window.api.hideWindow(); return }
        if (['list', 'settings'].includes(state.screen)) {
          dispatch({ type: 'SET_SCREEN', screen: 'idle' })
        }
        // onboarding: ignore Escape
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [windowType, state.screen])

  if (!windowType || !bootstrapped) return null

  if (windowType === 'hotkey') {
    return <HotkeyOverlay state={state} dispatch={dispatch} />
  }

  // Popover screens
  const props = { state, dispatch }
  switch (state.screen) {
    case 'onboarding': return <OnboardingScreen {...props} />
    case 'idle':       return <IdleScreen       {...props} />
    case 'typing':     return <TypingScreen     {...props} />
    case 'ambiguous':  return <AmbiguousScreen  {...props} />
    case 'parsed':     return <ParsedScreen     {...props} />
    case 'loading':    return <LoadingScreen    {...props} />
    case 'confirmed':  return <ConfirmedScreen  {...props} />
    case 'list':       return <ReminderListScreen {...props} />
    case 'settings':   return <SettingsScreen   {...props} />
    default:           return <IdleScreen       {...props} />
  }
}

// Need React in scope for useState above
import React from 'react'
