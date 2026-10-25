import { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  ChevronLeft,
  ChevronRight,
  ChefHat,
  Loader2,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useAuth } from '../contexts';
import { MarkdownRenderer } from '../components';
import {
  getRecipe,
  getRecipeFilters,
  listRecipes,
} from '../services/api';
import type {
  RecipeBrief,
  RecipeDetail,
  RecipeFilters,
} from '../services/api';

const PAGE_SIZE = 24;

const DIFFICULTY_STYLE: Record<string, string> = {
  非常简单: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  简单: 'bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  中等: 'bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  困难: 'bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  非常困难: 'bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  未知: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300',
};

function difficultyClass(difficulty: string): string {
  return DIFFICULTY_STYLE[difficulty] || DIFFICULTY_STYLE['未知'];
}

export default function RecipesPage() {
  const { token } = useAuth();

  const [filters, setFilters] = useState<RecipeFilters>({
    categories: [],
    difficulties: [],
  });
  const [keyword, setKeyword] = useState('');
  const [debouncedKeyword, setDebouncedKeyword] = useState('');
  const [category, setCategory] = useState('');
  const [difficulty, setDifficulty] = useState('');
  const [items, setItems] = useState<RecipeBrief[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<RecipeDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedKeyword(keyword.trim());
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [keyword]);

  useEffect(() => {
    getRecipeFilters(token || undefined)
      .then(setFilters)
      .catch(() => {
        /* 筛选器加载失败不影响主列表 */
      });
  }, [token]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await listRecipes(
        {
          keyword: debouncedKeyword || undefined,
          category: category || undefined,
          difficulty: difficulty || undefined,
          limit: PAGE_SIZE,
          offset: page * PAGE_SIZE,
        },
        token || undefined
      );
      setItems(res.items);
      setTotal(res.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : '菜谱加载失败');
      setItems([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  }, [token, debouncedKeyword, category, difficulty, page]);

  useEffect(() => {
    load();
  }, [load]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const canPrev = page > 0;
  const canNext = page + 1 < pageCount;

  const openDetail = async (id: string) => {
    setDetailLoading(true);
    setDetail(null);
    try {
      const d = await getRecipe(id, token || undefined);
      setDetail(d);
    } catch (err) {
      setError(err instanceof Error ? err.message : '菜谱详情加载失败');
    } finally {
      setDetailLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex items-center gap-2 mb-1">
          <ChefHat className="w-6 h-6 text-orange-500" />
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-gray-100">
            菜谱浏览
          </h1>
        </div>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-5">
          共 {total} 道菜谱，直接查阅做法，不经过 AI。
        </p>

        <div className="relative mb-4">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="搜索菜名或食材，例如：番茄炒蛋"
            className="w-full pl-9 pr-9 py-2.5 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:ring-2 focus:ring-orange-500 focus:border-transparent outline-none text-sm"
          />
          {keyword && (
            <button
              onClick={() => setKeyword('')}
              aria-label="清空搜索"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {filters.categories.length > 0 && (
          <div className="mb-3">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">分类</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setCategory('');
                  setPage(0);
                }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  category === ''
                    ? 'border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200'
                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                全部
              </button>
              {filters.categories.map((c) => (
                <button
                  key={c.value}
                  onClick={() => {
                    setCategory(c.value);
                    setPage(0);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    category === c.value
                      ? 'border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200'
                      : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {c.value}
                  <span className="ml-1 opacity-60">{c.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {filters.difficulties.length > 0 && (
          <div className="mb-5">
            <div className="text-xs text-gray-500 dark:text-gray-400 mb-2">难度</div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => {
                  setDifficulty('');
                  setPage(0);
                }}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  difficulty === ''
                    ? 'border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200'
                    : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                不限
              </button>
              {filters.difficulties.map((d) => (
                <button
                  key={d.value}
                  onClick={() => {
                    setDifficulty(d.value);
                    setPage(0);
                  }}
                  className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                    difficulty === d.value
                      ? 'border-orange-400 bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-200'
                      : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                  }`}
                >
                  {d.value}
                  <span className="ml-1 opacity-60">{d.count}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg px-4 py-3">
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20 text-gray-500 dark:text-gray-400 gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">正在加载菜谱…</span>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-20 text-gray-500 dark:text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p className="text-sm">没有找到匹配的菜谱</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {items.map((it) => (
              <button
                key={it.id}
                onClick={() => openDetail(it.id)}
                className="text-left bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 hover:border-orange-300 dark:hover:border-orange-700 hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100 text-sm sm:text-base line-clamp-1">
                    {it.dish_name}
                  </h3>
                  <span
                    className={`shrink-0 text-[11px] px-2 py-0.5 rounded-full ${difficultyClass(
                      it.difficulty
                    )}`}
                  >
                    {it.difficulty}
                  </span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {it.category}
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 line-clamp-3 leading-relaxed">
                  {it.excerpt}
                </p>
              </button>
            ))}
          </div>
        )}

        {total > PAGE_SIZE && (
          <div className="flex items-center justify-center gap-3 mt-6 pb-4">
            <button
              disabled={!canPrev}
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <ChevronLeft className="w-4 h-4" />
              上一页
            </button>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              第 {page + 1} / {pageCount} 页
            </span>
            <button
              disabled={!canNext}
              onClick={() => setPage((p) => p + 1)}
              className="flex items-center gap-1 text-sm px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              下一页
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {(detail || detailLoading) && (
        <div
          className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-6"
          onClick={() => {
            setDetail(null);
            setDetailLoading(false);
          }}
        >
          <div
            className="bg-white dark:bg-gray-900 rounded-t-2xl sm:rounded-2xl w-full max-w-3xl max-h-[88vh] overflow-hidden flex flex-col shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3 px-5 py-4 border-b border-gray-200 dark:border-gray-800">
              <div className="min-w-0">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {detail?.dish_name || '加载中…'}
                </h2>
                {detail && (
                  <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 dark:text-gray-400">
                    <span>{detail.category}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full ${difficultyClass(detail.difficulty)}`}
                    >
                      {detail.difficulty}
                    </span>
                  </div>
                )}
              </div>
              <button
                onClick={() => {
                  setDetail(null);
                  setDetailLoading(false);
                }}
                aria-label="关闭"
                className="shrink-0 p-1.5 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="overflow-y-auto px-5 py-4">
              {detailLoading ? (
                <div className="flex items-center justify-center py-16 text-gray-500 gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">正在加载做法…</span>
                </div>
              ) : detail ? (
                <MarkdownRenderer content={detail.content} />
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
