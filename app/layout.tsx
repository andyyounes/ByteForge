import type { Metadata } from 'next'
import './globals.css'
import { SupabaseProvider } from '@/components/providers/SupabaseProvider'
import { ToastProvider } from '@/components/ui/Toast'

// Fonts are loaded via @import in globals.css (browser runtime).
// next/font is intentionally NOT used here to avoid build-time
// SSL certificate failures in restricted network environments.

export const metadata: Metadata = {
  title: {
    default:  'ByteForge — Learn ICT',
    template: '%s | ByteForge',
  },
  description:
    'An adaptive ICT learning platform for secondary school students. Master algorithms, programming and computer science through interactive exercises.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SupabaseProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </SupabaseProvider>
      </body>
    </html>
  )
}
