import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import {
  conversations,
  streamChat,
  type ConversationSummary,
  type HistoryMessage,
  type SSEEvent,
} from '../lib/api'
import { BackIcon, PlusIcon, SendIcon, SparkIcon, StopIcon, TrashIcon } from '../components/Icons'

interface Msg {
  role: 'user' | 'assistant'
  content: string
  thinking?: string
  sources?: { type: string; info: string }[]
}

const QUICK = ['今天吃什么？', '番茄炒蛋怎么做', '一人食快手菜推荐', '冰箱里只有鸡蛋和西红柿']

export default function ChatScreen() {
  const location = useLocation()
  const [messages, setMessages] = useState<Msg[]>([])
  const [input, setInput] = useState('')
  const [busy, setBusy] = useState(false)
  const [thinking, setThinking] = useState('')
  const [conversationId, setConversationId] = useState<string | undefined>()
  const [drawer, setDrawer] = useState(false)
  const [history, setHistory] = useState<ConversationSummary[]>([])
  const [error, setError] = useState('')

  const abortRef = useRef<AbortController | null>(null)
  const listRef = useRef<HTMLDivElement | null>(null)

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      const el = listRef.current
      if (el) el.scrollTop = el.scrollHeight
    })
  }

  useEffect(scrollToBottom, [messages, thinking])

  // 从菜谱详情跳转过来时自动提问
  useEffect(() => {
    const prompt = (location.state as { prompt?: string } | null)?.prompt
    if (prompt) {
      setInput(prompt)
      send(prompt)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function send(text: string) {
    const content = text.trim()
    if (!content || busy) return
    setInput('')
    setError('')
    setMessages((prev) => [...prev, { role: 'user', content }, { role: 'assistant', content: '' }])
    setBusy(true)
    setThinking('')

    const controller = new AbortController()
    abortRef.current = controller

    const onEvent = (e: SSEEvent) => {
      switch (e.type) {
        case 'thinking':
          setThinking((t) => t + (e.content || ''))
          break
        case 'text':
          setThinking('')
          setMessages((prev) => {
            const next = [...prev]
            const last = next[next.length - 1]
            if (last && last.role === 'assistant') {
              next[next.length - 1] = { ...last, content: last.content + (e.content || '') }
            }
            return next
          })
          break
        case 'sources':
          if (Array.isArray(e.data)) {
            const src = e.data as { type: string; info: string }[]
            setMessages((prev) => {
              const next = [...prev]
              const last = next[next.length - 1]
              if (last && last.role === 'assistant') next[next.length - 1] = { ...last, sources: src }
              return next
            })
          }
          break
        case 'done':
        case 'session':
          if (e.conversation_id) setConversationId(e.conversation_id)
          break
        case 'error':
          setError(typeof e.error === 'string' ? e.error : (e.content || '生成失败'))
          break
        default:
          break
      }
    }

    try {
      await streamChat({ message: content, conversation_id: conversationId }, { onEvent, signal: controller.signal })
    } catch (err) {
      if (!(err instanceof DOMException && err.name === 'AbortError')) {
        setError(err instanceof Error ? err.message : '请求失败')
      }
    } finally {
      setBusy(false)
      setThinking('')
      abortRef.current = null
    }
  }

  function stop() {
    abortRef.current?.abort()
    setBusy(false)
  }

  function newChat() {
    stop()
    setMessages([])
    setConversationId(undefined)
    setError('')
  }

  async function openDrawer() {
    setDrawer(true)
    try {
      const res = await conversations.list(30, 0)
      setHistory(res.conversations || [])
    } catch {
      /* 忽略 */
    }
  }

  async function openConversation(id: string) {
    try {
      const res = await conversations.history(id)
      const msgs: Msg[] = (res.messages as HistoryMessage[]).map((m) => ({
        role: m.role,
        content: m.content || '',
        sources: m.sources?.map((s) => ({ type: s.type, info: s.info })),
      }))
      setMessages(msgs)
      setConversationId(id)
      setDrawer(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : '加载失败')
    }
  }

  return (
    <div className="flex h-[100dvh] flex-col bg-orange-50/60 dark:bg-stone-950">
      <header className="pt-safe sticky top-0 z-20 flex items-center gap-2 bg-orange-50/95 px-2 py-2 backdrop-blur dark:bg-stone-950/95">
        <button
          onClick={openDrawer}
          className="rounded-full p-2 text-stone-600 active:bg-stone-100 dark:text-stone-300 dark:active:bg-stone-800"
          aria-label="历史会话"
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M4 6h16M4 12h16M4 18h10" strokeLinecap="round" />
          </svg>
        </button>
        <h1 className="flex-1 text-[15px] font-semibold">AI 烹饪助手</h1>
        <button
          onClick={newChat}
          className="flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-xs font-medium text-stone-600 ring-1 ring-stone-200 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-700"
        >
          <PlusIcon className="h-3.5 w-3.5" />
          新对话
        </button>
      </header>

      <div ref={listRef} className="flex-1 overflow-y-auto px-4 py-3">
        {messages.length === 0 && !busy && (
          <div className="mt-10 text-center">
            <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-orange-400 to-orange-600 text-white">
              <SparkIcon className="h-7 w-7" />
            </div>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              想吃什么、怎么做、有什么食材都能问
            </p>
            <div className="mt-5 flex flex-wrap justify-center gap-2">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="rounded-full bg-white px-3 py-2 text-[13px] text-stone-600 ring-1 ring-stone-200 active:scale-95 dark:bg-stone-900 dark:text-stone-300 dark:ring-stone-700"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="space-y-3">
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-[15px] leading-6 ${
                  m.role === 'user'
                    ? 'bg-orange-500 text-white'
                    : 'bg-white text-stone-800 ring-1 ring-black/5 dark:bg-stone-900 dark:text-stone-100 dark:ring-white/10'
                }`}
              >
                {m.content ? (
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                ) : (
                  busy && <span className="inline-block h-4 w-1.5 animate-pulse bg-orange-400" />
                )}
                {m.sources && m.sources.length > 0 && (
                  <div className="mt-2 border-t border-black/5 pt-2 text-[12px] text-stone-500 dark:border-white/10 dark:text-stone-400">
                    {m.sources.slice(0, 3).map((s, j) => (
                      <p key={j} className="truncate">
                        · {s.info}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {thinking && (
            <div className="max-w-[85%] rounded-2xl bg-white px-3.5 py-2.5 text-[13px] text-stone-400 ring-1 ring-black/5 dark:bg-stone-900 dark:ring-white/10">
              思考中…{thinking.slice(-40)}
            </div>
          )}
        </div>

        {error && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[13px] text-red-600 dark:bg-red-950/40 dark:text-red-400">
            {error}
          </p>
        )}
      </div>

      <div className="pb-safe border-t border-stone-200 bg-white/95 px-3 pt-2 dark:border-stone-800 dark:bg-stone-900/95">
        <div className="flex items-end gap-2 pb-16">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            rows={1}
            placeholder="问问 CookHero…"
            className="max-h-28 flex-1 resize-none rounded-2xl bg-stone-100 px-4 py-2.5 text-[15px] outline-none dark:bg-stone-800"
          />
          {busy ? (
            <button
              onClick={stop}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-stone-200 text-stone-600 dark:bg-stone-700 dark:text-stone-200"
            >
              <StopIcon className="h-4 w-4" />
            </button>
          ) : (
            <button
              onClick={() => send(input)}
              disabled={!input.trim()}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-orange-500 text-white disabled:opacity-40"
            >
              <SendIcon className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {drawer && (
        <div className="fixed inset-0 z-40 flex">
          <div className="flex-1 bg-black/40" onClick={() => setDrawer(false)} />
          <div className="pt-safe flex w-4/5 max-w-xs flex-col bg-white dark:bg-stone-900">
            <div className="flex items-center gap-2 border-b border-stone-200 px-3 py-3 dark:border-stone-800">
              <button onClick={() => setDrawer(false)} className="p-1">
                <BackIcon className="h-5 w-5" />
              </button>
              <h2 className="flex-1 font-semibold">历史会话</h2>
            </div>
            <div className="flex-1 overflow-y-auto">
              {history.length === 0 ? (
                <p className="p-6 text-center text-sm text-stone-400">暂无历史会话</p>
              ) : (
                history.map((c) => (
                  <div
                    key={c.id}
                    className="flex items-center gap-2 border-b border-stone-100 px-3 py-3 dark:border-stone-800"
                  >
                    <button className="flex-1 text-left" onClick={() => openConversation(c.id)}>
                      <p className="truncate text-[14px] font-medium">
                        {c.title || c.last_message_preview || '（无标题）'}
                      </p>
                      <p className="mt-0.5 text-[11px] text-stone-400">
                        {c.message_count} 条 · {new Date(c.updated_at).toLocaleDateString('zh-CN')}
                      </p>
                    </button>
                    <button
                      onClick={async () => {
                        await conversations.remove(c.id).catch(() => {})
                        setHistory((h) => h.filter((x) => x.id !== c.id))
                        if (conversationId === c.id) newChat()
                      }}
                      className="p-1 text-stone-300"
                    >
                      <TrashIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
