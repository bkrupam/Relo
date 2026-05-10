import { app, BrowserWindow, Tray, nativeImage, globalShortcut, ipcMain, screen, shell } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import Store from 'electron-store'
import { geminiParse } from './gemini'
import { initAuth, getAuthClient, connectAuth, disconnectAuth } from './auth'
import { createEvent, listReloEvents, listAllEvents } from './calendar'
import { scheduleNotification, cancelNotification, scheduleAll, sendTestNotification } from './notifications'

const store = new Store({
  name: 'remindly',
  defaults: {
    settings: {
      leadTimeMinutes: 5,
      autoLaunch: false,
    },
    reminders: [],
    auth: {
      connected: false,
      email: null,
      tokens: null,
    }
  }
})

let tray = null
let popoverWindow = null
let hotkeyWindow = null

// ─── Tray ────────────────────────────────────────────────────────────────────

function createTray() {
  const iconPath = join(__dirname, '../../assets/tray-icon.png')
  const icon = nativeImage.createFromPath(iconPath)
  icon.setTemplateImage(true)

  tray = new Tray(icon)
  tray.setToolTip('Relo')

  tray.on('click', (_event, bounds) => {
    togglePopover(bounds)
  })
}

// ─── Popover window ──────────────────────────────────────────────────────────

function createPopoverWindow() {
  popoverWindow = new BrowserWindow({
    width: 400,
    height: 500,
    frame: false,
    resizable: false,
    movable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    transparent: true,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    hasShadow: true,
    roundedCorners: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    }
  })

  // Close when focus leaves (unless DevTools are open)
  popoverWindow.on('blur', () => {
    if (!popoverWindow.webContents.isDevToolsOpened()) {
      popoverWindow.hide()
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    popoverWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#popover')
  } else {
    popoverWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'popover' })
  }
}

// ─── Hotkey overlay window ───────────────────────────────────────────────────

function createHotkeyWindow() {
  hotkeyWindow = new BrowserWindow({
    width: 600,
    height: 136,
    frame: false,
    resizable: false,
    movable: false,
    alwaysOnTop: true,
    skipTaskbar: true,
    show: false,
    transparent: true,
    vibrancy: 'under-window',
    visualEffectState: 'active',
    hasShadow: true,
    roundedCorners: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    }
  })

  hotkeyWindow.on('blur', () => {
    if (!hotkeyWindow.webContents.isDevToolsOpened()) {
      hotkeyWindow.hide()
    }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    hotkeyWindow.loadURL(process.env['ELECTRON_RENDERER_URL'] + '#hotkey')
  } else {
    hotkeyWindow.loadFile(join(__dirname, '../renderer/index.html'), { hash: 'hotkey' })
  }
}

// ─── Window logic ────────────────────────────────────────────────────────────

function togglePopover(trayBounds) {
  if (popoverWindow.isVisible()) {
    popoverWindow.hide()
    return
  }

  positionPopover(trayBounds)
  popoverWindow.show()
  popoverWindow.focus()
}

function positionPopover(trayBounds) {
  const { x, y, width } = trayBounds
  const winBounds = popoverWindow.getBounds()
  const { width: screenW } = screen.getPrimaryDisplay().workArea

  let winX = Math.round(x + width / 2 - winBounds.width / 2)
  const winY = Math.round(y + 6)

  // Keep within screen horizontally
  if (winX + winBounds.width > screenW) winX = screenW - winBounds.width - 8
  if (winX < 8) winX = 8

  popoverWindow.setPosition(winX, winY)
}

function showHotkeyWindow() {
  if (hotkeyWindow.isVisible()) {
    hotkeyWindow.hide()
    return
  }
  hotkeyWindow.center()
  hotkeyWindow.show()
  hotkeyWindow.focus()
}

// ─── IPC handlers ────────────────────────────────────────────────────────────

