const { app, BrowserWindow, shell, ipcMain } = require('electron')
const path = require('path')

const APP_URL = 'https://byteforge05.vercel.app'

function createWindow() {
  const win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#0b1220',
    title: 'ByteForge',
    webPreferences: {
      // No "persist:" prefix — an in-memory session that resets on every
      // launch. Several students share one Windows account on these
      // machines, so the app must never stay logged in as whoever used it
      // last; each student logs into their own profile every time it opens.
      partition: 'byteforge-session',
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  })

  win.removeMenu()

  // External links (e.g. "forgot password" mail links) open in the real browser,
  // not inside the app window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  win.once('ready-to-show', () => win.show())

  function loadApp() {
    win.loadURL(APP_URL).catch(() => {})
  }

  // Splash paints first; the old frame stays on screen (no white flash) until
  // the real site's first paint replaces it, so the real load happens "behind" it.
  win.loadFile(path.join(__dirname, 'splash.html')).then(loadApp)

  win.webContents.on('did-fail-load', (_event, errorCode, _desc, validatedURL) => {
    if (errorCode === -3) return // ERR_ABORTED — a normal in-progress navigation, not a failure
    if (validatedURL.startsWith(APP_URL) || validatedURL === APP_URL + '/') {
      win.loadFile(path.join(__dirname, 'offline.html'))
    }
  })

  return win
}

// Retry button in offline.html asks the main process to reload the real site.
ipcMain.on('retry-load', () => {
  const win = BrowserWindow.getAllWindows()[0]
  if (win) win.loadURL(APP_URL).catch(() => {})
})

app.whenReady().then(createWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow()
})
