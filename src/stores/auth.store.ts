import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { clearAccessToken, setAccessToken } from '@/lib/axios'
import type { User } from '@/features/auth/types/auth.types'

interface AuthStore {
  user: User | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User, accessToken: string) => void
  clearAuth: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user, accessToken) => {
        setAccessToken(accessToken)
        set({ user, isAuthenticated: true, isLoading: false })
      },

      clearAuth: () => {
        clearAccessToken()
        set({ user: null, isAuthenticated: false, isLoading: false })
      },

      setLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => state?.setLoading(false),
    }
  )
)