function registerIPC() {
  // Renderer asks which window type it is
  ipcMain.handle('window:get-type', (event) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (win === popoverWindow) return 'popover'
    if (win === hotkeyWindow) return 'hotkey'
    return 'unknown'
  })

  // Renderer requests window close
  ipcMain.on('window:hide', (event) => {
    BrowserWindow.fromWebContents(event.sender)?.hide()
  })

  // Renderer opens popover from hotkey window
  ipcMain.on('window:open-popover', () => {
    hotkeyWindow?.hide()
    const trayBounds = tray.getBounds()
    positionPopover(trayBounds)
    popoverWindow?.show()
    popoverWindow?.focus()
  })

  // Store access
  ipcMain.handle('store:get', (_event, key) => store.get(key))
  ipcMain.handle('store:set', (_event, key, value) => store.set(key, value))
  ipcMain.handle('store:delete', (_event, key) => store.delete(key))

  // Auto-launch
  ipcMain.handle('autolaunch:get', () => {
    return app.getLoginItemSettings().openAtLogin
  })
  ipcMain.handle('autolaunch:set', (_event, enabled) => {
    app.setLoginItemSettings({ openAtLogin: enabled })
  })

  // Open external URL
  ipcMain.on('shell:open', (_event, url) => {
    shell.openExternal(url)
  })

  // Gemini NLP parse
  ipcMain.handle('gemini:parse', async (_event, text) => {
    try {
      return await geminiParse(text)
    } catch (err) {
      console.error('[gemini:parse] error:', err.message)
      throw err
    }
  })

  // ── Auth ──────────────────────────────────────────────────────────────────
  ipcMain.handle('auth:status', () => {
    const auth = store.get('auth')
    return { connected: !!auth?.connected, email: auth?.email ?? null }
  })

  ipcMain.handle('auth:connect', async () => {
    try {
      const result = await connectAuth(store)
      return result
    } catch (err) {
      console.error('[auth:connect] error:', err.message)
      throw err
    }
  })

  ipcMain.handle('auth:disconnect', () => {
    disconnectAuth(store)
    return { connected: false, email: null }
  })

  // ── Calendar ──────────────────────────────────────────────────────────────
  ipcMain.handle('calendar:create', async (_event, data) => {
    const client = getAuthClient()
    if (!client) throw new Error('Not connected to Google Calendar')
    try {
      return await createEvent(client, data)
    } catch (err) {
      console.error('[calendar:create] error:', err.message)
      throw err
    }
  })

  ipcMain.handle('calendar:list', async () => {
    const client = getAuthClient()
    if (!client) return []
    try {
      return await listReloEvents(client)
    } catch (err) {
      console.error('[calendar:list] error:', err.message)
      return []
    }
  })

  ipcMain.handle('calendar:list-all', async () => {
    const client = getAuthClient()
    if (!client) return []
    try {
      return await listAllEvents(client)
    } catch (err) {
      console.error('[calendar:list-all] error:', err.message)
      return []
    }
  })

  // ── Notifications ─────────────────────────────────────────────────────────
  ipcMain.handle('notifications:schedule', (_event, reminder, leadTimeMinutes) => {
    scheduleNotification(reminder, leadTimeMinutes ?? store.get('settings.leadTimeMinutes') ?? 5, () => popoverWindow)
  })

  ipcMain.handle('notifications:cancel', (_event, id) => {
    cancelNotification(id)
  })

  ipcMain.handle('notifications:test', () => {
    sendTestNotification(() => popoverWindow)
  })

  // Resize popover window height (called by renderer on screen transitions)
  ipcMain.on('window:resize', (event, height) => {
    const win = BrowserWindow.fromWebContents(event.sender)
    if (!win || win !== popoverWindow) return
    const [w] = win.getSize()
    const [x, y] = win.getPosition()
    win.setBounds({ x, y, width: w, height: Math.round(height) }, true)
  })
}

// ─── App lifecycle ───────────────────────────────────────────────────────────

app.whenReady().then(() => {
  // Keep app alive in menu bar only — no Dock icon
  if (process.platform === 'darwin') {
    app.dock.hide()
  }

  // Restore Google auth session if tokens are stored
  initAuth(store)

  createTray()
  createPopoverWindow()
  createHotkeyWindow()
  registerIPC()

  // Schedule notifications for all pending reminders from last session
  const storedReminders = store.get('reminders') ?? []
  const leadTime        = store.get('settings.leadTimeMinutes') ?? 5
  scheduleAll(storedReminders, leadTime, () => popoverWindow)

  // Global hotkey ⌘⇧R
  const registered = globalShortcut.register('CommandOrControl+Shift+R', () => {
    showHotkeyWindow()
  })

  if (!registered) {
    console.warn('Global shortcut CommandOrControl+Shift+R could not be registered')
  }
})

app.on('will-quit', () => {
  globalShortcut.unregisterAll()
})

// Prevent full quit when all windows are closed — stay in menu bar
app.on('window-all-closed', (e) => {
  e.preventDefault()
})
