import { NavLink } from 'react-router-dom'
import { BookIcon, SparkIcon, UtensilsIcon, UserIcon } from './Icons'

const TABS = [
  { to: '/recipes', label: '菜谱', Icon: BookIcon },
  { to: '/chat', label: '助手', Icon: SparkIcon },
  { to: '/diet', label: '饮食', Icon: UtensilsIcon },
  { to: '/me', label: '我的', Icon: UserIcon },
]

export default function BottomNav() {
  return (
    <nav className="pb-safe fixed inset-x-0 bottom-0 z-30 border-t border-stone-200 bg-white/95 backdrop-blur dark:border-stone-800 dark:bg-stone-900/95">
      <div className="mx-auto flex max-w-lg">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] transition-colors ${
                isActive
                  ? 'text-orange-600 dark:text-orange-400'
                  : 'text-stone-400 dark:text-stone-500'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon className={isActive ? 'h-6 w-6' : 'h-6 w-6 opacity-80'} />
                <span className={isActive ? 'font-semibold' : ''}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
