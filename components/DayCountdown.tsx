'use client'

import { useEffect, useState } from 'react'

function msUntilMidnight() {
  const now = new Date()
  const midnight = new Date(now)
  midnight.setHours(24, 0, 0, 0) // next midnight, local time
  return midnight.getTime() - now.getTime()
}

function formatHMS(ms: number) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const h = String(Math.floor(totalSeconds / 3600)).padStart(2, '0')
  const m = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, '0')
  const s = String(totalSeconds % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

export default function DayCountdown() {
  const [remaining, setRemaining] = useState<number | null>(null)

  useEffect(() => {
    setRemaining(msUntilMidnight())
    const interval = setInterval(() => {
      setRemaining(msUntilMidnight())
    }, 1000)
    return () => clearInterval(interval)
  }, [])

  if (remaining === null) {
    return (
      <div className="bg-gradient-to-br from-rose-500 to-orange-500 rounded-xl shadow-sm p-4 text-center text-white">
        <div className="text-xs uppercase tracking-wide opacity-80">Time Left Today</div>
        <div className="text-4xl font-extrabold mt-1 font-mono">--:--:--</div>
        <div className="text-xs opacity-80 mt-1">Resets at midnight</div>
      </div>
    )
  }

  const isUrgent = remaining < 60 * 60 * 1000 // under 1 hour left

  return (
    <div
      className={`rounded-xl shadow-sm p-4 text-center text-white bg-gradient-to-br ${
        isUrgent ? 'from-red-600 to-rose-700 animate-pulse' : 'from-rose-500 to-orange-500'
      }`}
    >
      <div className="text-xs uppercase tracking-wide opacity-80">Time Left Today</div>
      <div className="text-4xl font-extrabold mt-1 font-mono tabular-nums">{formatHMS(remaining)}</div>
      <div className="text-xs opacity-80 mt-1">Resets at midnight</div>
    </div>
  )
}