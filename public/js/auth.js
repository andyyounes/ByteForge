// ByteForge — auth helpers (always loaded after db.js)

function requireAuth(role) {
  BF.seed(); // initialise demo data on first load
  const s = BF.session();
  if (!s) { location.href = 'login.html'; return null; }
  if (role && s.role !== role) { location.href = s.role === 'teacher' ? 'dashboard-teacher.html' : 'dashboard-student.html'; return null; }
  return s;
}

function redirectIfLoggedIn() {
  const s = BF.session();
  if (s) location.href = s.role === 'teacher' ? 'dashboard-teacher.html' : 'dashboard-student.html';
}

function logout() {
  BF.clearSession();
  location.href = 'login.html';
}

// XP helpers
function xpForNextLevel(level) { return level * level * 80; }

function xpBar(xp, level) {
  const current = (level - 1) * (level - 1) * 80;
  const next    = level * level * 80;
  const pct     = Math.min(100, Math.round((xp - current) / (next - current) * 100));
  return { pct, current, next, remaining: next - xp };
}

// Friendly level title
const LEVEL_TITLES = ['', 'Bit Flipper','Binary Apprentice','Hex Explorer','Logic Builder','Algorithm Crafter','Code Artisan','Data Architect','System Designer','Turing Scholar','ByteForge Master'];
function levelTitle(level) { return LEVEL_TITLES[Math.min(level, LEVEL_TITLES.length - 1)] || 'Grand Master'; }

// Format a timestamp
function timeAgo(ts) {
  const diff = Date.now() - ts;
  if (diff < 60000)   return 'just now';
  if (diff < 3600000) return Math.floor(diff/60000) + 'm ago';
  if (diff < 86400000)return Math.floor(diff/3600000) + 'h ago';
  return Math.floor(diff/86400000) + 'd ago';
}

// Toast notification
function toast(msg, type = 'success') {
  const el = document.createElement('div');
  el.className = `toast toast-${type}`;
  el.textContent = msg;
  document.body.appendChild(el);
  requestAnimationFrame(() => el.classList.add('toast-show'));
  setTimeout(() => { el.classList.remove('toast-show'); setTimeout(() => el.remove(), 400); }, 3000);
}

// Confetti burst (XP celebration)
function confetti() {
  const colors = ['#f97316','#3b82f6','#22c55e','#a855f7','#eab308'];
  for (let i = 0; i < 60; i++) {
    const el = document.createElement('div');
    el.style.cssText = `position:fixed;width:8px;height:8px;border-radius:2px;background:${colors[i%colors.length]};
      left:${Math.random()*100}vw;top:-10px;pointer-events:none;z-index:9999;
      transition:transform ${1+Math.random()*1.5}s ease,top ${1+Math.random()*1.5}s ease,opacity 0.5s ease ${1+Math.random()}s;`;
    document.body.appendChild(el);
    requestAnimationFrame(() => {
      el.style.top = (60 + Math.random()*40) + 'vh';
      el.style.transform = `rotate(${Math.random()*720}deg) translateX(${(Math.random()-.5)*200}px)`;
    });
    setTimeout(() => { el.style.opacity = '0'; setTimeout(() => el.remove(), 500); }, 2000 + Math.random()*500);
  }
}
