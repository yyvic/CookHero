import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { auth } from '../lib/api'
import {
  applyStoredTheme,
  getApiOrigin,
  getFavorites,
  getRecents,
  getTheme,
  getUsername,
  setApiOrigin,
  setTheme,
  type ThemeMode,
} from '../lib/store'
import { ChefIcon, MoonIcon, SunIcon } from '../components/Icons'

interface Props {
  onLogout: () => void
}

export default function MeScreen({ onLogout }: Props) {
  const navigate = useNavigate()
  const [origin, setOrigin] = useState(getApiOrigin())
  const [theme, setThemeState] = useState<ThemeMode>(getTheme())
  const [testResult, setTestResult] = useState('')
  const [editing, setEditing] = useState(false)

  const favorites = getFavorites()
  const recents = getRecents()

  const switchTheme = (t: ThemeMode) => {
    setTheme(t)
    setThemeState(t)
    applyStoredTheme()
  }

  const saveOrigin = async () => {
    setApiOrigin(origin)
    setEditing(false)
    setTestResult('已保存，测试中…')
    try {
      await auth.me()
      setTestResult('连接正常 ✅')
    } catch (e) {
      setTestResult(e instanceof Error ? `连接失败：${e.message}` : '连接失败')
    }
  }

  return (
    <div className="min-h-screen bg-orange-50/60 pb-20 dark:bg-stone-950">
      <header className="pt-safe bg-orange-50/95 px-4 pb-3 pt-3 dark:bg-stone-950/95">
        <h1 className="text-xl font-bold">我的</h1>
      </header>

      <main className="space-y-3 px-4">
        <section className="card flex items-center gap-3 p-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-white">
            <ChefIcon className="h-6 w-6" />
          </div>
          <div className="flex-1">
            <p className="font-semibold">{getUsername() || '未登录'}</p>
            <p className="text-xs text-stone-400">CookHero 厨房英雄</p>
          </div>
        </section>

        <section className="card divide-y divide-stone-100 dark:divide-stone-800">
          <button
            onClick={() => navigate('/recipes')}
            className="flex w-full items-center justify-between px-4 py-3 text-[15px]"
          >
            <span>我的收藏</span>
            <span className="text-stone-400">{favorites.length} 道</span>
          </button>
          <div className="px-4 py-3">
            <p className="text-[15px]">最近浏览</p>
            {recents.length === 0 ? (
              <p className="mt-1 text-xs text-stone-400">还没有浏览记录</p>
            ) : (
              <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
                {recents.slice(0, 10).map((r) => (
                  <button
                    key={r.id}
                    onClick={() => navigate(`/recipe/${r.id}`)}
                    className="shrink-0 rounded-lg bg-stone-100 px-2.5 py-1.5 text-[13px] dark:bg-stone-800"
                  >
                    {r.dish_name}
                  </button>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="card p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[15px] font-medium">服务器地址</p>
              <p className="mt-0.5 text-xs text-stone-400">
                {getApiOrigin() || '当前站点（同源）'}
              </p>
            </div>
            <button
              onClick={() => setEditing((v) => !v)}
              className="rounded-full bg-stone-100 px-3 py-1.5 text-xs dark:bg-stone-800"
            >
              {editing ? '取消' : '修改'}
            </button>
          </div>
          {editing && (
            <div className="mt-3 space-y-2">
              <input
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                placeholder="http://192.168.1.100:8086"
                className="w-full rounded-xl bg-stone-50 px-3 py-2.5 text-[15px] outline-none ring-1 ring-stone-200 focus:ring-2 focus:ring-orange-400 dark:bg-stone-800 dark:ring-stone-700"
              />
              <button
                onClick={saveOrigin}
                className="w-full rounded-xl bg-orange-500 py-2.5 text-sm font-medium text-white"
              >
                保存并测试连接
              </button>
            </div>
          )}
          {testResult && <p className="mt-2 text-xs text-stone-500">{testResult}</p>}
        </section>

        <section className="card p-4">
          <p className="mb-2 text-[15px] font-medium">主题</p>
          <div className="flex gap-2">
            {(
              [
                { v: 'light', label: '浅色', Icon: SunIcon },
                { v: 'dark', label: '深色', Icon: MoonIcon },
                { v: 'system', label: '跟随系统', Icon: ChefIcon },
              ] as { v: ThemeMode; label: string; Icon: typeof SunIcon }[]
            ).map(({ v, label, Icon }) => (
              <button
                key={v}
                onClick={() => switchTheme(v)}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2.5 text-xs ${
                  theme === v
                    ? 'bg-orange-500 text-white'
                    : 'bg-stone-100 text-stone-600 dark:bg-stone-800 dark:text-stone-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                {label}
              </button>
            ))}
          </div>
        </section>

        <button
          onClick={onLogout}
          className="w-full rounded-xl bg-white py-3 text-[15px] font-medium text-red-600 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700"
        >
          退出登录
        </button>

        <p className="pb-6 pt-2 text-center text-[11px] leading-4 text-stone-400">
          手机浏览器打开后，用「添加到主屏幕」即可当 App 使用
        </p>
      </main>
    </div>
  )
}
