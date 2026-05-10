import { google } from 'googleapis'
import http from 'http'
import { shell } from 'electron'

const SCOPES = [
  'https://www.googleapis.com/auth/calendar',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
]

const REDIRECT_PORT = 42813
const REDIRECT_URI = `http://127.0.0.1:${REDIRECT_PORT}`

// Module-level singleton — shared with calendar.js via getAuthClient()
let _client = null

function makeClient() {
  return new google.auth.OAuth2(
    import.meta.env.MAIN_VITE_GOOGLE_CLIENT_ID,
    import.meta.env.MAIN_VITE_GOOGLE_CLIENT_SECRET,
    REDIRECT_URI,
  )
}

// Called on app startup — restores tokens from store if available
export function initAuth(store) {
  const tokens = store.get('auth.tokens')
  if (!tokens) return null

  _client = makeClient()
  _client.setCredentials(tokens)

  // Persist refreshed tokens automatically
  _client.on('tokens', (newTokens) => {
    const existing = store.get('auth.tokens') ?? {}
    store.set('auth.tokens', { ...existing, ...newTokens })
    console.log('[auth] tokens auto-refreshed')
  })

  console.log('[auth] restored session for', store.get('auth.email'))
  return _client
}

// Returns the active client (null if not connected)
export function getAuthClient() {
  return _client
}

// Starts the OAuth browser flow — resolves with { connected, email }
export function connectAuth(store) {
  return new Promise((resolve, reject) => {
    const client = makeClient()

    const authUrl = client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'consent', // force refresh_token every time
    })

    const server = http.createServer(async (req, res) => {
      try {
        const url = new URL(req.url, REDIRECT_URI)

        // Ignore favicon and any request without auth params
        const code  = url.searchParams.get('code')
        const error = url.searchParams.get('error')

        if (!code && !error) {
          res.writeHead(204)
          res.end()
          return
        }

        if (error) {
          res.writeHead(200, { 'Content-Type': 'text/html' })
          res.end(`<h2 style="font-family:system-ui;padding:40px;color:#c00">Auth cancelled (${error})<br><span style="font-size:16px;color:#666">Close this tab and try again in Relo.</span></h2>`)
          server.close()
          reject(new Error(`Google auth error: ${error}`))
          return
        }

        res.writeHead(200, { 'Content-Type': 'text/html' })
        res.end('<h2 style="font-family:system-ui;padding:40px;color:#007afd">Connected to Relo ✓<br><span style="font-size:16px;color:#666">You can close this tab.</span></h2>')
        server.close()

        // Exchange code for tokens
        const { tokens } = await client.getToken(code)
        client.setCredentials(tokens)

        // Persist refreshed tokens going forward
        client.on('tokens', (newTokens) => {
          const existing = store.get('auth.tokens') ?? {}
          store.set('auth.tokens', { ...existing, ...newTokens })
        })

        // Fetch email
        const oauth2 = google.oauth2({ version: 'v2', auth: client })
        const { data } = await oauth2.userinfo.get()

        store.set('auth', {
          connected: true,
          email: data.email,
          tokens,
        })

        _client = client
        resolve({ connected: true, email: data.email })
      } catch (err) {
        server.close()
        reject(err)
      }
    })

    server.listen(REDIRECT_PORT, '127.0.0.1', () => {
      console.log('[auth] local server ready, opening browser…')
      shell.openExternal(authUrl)
    })

    server.on('error', (err) => {
      console.error('[auth] server error:', err)
      reject(err)
    })

    // Auto-cancel after 5 minutes
    setTimeout(() => {
      server.close()
      reject(new Error('Auth timed out after 5 minutes'))
    }, 5 * 60 * 1000)
  })
}

// Clears tokens + resets client
export function disconnectAuth(store) {
  _client = null
  store.set('auth', { connected: false, email: null, tokens: null })
  console.log('[auth] disconnected')
}
