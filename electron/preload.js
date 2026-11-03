const { contextBridge, ipcRenderer } = require('electron')

// Exposed to every page this window loads — the picker/splash/offline
// screens use the "picker" and "retryLoad" calls; the real ByteForge site
// never calls any of this itself, it's just along for the ride.
contextBridge.exposeInMainWorld('bf', {
  retryLoad: () => ipcRenderer.send('retry-load'),
  chooseRole: (role) => ipcRenderer.send('bf:choose-role', role),
  switchMode: () => ipcRenderer.send('bf:switch-mode'),
  picker: {
    list:      () => ipcRenderer.invoke('bf:profiles:list'),
    select:    (email) => ipcRenderer.send('bf:profiles:select', email),
    addNew:    () => ipcRenderer.send('bf:profiles:add-new'),
    remove:    (id) => ipcRenderer.invoke('bf:profiles:remove', id),
  },
})

// Only meaningful on the real site's /login page (the "email"/"password"
// fields just won't exist anywhere else, so this is a no-op elsewhere).
//
// The site is a Next.js SPA — navigating to /login after a logout is a
// client-side route change, not a fresh page load, so this can't just run
// once on DOMContentLoaded (that already fired, for whatever page the
// window first loaded). A MutationObserver instead re-checks on every DOM
// change and wires the form the moment it appears, however it got there.
let wiredEmailInput = null

function wireLoginPage() {
  const emailInput = document.getElementById('email')
  const pwdInput   = document.getElementById('password')
  if (!emailInput || !pwdInput || emailInput === wiredEmailInput) return
  wiredEmailInput = emailInput

  ipcRenderer.on('bf:prefill-email', (_event, email) => {
    // React tracks <input> state through its own value setter, so a plain
    // `.value =` assignment doesn't trigger the onChange it's listening
    // for — use the native setter instead so React sees the change.
    const nativeSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
    nativeSetter.call(emailInput, email)
    emailInput.dispatchEvent(new Event('input', { bubbles: true }))
    pwdInput.focus()
  })

  const form = emailInput.closest('form')
  if (form) {
    form.addEventListener('submit', () => {
      ipcRenderer.send('bf:login-attempt', emailInput.value.trim().toLowerCase())
    })
  }

  addBackLink()
  ipcRenderer.send('bf:login-page-ready')
}

// A small "go back" link on the REAL sign-in page itself — not just the
// picker — for whoever picked the wrong mode (or just wants to switch who's
// using the computer) without needing to know the Ctrl+Shift+Backspace
// shortcut.
function addBackLink() {
  if (document.getElementById('bf-back-link')) return
  const link = document.createElement('div')
  link.id = 'bf-back-link'
  link.textContent = '← Not a student? Go back'
  link.style.cssText = [
    'position:fixed', 'top:14px', 'left:14px', 'z-index:999999',
    'font:600 12px -apple-system,Segoe UI,Roboto,sans-serif',
    'color:#8891b5', 'cursor:pointer', 'padding:6px 10px', 'border-radius:6px',
    'background:rgba(0,0,0,.25)', 'backdrop-filter:blur(4px)',
  ].join(';')
  link.addEventListener('mouseenter', () => { link.style.color = '#e5e9f5' })
  link.addEventListener('mouseleave', () => { link.style.color = '#8891b5' })
  link.addEventListener('click', () => ipcRenderer.send('bf:switch-mode'))
  document.body.appendChild(link)
}

function startObserving() {
  new MutationObserver(wireLoginPage).observe(document.documentElement, { childList: true, subtree: true })
  wireLoginPage()
}
if (document.documentElement) startObserving()
else document.addEventListener('DOMContentLoaded', startObserving)
