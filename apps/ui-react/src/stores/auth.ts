import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthState {
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
    avatar?: string
  } | null
  token: string | null
  isAuthenticated: boolean
  login: (userData: { email: string; password: string }) => Promise<boolean>
  logout: () => void
  setUser: (user: AuthState['user']) => void
  initialize: () => Promise<void>
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      
      login: async (userData) => {
        // TODO: Implement actual login logic
        console.log('Login attempt with:', userData)
        
        // Mock successful login
        const mockUser = {
          id: '123',
          email: userData.email,
          firstName: 'Test',
          lastName: 'User',
          avatar: 'https://i.pravatar.cc/150?u=test@example.com'
        }
        
        set({
          user: mockUser,
          token: 'mock-token',
          isAuthenticated: true
        })
        
        return true
      },
      
      logout: () => {
        set({
          user: null,
          token: null,
          isAuthenticated: false
        })
      },
      
      setUser: (user) => {
        set({
          user,
          isAuthenticated: !!user
        })
      },
      
      initialize: async () => {
        // Check if we have a persisted session
        const { user, token } = useAuthStore.getState()
        
        if (user && token) {
          set({ isAuthenticated: true })
        } else {
          set({ isAuthenticated: false })
        }
      }
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: (name) => {
          const item = localStorage.getItem(name)
          return item ? JSON.parse(item) : null
        },
        setItem: (name, value) => {
          localStorage.setItem(name, JSON.stringify(value))
        },
        removeItem: (name) => localStorage.removeItem(name)
      }
    }
  )
)