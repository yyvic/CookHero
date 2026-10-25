import { useCallback, useEffect, useState } from 'react'
import { MEAL_LABELS, diet, type DailySummary, type DietLog } from '../lib/api'
import { PlusIcon, RefreshIcon, TrashIcon } from '../components/Icons'

const todayStr = (d = new Date()) => {
  const tz = d.getTimezoneOffset() * 60000
  return new Date(d.getTime() - tz).toISOString().slice(0, 10)
}

function shiftDate(date: string, days: number) {
  const d = new Date(`${date}T00:00:00`)
  d.setDate(d.getDate() + days)
  return todayStr(d)
}

const MACROS = [
  { key: 'total_protein' as const, label: '蛋白质', color: 'bg-rose-400' },
  { key: 'total_fat' as const, label: '脂肪', color: 'bg-amber-400' },
  { key: 'total_carbs' as const, label: '碳水', color: 'bg-sky-400' },
]

export default function DietScreen() {
  const [date, setDate] = useState(todayStr())
  const [summary, setSummary] = useState<DailySummary | null>(null)
  const [logs, setLogs] = useState<DietLog[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const [text, setText] = useState('')
  const [mealType, setMealType] = useState('')
  const [saving, setSaving] = useState(false)

  const load = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const [s, l] = await Promise.all([diet.daily(date), diet.logs(date)])
      setSummary(s)
      setLogs(l.logs || [])
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [date])

  useEffect(() => {
    load()
  }, [load])

  async function addLog() {
    const t = text.trim()
    if (!t) return
    setSaving(true)
    setError('')
    try {
      await diet.logFromText(t, { mealType: mealType || undefined, date })
      setText('')
      setMealType('')
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : '记录失败')
    } finally {
      setSaving(false)
    }
  }

  const macroTotal = MACROS.reduce((a, m) => a + ((summary?.[m.key] as number) || 0), 0)

  return (
    <div className="min-h-screen bg-orange-50/60 pb-20 dark:bg-stone-950">
      <header className="pt-safe sticky top-0 z-20 bg-orange-50/95 px-4 pb-2 backdrop-blur dark:bg-stone-950/95">
        <div className="flex items-center justify-between py-3">
          <h1 className="text-xl font-bold">饮食</h1>
          <button
            onClick={load}
            className="flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400"
          >
            <RefreshIcon className="h-3.5 w-3.5" />
            刷新
          </button>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-white px-2 py-1.5 ring-1 ring-stone-200 dark:bg-stone-900 dark:ring-stone-700">
          <button
            onClick={() => setDate(shiftDate(date, -1))}
            className="px-3 py-1 text-stone-500"
            aria-label="前一天"
          >
            ‹
          </button>
          <span className="text-sm font-medium">
            {date}
            {date === todayStr() && <span className="ml-1 text-xs text-orange-500">今天</span>}
          </span>
          <button
            onClick={() => setDate(shiftDate(date, 1))}
            disabled={date >= todayStr()}
            className="px-3 py-1 text-stone-500 disabled:opacity-30"
            aria-label="后一天"
          >
            ›
          </button>
        </div>
      </header>

      <main className="px-4 py-3">
        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}

        <section className="card p-4">
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs text-stone-500 dark:text-stone-400">今日热量</p>
              <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                {Math.round(summary?.total_calories || 0)}
                <span className="ml-1 text-sm font-normal text-stone-400">kcal</span>
              </p>
            </div>
            <p className="text-xs text-stone-400">
              {loading ? '加载中…' : `${summary?.log_count || 0} 条记录`}
            </p>
          </div>

          <div className="mt-3 flex h-1.5 overflow-hidden rounded-full bg-stone-100 dark:bg-stone-800">
            {macroTotal > 0 &&
              MACROS.map((m) => (
                <div
                  key={m.key}
                  className={m.color}
                  style={{ width: `${(((summary?.[m.key] as number) || 0) / macroTotal) * 100}%` }}
                />
              ))}
          </div>
          <div className="mt-2 flex gap-4 text-[12px] text-stone-500 dark:text-stone-400">
            {MACROS.map((m) => (
              <span key={m.key}>
                {m.label} {Math.round((summary?.[m.key] as number) || 0)}g
              </span>
            ))}
          </div>
        </section>

        <section className="mt-3 card p-3">
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="吃了什么？如「两个鸡蛋和一碗燕麦粥」"
              className="flex-1 rounded-xl bg-stone-50 px-3 py-2.5 text-[15px] outline-none ring-1 ring-stone-200 focus:ring-2 focus:ring-orange-400 dark:bg-stone-800 dark:ring-stone-700"
            />
            <button
              onClick={addLog}
              disabled={saving || !text.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-orange-500 text-white disabled:opacity-40"
              aria-label="记录"
            >
              {saving ? '…' : <PlusIcon className="h-5 w-5" />}
            </button>
          </div>
          <div className="no-scrollbar mt-2 flex gap-2 overflow-x-auto">
            {['', 'breakfast', 'lunch', 'dinner', 'snack'].map((v) => (
              <button
                key={v || 'auto'}
                onClick={() => setMealType(v)}
                className={`chip ${mealType === v ? 'chip-on' : 'chip-off'}`}
              >
                {v ? MEAL_LABELS[v] : '自动判断'}
              </button>
            ))}
          </div>
        </section>

        <section className="mt-4 space-y-2">
          {logs.length === 0 ? (
            <p className="py-10 text-center text-sm text-stone-400">这天还没有记录</p>
          ) : (
            logs.map((log, i) => {
              const items = log.items || []
              const kcal = items.reduce((a, it) => a + (it.calories || 0), 0)
              return (
                <div key={log.id || i} className="card p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[13px] font-medium text-orange-600 dark:text-orange-400">
                      {MEAL_LABELS[log.meal_type || ''] || log.meal_type || '未分类'}
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] text-stone-400">{Math.round(kcal)} kcal</span>
                      {log.id && (
                        <button
                          onClick={async () => {
                            await diet.removeLog(log.id!).catch(() => {})
                            load()
                          }}
                          className="text-stone-300"
                        >
                          <TrashIcon className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                  <ul className="mt-1.5 space-y-1">
                    {items.map((it, j) => (
                      <li key={j} className="flex justify-between text-[14px]">
                        <span>{it.food_name}</span>
                        <span className="text-stone-400">
                          {it.weight_g ? `${Math.round(it.weight_g)}g` : ''}
                          {it.calories ? ` · ${Math.round(it.calories)}kcal` : ''}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )
            })
          )}
        </section>
      </main>
    </div>
  )
}
