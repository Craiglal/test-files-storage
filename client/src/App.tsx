import { useEffect, useMemo } from 'react'
import { AuthPage } from './components/auth/AuthPage'
import { HomePage } from './components/home/HomePage'
import { useAuthStore } from './store/useAuthStore'
import './App.scss'

function App() {
  const { isAuthenticated, checkAuthFromCookies } = useAuthStore()

  useEffect(() => {
    checkAuthFromCookies()
  }, [checkAuthFromCookies])

  const googleAuthUrl = useMemo(() => {
    const base = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_BACKEND_URL ?? ''
    return `${base}/auth/google`;
  }, [])

  if (isAuthenticated) {
    return <HomePage />
  }

  return <AuthPage googleAuthUrl={googleAuthUrl} />
}

export default App
