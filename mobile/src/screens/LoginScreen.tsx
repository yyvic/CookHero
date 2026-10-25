import { useState } from 'react'
import type { FormEvent } from 'react'
import { auth } from '../lib/api'
import { ChefIcon } from '../components/Icons'
import { getApiOrigin, setApiOrigin } from '../lib/store'

interface Props {
  onSuccess: (token: string, username: string) => void
}

export default function LoginScreen({ onSuccess }: Props) {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [origin, setOrigin] = useState(getApiOrigin())
  const [showServer, setShowServer] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!username.trim() || !password) {
      setError('请输入用户名和密码')
      return
    }
    setLoading(true)
    setError('')
    try {
      setApiOrigin(origin)
      const res =
        mode === 'login'
          ? await auth.login(username.trim(), password)
          : await auth.register(username.trim(), password)
      onSuccess(res.access_token, res.username || username.trim())
    } catch (err) {
      setError(err instanceof Error ? err.message : '请求失败')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-orange-100 via-orange-50 to-white px-6 dark:from-stone-900 dark:via-stone-950 dark:to-black">
      <div className="pt-safe w-full max-w-sm">
        <div className="mb-8 flex flex-col items-center">
          <div className="mb-3 flex h-20 w-20 items-center justify-center rounded-3xl bg-gradient-to-br from-orange-400 to-orange-600 text-white shadow-lg shadow-orange-500/30">
            <ChefIcon className="h-11 w-11" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">CookHero</h1>
          <p className="mt-1 text-sm text-stone-500 dark:text-stone-400">厨房英雄 · 移动端</p>
        </div>

        <form onSubmit={submit} className="card space-y-3 p-5">
          <input
            className="w-full rounded-xl bg-stone-50 px-4 py-3 text-[15px] outline-none ring-1 ring-stone-200 focus:ring-2 focus:ring-orange-400 dark:bg-stone-800 dark:ring-stone-700"
            placeholder="用户名"
            autoComplete="username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            className="w-full rounded-xl bg-stone-50 px-4 py-3 text-[15px] outline-none ring-1 ring-stone-200 focus:ring-2 focus:ring-orange-400 dark:bg-stone-800 dark:ring-stone-700"
            placeholder="密码"
            type="password"
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button
            type="button"
            onClick={() => setShowServer((v) => !v)}
            className="text-xs text-stone-500 underline-offset-2 hover:underline dark:text-stone-400"
          >
            {showServer ? '隐藏服务器设置' : '服务器地址（换 IP/端口时点这里）'}
          </button>

          {showServer && (
            <div className="space-y-1">
              <input
                className="w-full rounded-xl bg-stone-50 px-4 py-3 text-[15px] outline-none ring-1 ring-stone-200 focus:ring-2 focus:ring-orange-400 dark:bg-stone-800 dark:ring-stone-700"
                placeholder="留空 = 当前站点，如 http://192.168.1.100:8086"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
              />
              <p className="px-1 text-[11px] leading-4 text-stone-400">
                默认就是当前访问的站点，只有把后端部署在别处时才需要填。
              </p>
            </div>
          )}

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600 dark:bg-red-950/40 dark:text-red-400">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-orange-500 py-3 font-semibold text-white shadow-sm transition active:scale-[0.99] disabled:opacity-60"
          >
            {loading ? '请稍候…' : mode === 'login' ? '登录' : '注册并登录'}
          </button>

          <button
            type="button"
            onClick={() => {
              setMode(mode === 'login' ? 'register' : 'login')
              setError('')
            }}
            className="w-full text-center text-[13px] text-stone-500 dark:text-stone-400"
          >
            {mode === 'login' ? '还没有账号？注册一个' : '已有账号？去登录'}
          </button>
        </form>
      </div>
    </div>
  )
}
