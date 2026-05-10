import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('api', {
  // Window control
  getWindowType: () => ipcRenderer.invoke('window:get-type'),
  hideWindow:    () => ipcRenderer.send('window:hide'),
  openPopover:   () => ipcRenderer.send('window:open-popover'),

  // Persistent store
  storeGet:    (key)        => ipcRenderer.invoke('store:get', key),
  storeSet:    (key, value) => ipcRenderer.invoke('store:set', key, value),
  storeDelete: (key)        => ipcRenderer.invoke('store:delete', key),

  // Auto-launch
  getAutoLaunch: ()        => ipcRenderer.invoke('autolaunch:get'),
  setAutoLaunch: (enabled) => ipcRenderer.invoke('autolaunch:set', enabled),

  // Open URLs in system browser
  openExternal: (url) => ipcRenderer.send('shell:open', url),

  // Resize window height
  resizeWindow: (height) => ipcRenderer.send('window:resize', height),

  // Gemini NLP
  parseWithGemini: (text) => ipcRenderer.invoke('gemini:parse', text),

  // Auth
  getAuthStatus:      ()  => ipcRenderer.invoke('auth:status'),
  connectCalendar:    ()  => ipcRenderer.invoke('auth:connect'),
  disconnectCalendar: ()  => ipcRenderer.invoke('auth:disconnect'),

  // Calendar
  createCalendarEvent:    (data) => ipcRenderer.invoke('calendar:create', data),
  listCalendarEvents:     ()     => ipcRenderer.invoke('calendar:list'),
  listAllCalendarEvents:  ()     => ipcRenderer.invoke('calendar:list-all'),

  // Notifications
  scheduleNotification: (reminder, leadTimeMinutes) =>
    ipcRenderer.invoke('notifications:schedule', reminder, leadTimeMinutes),
  cancelNotification: (id) =>
    ipcRenderer.invoke('notifications:cancel', id),
  testNotification: () =>
    ipcRenderer.invoke('notifications:test'),

  // Listen for messages from main process
  on: (channel, callback) => {
    const allowed = ['reminder:fire', 'auth:status-changed']
    if (!allowed.includes(channel)) return
    const sub = (_event, ...args) => callback(...args)
    ipcRenderer.on(channel, sub)
    return () => ipcRenderer.removeListener(channel, sub)
  }
})
