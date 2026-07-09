'use client'

import {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  type ReactNode,
} from 'react'
// eslint-disable-next-line @typescript-eslint/no-explicit-any
import type { SupabaseClient, Session, User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

interface SupabaseContextValue {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  supabase: SupabaseClient<any>
  session:  Session | null
  user:     User    | null
  loading:  boolean
}

const SupabaseContext = createContext<SupabaseContextValue | null>(null)

export function SupabaseProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession)
    })

    return () => listener.subscription.unsubscribe()
  }, [supabase])

  const value = useMemo<SupabaseContextValue>(
    () => ({ supabase, session, user: session?.user ?? null, loading }),
    [supabase, session, loading]
  )

  return <SupabaseContext.Provider value={value}>{children}</SupabaseContext.Provider>
}

export function useSupabase() {
  const ctx = useContext(SupabaseContext)
  if (!ctx) throw new Error('useSupabase must be used inside <SupabaseProvider>')
  return ctx
}
