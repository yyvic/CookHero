/** 本地存储：token、服务器地址、主题、收藏、最近浏览 */

const K = {
  TOKEN: 'chm_token',
  USERNAME: 'chm_username',
  API_BASE: 'chm_api_base', // 形如 http://192.168.1.100:8086，留空=同源
  THEME: 'chm_theme', // light | dark | system
  FAVORITES: 'chm_favorites',
  RECENTS: 'chm_recents',
} as const

export type ThemeMode = 'light' | 'dark' | 'system'

function read(key: string): string | null {
  try {
    return localStorage.getItem(key)
  } catch {
    return null
  }
}

function write(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* 忽略 */
  }
}

function readJson<T>(key: string, fallback: T): T {
  const raw = read(key)
  if (!raw) return fallback
  try {
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

/* ---------- 认证 ---------- */

export const getToken = () => read(K.TOKEN)
export const setToken = (t: string) => write(K.TOKEN, t)
export const getUsername = () => read(K.USERNAME) || ''
export const setUsername = (u: string) => write(K.USERNAME, u)

export function clearAuth() {
  try {
    localStorage.removeItem(K.TOKEN)
    localStorage.removeItem(K.USERNAME)
  } catch {
    /* 忽略 */
  }
}

/* ---------- 服务器地址 ---------- */

export const getApiOrigin = () => (read(K.API_BASE) || '').replace(/\/+$/, '')
export const setApiOrigin = (v: string) => write(K.API_BASE, v.trim().replace(/\/+$/, ''))

/** API 前缀：默认同源 /api/v1，用户可在「我的」里改成其它 IP:端口 */
export function apiBase(): string {
  const origin = getApiOrigin()
  return origin ? `${origin}/api/v1` : '/api/v1'
}

/* ---------- 主题 ---------- */

export const getTheme = (): ThemeMode => (read(K.THEME) as ThemeMode) || 'system'
export const setTheme = (t: ThemeMode) => write(K.THEME, t)

export function applyStoredTheme() {
  const mode = getTheme()
  const dark =
    mode === 'dark' ||
    (mode === 'system' && window.matchMedia?.('(prefers-color-scheme: dark)').matches)
  document.documentElement.classList.toggle('dark', !!dark)
}

/* ---------- 收藏 / 最近浏览 ---------- */

export interface RecipeBrief {
  id: string
  dish_name: string
  category?: string | null
  difficulty?: string | null
  excerpt?: string
}

export const getFavorites = (): RecipeBrief[] => readJson<RecipeBrief[]>(K.FAVORITES, [])

export function toggleFavorite(r: RecipeBrief): boolean {
  const list = getFavorites()
  const i = list.findIndex((x) => x.id === r.id)
  if (i >= 0) {
    list.splice(i, 1)
  } else {
    list.unshift(r)
  }
  write(K.FAVORITES, JSON.stringify(list.slice(0, 500)))
  return i < 0 // true = 已收藏
}

export const isFavorite = (id: string) => getFavorites().some((x) => x.id === id)

export function pushRecent(r: RecipeBrief) {
  const list = readJson<RecipeBrief[]>(K.RECENTS, []).filter((x) => x.id !== r.id)
  list.unshift(r)
  write(K.RECENTS, JSON.stringify(list.slice(0, 30)))
}

export const getRecents = (): RecipeBrief[] => readJson<RecipeBrief[]>(K.RECENTS, [])
