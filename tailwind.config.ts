import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Surface system
        's0':        'var(--s0)',
        's1':        'var(--s1)',
        's2':        'var(--s2)',
        's3':        'var(--s3)',
        // Borders
        'b1':        'var(--b1)',
        'b2':        'var(--b2)',
        'b3':        'var(--b3)',
        // Legacy aliases (component compat)
        bg:          'var(--s0)',
        'bg-card':   'var(--s1)',
        'bg-raised': 'var(--s2)',
        border:      'var(--b2)',
        'border-hi': 'var(--b3)',
        // Text — primary names
        t1: 'var(--t1)',
        t2: 'var(--t2)',
        t3: 'var(--t3)',
        // Legacy aliases (maps to same vars)
        fg:         'var(--t1)',
        'fg-dim':   'var(--t2)',
        'fg-faint': 'var(--t3)',
        // Identity & semantic
        brand:   'var(--brand)',
        accent:  'var(--accent)',
        'accent-dim': 'var(--accent-dim)',
        amber:   'var(--amber)',
        emerald: 'var(--emerald)',
        sky:     'var(--sky)',
        rose:    'var(--rose)',
        violet:  'var(--violet)',
        // Legacy color names
        orange:  'var(--orange)',
        blue:    'var(--sky)',
        cyan:    'var(--cyan)',
        green:   'var(--emerald)',
        purple:  'var(--violet)',
        yellow:  'var(--amber)',
        red:     'var(--rose)',
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'Plus Jakarta Sans', 'system-ui', 'sans-serif'],
        mono: ['var(--font-mono)', 'JetBrains Mono', 'Fira Code', 'monospace'],
      },
      fontSize: {
        // Calibrated scale — not Tailwind defaults
        '2xs': ['11px', { lineHeight: '1.45', letterSpacing: '0' }],
        xs:    ['12px', { lineHeight: '1.5',  letterSpacing: '0' }],
        sm:    ['13px', { lineHeight: '1.5',  letterSpacing: '0' }],
        base:  ['15px', { lineHeight: '1.6' }],
        lg:    ['17px', { lineHeight: '1.5',  letterSpacing: '0' }],
        xl:    ['20px', { lineHeight: '1.4',  letterSpacing: '0' }],
        '2xl': ['24px', { lineHeight: '1.3',  letterSpacing: '0' }],
        '3xl': ['30px', { lineHeight: '1.2',  letterSpacing: '0' }],
        '4xl': ['36px', { lineHeight: '1.15', letterSpacing: '0' }],
        '5xl': ['48px', { lineHeight: '1.1',  letterSpacing: '0' }],
        '6xl': ['60px', { lineHeight: '1.05', letterSpacing: '0' }],
      },
      borderRadius: {
        // Selective — not everything gets max radius
        DEFAULT: '8px',
        xs:   '3px',
        sm:   '6px',
        md:   '8px',
        lg:   '8px',
        xl:   '8px',
        '2xl':'8px',
        full: '9999px',
      },
      boxShadow: {
        // No glow — depth through shadow
        'card':   '0 1px 2px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.2)',
        'raised': '0 2px 8px rgba(0,0,0,0.5), 0 8px 24px rgba(0,0,0,0.2)',
        'overlay':'0 8px 32px rgba(0,0,0,0.6), 0 24px 64px rgba(0,0,0,0.3)',
      },
      spacing: {
        // Preserve Tailwind defaults, add a few fine-grain values
        '4.5': '1.125rem',
        '5.5': '1.375rem',
        '13':  '3.25rem',
        '15':  '3.75rem',
        '18':  '4.5rem',
        '22':  '5.5rem',
      },
      animation: {
        'fade-up':     'fadeUp 0.32s cubic-bezier(0.16,1,0.3,1) both',
        'fade-in':     'fadeIn 0.22s ease both',
        'spin-slow':   'spin 8s linear infinite',
        'pulse-slow':  'pulse 3s cubic-bezier(0.4,0,0.6,1) infinite',
        'float':       'float 3s ease-in-out infinite',
        'ping-slow':   'ping-slow 2s ease-in-out infinite',
      },
    },
  },
  plugins: [],
}

export default config
