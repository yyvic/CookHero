import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { recipes as recipesApi, type RecipeBrief } from '../lib/api'
import { getFavorites, isFavorite, toggleFavorite } from '../lib/store'
import { DiceIcon, SearchIcon, StarIcon } from '../components/Icons'

const PAGE = 24

export default function RecipesScreen() {
  const navigate = useNavigate()
  const [keyword, setKeyword] = useState('')
  const [debounced, setDebounced] = useState('')
  const [category, setCategory] = useState('')
  const [difficulty, setDifficulty] = useState('')
  const [onlyFav, setOnlyFav] = useState(false)

  const [items, setItems] = useState<RecipeBrief[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')

  const [filters, setFilters] = useState<{ categories: { value: string; count: number }[]; difficulties: { value: string; count: number }[] }>({
    categories: [],
    difficulties: [],
  })
  const [daily, setDaily] = useState<RecipeBrief[]>([])

  const sentinel = useRef<HTMLDivElement | null>(null)
  const offsetRef = useRef(0)

  useEffect(() => {
    const t = setTimeout(() => setDebounced(keyword.trim()), 300)
    return () => clearTimeout(t)
  }, [keyword])

  // 分类/难度选项 + 今日推荐
  useEffect(() => {
    recipesApi
      .filters()
      .then(setFilters)
      .catch(() => {})
    recipesApi
      .random(3)
      .then((r) => setDaily(r.items))
      .catch(() => {})
  }, [])

  const load = useCallback(
    async (reset: boolean) => {
      if (onlyFav) return
      const offset = reset ? 0 : offsetRef.current
      if (reset) setLoading(true)
      else setLoadingMore(true)
      setError('')
      try {
        const res = await recipesApi.list({
          keyword: debounced || undefined,
          category: category || undefined,
          difficulty: difficulty || undefined,
          limit: PAGE,
          offset,
        })
        setItems((prev) => (reset ? res.items : [...prev, ...res.items]))
        setTotal(res.total)
        offsetRef.current = offset + res.items.length
      } catch (e) {
        setError(e instanceof Error ? e.message : '加载失败')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [debounced, category, difficulty, onlyFav],
  )

  useEffect(() => {
    offsetRef.current = 0
    load(true)
  }, [load])

  const favorited = useMemo(() => (onlyFav ? getFavorites() : []), [onlyFav])
  const shown = onlyFav ? favorited : items
  const hasMore = !onlyFav && items.length < total

  // 无限滚动
  useEffect(() => {
    if (onlyFav) return
    const el = sentinel.current
    if (!el) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading && !loadingMore) load(false)
      },
      { rootMargin: '300px' },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [hasMore, loading, loadingMore, load, onlyFav])

  return (
    <div className="pb-safe min-h-screen bg-orange-50/60 dark:bg-stone-950">
      <header className="pt-safe sticky top-0 z-20 bg-orange-50/95 px-4 pb-2 backdrop-blur dark:bg-stone-950/95">
        <div className="flex items-center justify-between py-3">
          <div>
            <h1 className="text-xl font-bold">菜谱</h1>
            <p className="text-xs text-stone-500 dark:text-stone-400">
              {onlyFav ? `收藏 ${favorited.length} 道` : `共 ${total} 道菜`}
            </p>
          </div>
          <button
            onClick={() => setOnlyFav((v) => !v)}
            className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium ${
              onlyFav
                ? 'bg-orange-500 text-white'
                : 'bg-white text-stone-600 ring-1 ring-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-700'
            }`}
          >
            <StarIcon className="h-4 w-4" filled={onlyFav} />
            收藏
          </button>
        </div>

        <div className="relative">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜菜名或食材，如「番茄」"
            className="w-full rounded-xl bg-white py-2.5 pl-9 pr-3 text-[15px] outline-none ring-1 ring-stone-200 placeholder:text-stone-400 focus:ring-2 focus:ring-orange-400 dark:bg-stone-900 dark:ring-stone-700"
          />
        </div>

        {!onlyFav && (
          <>
            <div className="no-scrollbar -mx-4 mt-2 flex gap-2 overflow-x-auto px-4 pb-1">
              <button
                onClick={() => setCategory('')}
                className={`chip ${category === '' ? 'chip-on' : 'chip-off'}`}
              >
                全部分类
              </button>
              {filters.categories.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCategory(c.value === category ? '' : c.value)}
                  className={`chip ${category === c.value ? 'chip-on' : 'chip-off'}`}
                >
                  {c.value}
                  <span className="ml-1 text-[11px] opacity-60">{c.count}</span>
                </button>
              ))}
            </div>
            <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
              <button
                onClick={() => setDifficulty('')}
                className={`chip ${difficulty === '' ? 'chip-on' : 'chip-off'}`}
              >
                难度不限
              </button>
              {filters.difficulties.map((d) => (
                <button
                  key={d.value}
                  onClick={() => setDifficulty(d.value === difficulty ? '' : d.value)}
                  className={`chip ${difficulty === d.value ? 'chip-on' : 'chip-off'}`}
                >
                  {d.value}
                </button>
              ))}
            </div>
          </>
        )}
      </header>

      {!onlyFav && daily.length > 0 && !debounced && !category && !difficulty && (
        <section className="px-4 pt-3">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-stone-700 dark:text-stone-300">今天吃点啥</h2>
            <button
              onClick={() => recipesApi.random(3).then((r) => setDaily(r.items))}
              className="flex items-center gap-1 text-xs text-orange-600 dark:text-orange-400"
            >
              <DiceIcon className="h-3.5 w-3.5" />
              换一批
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {daily.map((r) => (
              <button
                key={r.id}
                onClick={() => navigate(`/recipe/${r.id}`)}
                className="card p-2.5 text-left active:scale-[0.98]"
              >
                <div className="mb-1 flex h-9 w-9 items-center justify-center rounded-xl bg-orange-100 text-lg dark:bg-stone-800">
                  🍽️
                </div>
                <p className="line-clamp-2 text-[13px] font-medium leading-4">{r.dish_name}</p>
              </button>
            ))}
          </div>
        </section>
      )}

      <main className="px-4 pb-20 pt-3">
        {error && (
          <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card h-[76px] animate-pulse bg-white/60 dark:bg-stone-900" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="py-20 text-center text-sm text-stone-400">
            {onlyFav ? '还没有收藏的菜谱' : '没有找到匹配的菜谱'}
          </div>
        ) : (
          <ul className="space-y-2">
            {shown.map((r) => (
              <li key={r.id}>
                <div className="card flex items-start gap-3 p-3 active:scale-[0.995]">
                  <button className="flex-1 text-left" onClick={() => navigate(`/recipe/${r.id}`)}>
                    <div className="flex items-center gap-2">
                      <h3 className="text-[15px] font-semibold">{r.dish_name}</h3>
                      {r.difficulty && r.difficulty !== '未知' && (
                        <span className="rounded bg-orange-50 px-1.5 py-0.5 text-[11px] text-orange-600 dark:bg-stone-800 dark:text-orange-300">
                          {r.difficulty}
                        </span>
                      )}
                      {r.category && (
                        <span className="rounded bg-stone-100 px-1.5 py-0.5 text-[11px] text-stone-500 dark:bg-stone-800 dark:text-stone-400">
                          {r.category}
                        </span>
                      )}
                    </div>
                    {r.excerpt && (
                      <p className="mt-1 line-clamp-2 text-[13px] leading-5 text-stone-500 dark:text-stone-400">
                        {r.excerpt}
                      </p>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      toggleFavorite(r)
                      setItems((prev) => [...prev]) // 触发重渲染
                    }}
                    className={`shrink-0 p-1 ${
                      isFavorite(r.id) ? 'text-orange-500' : 'text-stone-300 dark:text-stone-600'
                    }`}
                    aria-label="收藏"
                  >
                    <StarIcon className="h-5 w-5" filled={isFavorite(r.id)} />
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}

        <div ref={sentinel} className="h-4" />
        {loadingMore && <p className="py-3 text-center text-xs text-stone-400">加载中…</p>}
        {!hasMore && shown.length > 0 && (
          <p className="py-3 text-center text-xs text-stone-400">已经到底啦</p>
        )}
      </main>
    </div>
  )
}
