import { create } from 'zustand'

const GOOGLE_COOKIE_KEY = 'access_token='

const hasAccessToken = () =>
  document.cookie
    .split(';')
    .some((entry) => entry.trim().startsWith(GOOGLE_COOKIE_KEY))

type AuthState = {
  isAuthenticated: boolean
  checkAuthFromCookies: () => void
  setAuthenticated: (isAuthenticated: boolean) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  checkAuthFromCookies: () => set({ isAuthenticated: hasAccessToken() }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
}))
