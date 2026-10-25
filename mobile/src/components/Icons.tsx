/** 轻量内联图标（避免额外依赖） */

import type { ReactNode } from 'react'

type P = { className?: string }

const base = 'h-5 w-5'

function Svg({ className, children }: P & { children: ReactNode }) {
  return (
    <svg
      className={className ?? base}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export const BookIcon = (p: P) => (
  <Svg {...p}>
    <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
    <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
  </Svg>
)

export const SparkIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9z" />
    <path d="M19 15l.8 2.2L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.8z" />
  </Svg>
)

export const UtensilsIcon = (p: P) => (
  <Svg {...p}>
    <path d="M3 2v7a3 3 0 0 0 3 3v10M3 2h0M9 2v7a3 3 0 0 0 3 3" />
    <path d="M15 2h6l-2 8a3 3 0 0 1-3 2 3 3 0 0 1-3-2z" />
    <path d="M15 12v10" />
  </Svg>
)

export const UserIcon = (p: P) => (
  <Svg {...p}>
    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
    <circle cx="12" cy="7" r="4" />
  </Svg>
)

export const SearchIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="8" />
    <path d="m21 21-4.3-4.3" />
  </Svg>
)

export const StarIcon = ({ filled, className }: P & { filled?: boolean }) => (
  <svg
    className={className ?? base}
    viewBox="0 0 24 24"
    fill={filled ? 'currentColor' : 'none'}
    stroke="currentColor"
    strokeWidth={1.8}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.8-5.2 2.8 1-5.8L3.5 9.7l5.9-.9z" />
  </svg>
)

export const BackIcon = (p: P) => (
  <Svg {...p}>
    <path d="m15 18-6-6 6-6" />
  </Svg>
)

export const SendIcon = (p: P) => (
  <Svg {...p}>
    <path d="M22 2 11 13" />
    <path d="M22 2l-7 20-4-9-9-4z" />
  </Svg>
)

export const PlusIcon = (p: P) => (
  <Svg {...p}>
    <path d="M12 5v14M5 12h14" />
  </Svg>
)

export const CloseIcon = (p: P) => (
  <Svg {...p}>
    <path d="M18 6 6 18M6 6l12 12" />
  </Svg>
)

export const TrashIcon = (p: P) => (
  <Svg {...p}>
    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
  </Svg>
)

export const DiceIcon = (p: P) => (
  <Svg {...p}>
    <rect x="3" y="3" width="18" height="18" rx="4" />
    <circle cx="8.5" cy="8.5" r="1.2" fill="currentColor" />
    <circle cx="15.5" cy="15.5" r="1.2" fill="currentColor" />
    <circle cx="12" cy="12" r="1.2" fill="currentColor" />
  </Svg>
)

export const SunIcon = (p: P) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
  </Svg>
)

export const MoonIcon = (p: P) => (
  <Svg {...p}>
    <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
  </Svg>
)

export const RefreshIcon = (p: P) => (
  <Svg {...p}>
    <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
    <path d="M21 3v5h-5" />
  </Svg>
)

export const ChefIcon = (p: P) => (
  <Svg {...p}>
    <path d="M7 21h10v-3a4 4 0 0 0-1.2-2.9A5 5 0 0 0 7 18z" />
    <path d="M17 15.5c1.6-1.2 3-3.4 3-6.5a4 4 0 0 0-3-3.9A3.5 3.5 0 0 0 12 3a3.5 3.5 0 0 0-5 2.1A4 4 0 0 0 4 9c0 3.1 1.4 5.3 3 6.5" />
  </Svg>
)

export const StopIcon = (p: P) => (
  <Svg {...p}>
    <rect x="6" y="6" width="12" height="12" rx="2" fill="currentColor" />
  </Svg>
)
