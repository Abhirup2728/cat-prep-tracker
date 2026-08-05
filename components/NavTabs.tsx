'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const tabs = [
  { href: '/', label: 'Today' },
  { href: '/history', label: 'History' },
  { href: '/dashboard', label: 'Dashboard' },
]

export default function NavTabs() {
  const pathname = usePathname()
  return (
    <div className="flex gap-1 bg-white/70 backdrop-blur rounded-full p-1 shadow-sm border border-gray-200">
      {tabs.map((t) => {
        const active = pathname === t.href
        return (
          <Link
            key={t.href}
            href={t.href}
            className={`px-5 py-2 rounded-full text-sm font-medium transition ${
              active ? 'bg-indigo-600 text-white shadow' : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {t.label}
          </Link>
        )
      })}
    </div>
  )
}