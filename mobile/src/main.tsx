import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import App from './App'
import './index.css'
import { applyStoredTheme } from './lib/store'

applyStoredTheme()

const base = import.meta.env.BASE_URL || '/m/'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={base}>
      <App />
    </BrowserRouter>
  </StrictMode>,
)

// 注册 Service Worker（离线壳 + 菜谱缓存）
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(`${base}sw.js`).catch(() => {
      /* 注册失败不影响使用 */
    })
  })
}
