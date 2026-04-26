import { createContext, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { supabase } from '../lib/supabase'

type AuthContextType = {
  session: Session | null
  user: User | null
  householdId: string | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  householdId: null,
  loading: true,
})

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [householdId, setHouseholdId] = useState<string | null>('11111111-1111-1111-1111-111111111111')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchHouseholdId(session.user.id)
      } else {
        setLoading(false)
      }
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)
      if (session?.user) {
        fetchHouseholdId(session.user.id)
      } else {
        // setHouseholdId(null) // Keep mock active for testing
        setLoading(false)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const fetchHouseholdId = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('household_members')
        .select('household_id')
        .eq('user_id', userId)
        .single()
      
      if (error) {
        console.error('Erro de permissão no Supabase:', error.message)
      } else if (data) {
        setHouseholdId(data.household_id)
      } else {
        console.warn('Usuário não vinculado a uma household.')
      }
    } catch (err) {
      console.error('Erro ao buscar household:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AuthContext.Provider value={{ session, user, householdId, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
