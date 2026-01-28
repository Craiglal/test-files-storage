import { useEffect, useMemo } from 'react'
import { ToastContainer } from 'react-toastify'
import { AuthPage } from './components/auth/AuthPage'
import { HomePage } from './components/home/HomePage'
import { useAuthStore } from './store/useAuthStore'
import 'react-toastify/dist/ReactToastify.css'
import './App.scss'

function App() {
  const { isAuthenticated, checkAuthFromCookies } = useAuthStore()

  useEffect(() => {
    checkAuthFromCookies()
  }, [checkAuthFromCookies])

  const googleAuthUrl = useMemo(() => {
    const base = import.meta.env.VITE_API_BASE_URL ?? ''
    return `${base}/api/auth/google`;
  }, [])

  return (
    <>
      {isAuthenticated ? <HomePage /> : <AuthPage googleAuthUrl={googleAuthUrl} />}
      <ToastContainer position="bottom-right" theme="colored" newestOnTop closeOnClick pauseOnHover={false} />
    </>
  )
}

export default App
