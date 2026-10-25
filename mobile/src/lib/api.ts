/** 后端 REST / SSE 接口封装（与桌面版同源，默认 /api/v1） */

import { apiBase, getToken, clearAuth } from './store'

export interface RecipeBrief {
  id: string
  dish_name: string
  category: string | null
  difficulty: string | null
  excerpt?: string
}

export interface RecipeDetail extends RecipeBrief {
  source: string | null
  content: string
}

export interface RecipeFilters {
  categories: { value: string; count: number }[]
  difficulties: { value: string; count: number }[]
}

export interface ConversationSummary {
  id: string
  title?: string
  created_at: string
  updated_at: string
  message_count: number
  last_message_preview?: string | null
}

export interface HistoryMessage {
  role: 'user' | 'assistant'
  content: string
  timestamp?: string
  sources?: { type: string; info: string; url?: string }[]
}

export interface SSEEvent {
  type: string
  content?: string
  data?: unknown
  conversation_id?: string
  title?: string
  error?: string
}

export class UnauthorizedError extends Error {}

async function parseError(res: Response): Promise<string> {
  if (res.status === 401) {
    clearAuth()
    window.dispatchEvent(new Event('chm-unauthorized'))
    throw new UnauthorizedError('登录已失效，请重新登录')
  }
  try {
    const ct = res.headers.get('content-type') || ''
    if (ct.includes('application/json')) {
      const body = await res.json()
      const d = body?.detail
      if (typeof d === 'string') return d
      if (Array.isArray(d)) return d.map((e: { msg?: string }) => e.msg || '').join('，')
      return body?.message || JSON.stringify(body)
    }
    return await res.text()
  } catch {
    return `请求失败（HTTP ${res.status}）`
  }
}

function authHeaders(): HeadersInit {
  const t = getToken()
  return t ? { Authorization: `Bearer ${t}` } : {}
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${apiBase()}${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init.headers || {}) },
  })
  if (!res.ok) throw new Error(await parseError(res))
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

const qs = (params: Record<string, string | number | undefined>) => {
  const u = new URLSearchParams()
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') u.set(k, String(v))
  })
  const s = u.toString()
  return s ? `?${s}` : ''
}

/* ------------------------------ 认证 ------------------------------ */

export const auth = {
  login: (username: string, password: string) =>
    request<{ access_token: string; token_type?: string; username?: string }>('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),
  register: (username: string, password: string) =>
    request<{ access_token: string; username?: string }>('/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    }),
  me: () => request<{ username: string; [k: string]: unknown }>('/user/profile'),
}

/* ------------------------------ 菜谱 ------------------------------ */

export const recipes = {
  filters: () => request<RecipeFilters>('/recipes/filters'),
  list: (params: {
    keyword?: string
    category?: string
    difficulty?: string
    limit?: number
    offset?: number
  }) =>
    request<{ items: RecipeBrief[]; total: number; limit: number; offset: number }>(
      `/recipes${qs(params)}`,
    ),
  random: (limit = 3) =>
    request<{ items: RecipeBrief[]; total: number }>(`/recipes/random?limit=${limit}`),
  detail: (id: string) => request<RecipeDetail>(`/recipes/${id}`),
}

/* ------------------------------ 对话（SSE） ------------------------------ */

export async function streamChat(
  payload: { message: string; conversation_id?: string; stream?: boolean },
  handlers: {
    onEvent: (e: SSEEvent) => void
    signal?: AbortSignal
  },
): Promise<void> {
  const res = await fetch(`${apiBase()}/conversation`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ ...payload, stream: true }),
    signal: handlers.signal,
  })

  if (!res.ok) throw new Error(await parseError(res))
  if (!res.body) throw new Error('服务端未返回数据流')

  const reader = res.body.getReader()
  const decoder = new TextDecoder()
  let buffer = ''

  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) {
        if (buffer.trim()) flush(buffer, handlers.onEvent)
        break
      }
      buffer += decoder.decode(value, { stream: true })
      const lines = buffer.split('\n')
      buffer = lines.pop() || ''
      lines.forEach((line) => flush(line, handlers.onEvent))
    }
  } finally {
    try {
      await reader.cancel()
    } catch {
      /* 忽略 */
    }
    reader.releaseLock()
  }
}

function flush(line: string, onEvent: (e: SSEEvent) => void) {
  const t = line.trim()
  if (!t.startsWith('data:')) return
  const raw = t.slice(5).trim()
  if (!raw || raw === '[DONE]') return
  try {
    onEvent(JSON.parse(raw) as SSEEvent)
  } catch {
    /* 忽略无法解析的行 */
  }
}

export const conversations = {
  list: (limit = 30, offset = 0) =>
    request<{ conversations: ConversationSummary[]; total_count: number }>(
      `/conversation${qs({ limit, offset })}`,
    ),
  history: (id: string) =>
    request<{ conversation_id: string; messages: HistoryMessage[] }>(`/conversation/${id}`),
  remove: (id: string) => request<unknown>(`/conversation/${id}`, { method: 'DELETE' }),
}

/* ------------------------------ 饮食 ------------------------------ */

export interface DailySummary {
  date: string
  total_calories: number
  total_protein: number
  total_fat: number
  total_carbs: number
  meals_logged: string[]
  log_count: number
}

export interface DietLogItem {
  id?: string
  food_name: string
  weight_g?: number | null
  calories?: number | null
  protein?: number | null
  fat?: number | null
  carbs?: number | null
  meal_type?: string
}

export interface DietLog {
  id?: string
  log_date?: string
  meal_type?: string
  notes?: string | null
  items?: DietLogItem[]
}

export const diet = {
  daily: (date: string) => request<DailySummary>(`/diet/analysis/daily${qs({ target_date: date })}`),
  logs: (date: string) => request<{ logs: DietLog[]; date: string }>(`/diet/logs${qs({ log_date: date })}`),
  logFromText: (text: string, opts?: { mealType?: string; date?: string }) =>
    request<DietLog>('/diet/logs/from-text', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, meal_type: opts?.mealType, log_date: opts?.date }),
    }),
  removeLog: (id: string) => request<unknown>(`/diet/logs/${id}`, { method: 'DELETE' }),
}

export const MEAL_LABELS: Record<string, string> = {
  breakfast: '早餐',
  lunch: '午餐',
  dinner: '晚餐',
  snack: '加餐',
}
