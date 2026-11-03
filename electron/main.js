const { app, BrowserWindow, shell, ipcMain } = require('electron')
const fs = require('fs')
const pathLib = require('path')

const APP_URL   = 'https://byteforge05.vercel.app'
const LOGIN_URL = APP_URL + '/login'

// There's only one teacher account, so the teacher path never needs to ask
// "which email" — only a password, same as the student profile picker.
const TEACHER_EMAIL = 'andymaria55@gmail.com'

// ── Saved student profiles (name + email only — never a password) ───────────
// Several students share one Windows account on these machines, so the app
// remembers WHO has used it (to skip retyping an email) but never WHETHER
// they're still signed in — a student's browser session is always in-memory
// and a password is always required to actually get in. A teacher's device
// is assumed to be their own, so that session is allowed to persist instead
// (see createWindowForRole below).
const PROFILES_FILE = pathLib.join(app.getPath('userData'), 'profiles.json')
const MAX_PROFILES = 5

function loadProfiles() {
  try {
    return JSON.parse(fs.readFileSync(PROFILES_FILE, 'utf8')).profiles ?? []
  } catch {
    return []
  }
}

function saveProfiles(profiles) {
  fs.writeFileSync(PROFILES_FILE, JSON.stringify({ profiles }, null, 2))
}

function addProfileIfNew(email) {
  const profiles = loadProfiles()
  if (profiles.some(p => p.email === email)) return
  if (profiles.length >= MAX_PROFILES) return
  profiles.push({ id: Date.now().toString(36), name: email.split('@')[0], email })
  saveProfiles(profiles)
}

let win = null
let role = null                    // 'teacher' | 'student', set once chosen
let pendingPrefillEmail = null     // set right before navigating to the login page from a picker selection
let lastAttemptedEmail  = null     // captured from the login form's own submit, win or lose
let suppressPickerRedirect = false // true for our own intentional navigations to /login

function showRolePicker() {
  role = null
  win.loadFile(pathLib.join(__dirname, 'role.html'))
}

function showProfilePicker() {
  suppressPickerRedirect = false
  win.loadFile(pathLib.join(__dirname, 'picker.html'))
}

function goToLogin() {
  suppressPickerRedirect = true
  win.loadFile(pathLib.join(__dirname, 'splash.html'))
    .then(() => win.loadURL(LOGIN_URL))
    .catch(() => {})
}

function goToSite() {
  // Teacher path: load the site directly — if the persisted session is
  // still valid, the app itself lands on the dashboard with no login step.
  // If it isn't (first run, or the session expired), the redirect to
  // /login picks up this prefill so only a password is ever needed.
  pendingPrefillEmail = TEACHER_EMAIL
  suppressPickerRedirect = true
  win.loadFile(pathLib.join(__dirname, 'splash.html'))
    .then(() => win.loadURL(APP_URL))
    .catch(() => {})
}

function attachWindowBehaviour() {
  win.removeMenu()

  win.webContents.setWindowOpenHandler(({ url }) => {
    if (!url.startsWith(APP_URL)) {
      shell.openExternal(url)
      return { action: 'deny' }
    }
    return { action: 'allow' }
  })

  win.webContents.on('did-fail-load', (_event, errorCode, _desc, validatedURL) => {
    if (errorCode === -3) return // ERR_ABORTED — a normal in-progress navigation, not a failure
    if (validatedURL.startsWith(APP_URL)) {
      win.loadFile(pathLib.join(__dirname, 'offline.html'))
    }
  })


  // The real site navigates client-side (Next.js router), so landing on
  // /login (e.g. after logout) fires did-navigate-in-page, not a full
  // did-navigate — handle both the same way.
  function handleNav(url) {
    let p
    try { p = new URL(url).pathname } catch { return }

    const wasOurOwnNav = suppressPickerRedirect
    suppressPickerRedirect = false

    if (p === '/login') {
      if (wasOurOwnNav) return
      // Logged out mid-session: students go back to the picker; a teacher
      // just sees the real (now-empty, prefilled) login form again.
      if (role === 'student') showProfilePicker()
      else pendingPrefillEmail = TEACHER_EMAIL
      return
    }

    // Left /login for anything else while we had an attempted email in
    // flight → that's a successful student sign-in. Remember this email for
    // next time (first 5 distinct accounts used on this machine).
    if (role === 'student' && lastAttemptedEmail) {
      addProfileIfNew(lastAttemptedEmail)
      lastAttemptedEmail = null
    }
  }
  win.webContents.on('did-navigate', (_e, url) => handleNav(url))
  win.webContents.on('did-navigate-in-page', (_e, url) => handleNav(url))
}

function createWindowForRole(chosenRole) {
  role = chosenRole
  const previous = win

  win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#0b1220',
    title: 'ByteForge',
    webPreferences: {
      // Teacher: a named "persist:" partition survives restarts (their own
      // device, so staying signed in is the point). Student: no "persist:"
      // prefix at all — an in-memory session wiped the moment the app
      // closes, since the next person at this computer is someone else.
      partition: chosenRole === 'teacher' ? 'persist:byteforge-teacher' : 'byteforge-student-session',
      contextIsolation: true,
      nodeIntegration: false,
      preload: pathLib.join(__dirname, 'preload.js'),
    },
  })

  attachWindowBehaviour()
  win.once('ready-to-show', () => win.show())

  if (chosenRole === 'teacher') goToSite()
  else showProfilePicker()

  if (previous) previous.destroy()
}

function createInitialWindow() {
  win = new BrowserWindow({
    width: 1360,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    show: false,
    backgroundColor: '#0b1220',
    title: 'ByteForge',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: pathLib.join(__dirname, 'preload.js'),
    },
  })
  attachWindowBehaviour()
  win.once('ready-to-show', () => win.show())
  showRolePicker()
}

ipcMain.on('bf:choose-role', (_e, chosenRole) => {
  createWindowForRole(chosenRole === 'teacher' ? 'teacher' : 'student')
})

ipcMain.handle('bf:profiles:list', () => loadProfiles())

ipcMain.handle('bf:profiles:remove', (_e, id) => {
  const profiles = loadProfiles().filter(p => p.id !== id)
  saveProfiles(profiles)
  return profiles
})

ipcMain.on('bf:profiles:select', (_e, email) => {
  pendingPrefillEmail = email
  lastAttemptedEmail = null
  goToLogin()
})

ipcMain.on('bf:profiles:add-new', () => {
  pendingPrefillEmail = null
  lastAttemptedEmail = null
  goToLogin()
})

ipcMain.on('bf:login-attempt', (_e, email) => {
  lastAttemptedEmail = email
})

// Fires whenever the real login form appears in the DOM — whether from a
// hard navigation (win.loadURL) or a client-side route change (logout).
ipcMain.on('bf:login-page-ready', (event) => {
  if (pendingPrefillEmail) {
    event.sender.send('bf:prefill-email', pendingPrefillEmail)
    pendingPrefillEmail = null
  }
})

// Retry button in offline.html re-attempts whatever we were last headed to.
ipcMain.on('retry-load', () => {
  if (!win) return
  if (role === 'teacher') goToSite()
  else goToLogin()
})

app.whenReady().then(createInitialWindow)

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createInitialWindow()
})
