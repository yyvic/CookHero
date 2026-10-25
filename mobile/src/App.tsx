import { useCallback, useEffect, useState } from 'react'
import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import BottomNav from './components/BottomNav'
import LoginScreen from './screens/LoginScreen'
import RecipesScreen from './screens/RecipesScreen'
import RecipeDetailScreen from './screens/RecipeDetailScreen'
import ChatScreen from './screens/ChatScreen'
import DietScreen from './screens/DietScreen'
import MeScreen from './screens/MeScreen'
import { clearAuth, getToken, setToken, setUsername } from './lib/store'

const TAB_PATHS = ['/recipes', '/chat', '/diet', '/me']

export default function App() {
  const [token, setTokenState] = useState<string | null>(getToken())
  const location = useLocation()

  useEffect(() => {
    const onUnauthorized = () => setTokenState(null)
    window.addEventListener('chm-unauthorized', onUnauthorized)
    return () => window.removeEventListener('chm-unauthorized', onUnauthorized)
  }, [])

  const handleLogin = useCallback((t: string, username: string) => {
    setToken(t)
    setUsername(username)
    setTokenState(t)
  }, [])

  const handleLogout = useCallback(() => {
    clearAuth()
    setTokenState(null)
  }, [])

  if (!token) return <LoginScreen onSuccess={handleLogin} />

  const showNav = TAB_PATHS.some((p) => location.pathname === p)

  return (
    <div className="min-h-screen">
      <Routes>
        <Route path="/" element={<Navigate to="/recipes" replace />} />
        <Route path="/recipes" element={<RecipesScreen />} />
        <Route path="/recipe/:id" element={<RecipeDetailScreen />} />
        <Route path="/chat" element={<ChatScreen />} />
        <Route path="/diet" element={<DietScreen />} />
        <Route path="/me" element={<MeScreen onLogout={handleLogout} />} />
        <Route path="*" element={<Navigate to="/recipes" replace />} />
      </Routes>
      {showNav && <BottomNav />}
    </div>
  )
}
