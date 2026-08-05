'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import { fieldsForDate, DailyTracker } from '@/lib/schedule'
import { todayStr, PLAN_START, PLAN_END } from '@/lib/date'

const MONTH_STYLES: Record<string, { bg: string; header: string }> = {
  '2026-07': { bg: 'bg-rose-50', header: 'text-rose-700' },
  '2026-08': { bg: 'bg-sky-50', header: 'text-sky-700' },
  '2026-09': { bg: 'bg-amber-50', header: 'text-amber-700' },
  '2026-10': { bg: 'bg-emerald-50', header: 'text-emerald-700' },
  '2026-11': { bg: 'bg-violet-50', header: 'text-violet-700' },
}

function monthLabel(ym: string) {
  const [y, m] = ym.split('-').map(Number)
  const d = new Date(y, m - 1, 1)
  return d.toLocaleString('en-US', { month: 'long', year: 'numeric' })
}

function daysInMonth(y: number, m: number) {
  return new Date(y, m, 0).getDate()
}

export default function History() {
  const [completionMap, setCompletionMap] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const today = todayStr()

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase.from('daily_tracker').select('*')
      if (error) console.error('History load error:', error.message)
      const map: Record<string, number> = {}
      for (const row of (data || []) as DailyTracker[]) {
        const fields = fieldsForDate(row.date)
        const done = fields.filter((f) => row[f.key as keyof DailyTracker]).length
        map[row.date] = fields.length ? Math.round((done / fields.length) * 100) : 0
      }
      setCompletionMap(map)
      setLoading(false)
    }
    load()
  }, [])

  const months = useMemo(() => {
    const start = new Date(PLAN_START + 'T00:00:00')
    const end = new Date(PLAN_END + 'T00:00:00')
    const list: string[] = []
    const cur = new Date(start.getFullYear(), start.getMonth(), 1)
    while (cur <= end) {
      list.push(`${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, '0')}`)
      cur.setMonth(cur.getMonth() + 1)
    }
    return list
  }, [])

  if (loading) return <main className="p-8 text-center text-gray-500">Loading...</main>

  return (
    <main className="max-w-4xl mx-auto p-6 space-y-10">
      <h2 className="text-2xl font-bold text-center">Your Prep Calendar</h2>
      <p className="text-center text-sm text-gray-500 -mt-6">
        28 Jul 2026 – 29 Nov 2026 · click any past or today&apos;s date to see that day&apos;s performance
      </p>

      {months.map((ym) => {
        const [y, m] = ym.split('-').map(Number)
        const style = MONTH_STYLES[ym] || { bg: 'bg-gray-50', header: 'text-gray-700' }
        const totalDays = daysInMonth(y, m)
        const firstWeekday = new Date(y, m - 1, 1).getDay()
        const cells: (string | null)[] = Array(firstWeekday).fill(null)
        for (let d = 1; d <= totalDays; d++) {
          const dateStr = `${y}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`
          if (dateStr >= PLAN_START && dateStr <= PLAN_END) cells.push(dateStr)
          else cells.push(null)
        }

        return (
          <section key={ym} className={`${style.bg} rounded-2xl p-5 shadow-sm border border-gray-200`}>
            <h3 className={`font-bold text-lg mb-3 ${style.header}`}>{monthLabel(ym)}</h3>
            <div className="grid grid-cols-7 gap-2 text-center text-xs font-medium text-gray-500 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
                <div key={d}>{d}</div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-2">
              {cells.map((dateStr, i) => {
                if (!dateStr) return <div key={i} />
                const isFuture = dateStr > today
                const pct = completionMap[dateStr]
                const dayNum = Number(dateStr.slice(-2))

                if (isFuture) {
                  return (
                    <div
                      key={dateStr}
                      className="aspect-square flex items-center justify-center rounded-lg bg-gray-100 text-gray-300 text-sm cursor-not-allowed"
                    >
                      {dayNum}
                    </div>
                  )
                }

                const intensity =
                  pct === undefined ? 'bg-white text-gray-700 border border-gray-200' :
                  pct >= 80 ? 'bg-green-500 text-white' :
                  pct >= 40 ? 'bg-yellow-400 text-white' :
                  pct > 0 ? 'bg-orange-400 text-white' :
                  'bg-red-200 text-red-800'

                return (
                  <Link
                    key={dateStr}
                    href={`/history/${dateStr}`}
                    className={`aspect-square flex items-center justify-center rounded-lg text-sm font-semibold hover:scale-105 transition ${intensity}`}
                  >
                    {dayNum}
                  </Link>
                )
              })}
            </div>
          </section>
        )
      })}
    </main>
  )
}