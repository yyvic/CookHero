import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { recipes as recipesApi, type RecipeDetail } from '../lib/api'
import { isFavorite, pushRecent, toggleFavorite } from '../lib/store'
import { BackIcon, SparkIcon, StarIcon } from '../components/Icons'

export default function RecipeDetailScreen() {
  const { id = '' } = useParams()
  const navigate = useNavigate()
  const [data, setData] = useState<RecipeDetail | null>(null)
  const [error, setError] = useState('')
  const [fav, setFav] = useState(false)

  useEffect(() => {
    let alive = true
    setError('')
    setData(null)
    recipesApi
      .detail(id)
      .then((d) => {
        if (!alive) return
        setData(d)
        setFav(isFavorite(d.id))
        pushRecent({
          id: d.id,
          dish_name: d.dish_name,
          category: d.category,
          difficulty: d.difficulty,
          excerpt: d.content.slice(0, 60),
        })
      })
      .catch((e) => alive && setError(e instanceof Error ? e.message : '加载失败'))
    return () => {
      alive = false
    }
  }, [id])

  return (
    <div className="pb-safe min-h-screen bg-orange-50/60 dark:bg-stone-950">
      <header className="pt-safe sticky top-0 z-20 flex items-center gap-2 bg-orange-50/95 px-2 py-2 backdrop-blur dark:bg-stone-950/95">
        <button
          onClick={() => navigate(-1)}
          className="rounded-full p-2 text-stone-600 active:bg-stone-100 dark:text-stone-300 dark:active:bg-stone-800"
        >
          <BackIcon className="h-5 w-5" />
        </button>
        <h1 className="flex-1 truncate text-[15px] font-semibold">
          {data?.dish_name || '菜谱详情'}
        </h1>
        {data && (
          <button
            onClick={() => setFav(toggleFavorite(data))}
            className={`rounded-full p-2 ${fav ? 'text-orange-500' : 'text-stone-400'}`}
          >
            <StarIcon className="h-5 w-5" filled={fav} />
          </button>
        )}
      </header>

      {error ? (
        <p className="m-4 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600 dark:bg-red-950/40 dark:text-red-400">
          {error}
        </p>
      ) : !data ? (
        <div className="space-y-3 p-4">
          <div className="h-6 w-40 animate-pulse rounded bg-stone-200 dark:bg-stone-800" />
          <div className="h-64 animate-pulse rounded-2xl bg-stone-200/70 dark:bg-stone-800/70" />
        </div>
      ) : (
        <main className="px-4 pb-10">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {data.category && (
              <span className="rounded-full bg-orange-100 px-2.5 py-1 text-xs font-medium text-orange-700 dark:bg-stone-800 dark:text-orange-300">
                {data.category}
              </span>
            )}
            {data.difficulty && data.difficulty !== '未知' && (
              <span className="rounded-full bg-stone-100 px-2.5 py-1 text-xs text-stone-600 dark:bg-stone-800 dark:text-stone-300">
                难度 · {data.difficulty}
              </span>
            )}
          </div>

          <article className="card p-4">
            <div className="md-body">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{data.content}</ReactMarkdown>
            </div>
          </article>

          <button
            onClick={() => navigate('/chat', { state: { prompt: `${data.dish_name}怎么做？` } })}
            className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-3 font-semibold text-white shadow-sm active:scale-[0.99]"
          >
            <SparkIcon className="h-4 w-4" />
            让 AI 讲讲这道菜
          </button>
        </main>
      )}
    </div>
  )
}
