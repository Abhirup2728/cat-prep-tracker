'use client'

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { fieldsForDate, DailyTracker, CATEGORY_STYLES } from '@/lib/schedule'
import { todayStr, formatFullDate, isWeekend, daysRemaining, PLAN_END } from '@/lib/date'
import { quoteForDate } from '@/lib/quotes'
import DayCountdown from '@/components/DayCountdown'

export default function Home() {
  const [date] = useState(todayStr())
  const [row, setRow] = useState<Partial<DailyTracker>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const fields = fieldsForDate(date)
  const weekend = isWeekend(date)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('daily_tracker')
        .select('*')
        .eq('date', date)
        .maybeSingle()

      if (error) console.error('Supabase load error:', error.message, error)
      setRow(data || { date })
      setLoading(false)
    }
    load()
  }, [date])

  async function toggle(key: string) {
    const newValue = !row[key as keyof DailyTracker]
    const updated = { ...row, [key]: newValue, date }
    setRow(updated)
    setSaving(true)

    const { error } = await supabase
      .from('daily_tracker')
      .upsert(updated, { onConflict: 'date' })

    if (error) console.error(error)
    setSaving(false)
  }

  if (loading) return <main className="p-8 text-center text-gray-500">Loading...</main>

  const doneCount = fields.filter((f) => row[f.key as keyof DailyTracker]).length
  const completion = Math.round((doneCount / fields.length) * 100)

  return (
    <main className="max-w-xl mx-auto p-6">
      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold">{formatFullDate(date)}</h2>
        <p className="text-sm text-gray-500 mt-1">
          {weekend ? 'Weekend' : 'Weekday'} · {saving ? 'Saving...' : 'All changes saved'}
        </p>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-xl shadow-sm p-4 text-center text-white">
          <div className="text-xs uppercase tracking-wide opacity-80">Days to CAT</div>
          <div className="text-4xl font-extrabold mt-1">{daysRemaining()}</div>
          <div className="text-xs opacity-80 mt-1">{formatFullDate(PLAN_END)}</div>
        </div>
        <DayCountdown />
      </div>

      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4 text-center">
        <p className="text-sm italic text-gray-600">&ldquo;{quoteForDate(date)}&rdquo;</p>
      </div>

      <div className="mb-6 bg-white rounded-xl shadow-sm border border-gray-200 p-4">
        <div className="flex justify-between text-sm mb-2 font-medium">
          <span>Today&apos;s Completion</span>
          <span>{completion}%</span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-emerald-400 to-green-600 h-3 rounded-full transition-all"
            style={{ width: `${completion}%` }}
          />
        </div>
      </div>

      <ul className="space-y-2">
        {fields.map((f) => {
          const style = CATEGORY_STYLES[f.category]
          const checked = !!row[f.key as keyof DailyTracker]
          return (
            <li key={f.key}>
              <label
                className={`flex items-center gap-3 p-3 rounded-lg border-2 cursor-pointer transition ${style.bg} ${style.border} ${
                  checked ? 'opacity-100' : 'opacity-80 hover:opacity-100'
                }`}
              >
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={() => toggle(f.key)}
                  className={`w-5 h-5 ${style.check}`}
                />
                <span className={`font-medium ${style.text}`}>{f.label}</span>
              </label>
            </li>
          )
        })}
      </ul>
    </main>
  )
}