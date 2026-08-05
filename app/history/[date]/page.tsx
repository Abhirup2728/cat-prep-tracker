'use client'

import { useEffect, useMemo, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { fieldsForDate, DailyTracker, CATEGORY_STYLES, CATEGORY_HEX, CATEGORY_LABELS, Category } from '@/lib/schedule'
import { formatFullDate, isWeekend, todayStr } from '@/lib/date'

const CATEGORY_GROUPS: { category: Category; keys: string[] }[] = [
  { category: 'lrdi', keys: ['am_study_video', 'am_study_practice'] },
  { category: 'rc', keys: ['commute_am_rc', 'lunch_rc1', 'lunch_rc2', 'commute_pm_rc'] },
  { category: 'quant', keys: ['evening_study_video', 'evening_study_practice'] },
  { category: 'weekend_extra', keys: ['weekend_extra_block'] },
  { category: 'tech', keys: ['tech_revision'] },
  { category: 'jobs', keys: ['job_applications'] },
  { category: 'sleep', keys: ['slept_on_time'] },
  { category: 'wake', keys: ['woke_on_time'] },
]

function completionFor(row: Partial<DailyTracker>, date: string) {
  const fields = fieldsForDate(date)
  const done = fields.filter((f) => row[f.key as keyof DailyTracker]).length
  return fields.length ? Math.round((done / fields.length) * 100) : 0
}

export default function DayDetail() {
  const params = useParams<{ date: string }>()
  const router = useRouter()
  const date = params.date
  const [row, setRow] = useState<Partial<DailyTracker> | null>(null)
  const [allRows, setAllRows] = useState<DailyTracker[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (date > todayStr()) {
      router.replace('/history')
      return
    }
    async function load() {
      const [{ data: dayData, error: dayErr }, { data: allData, error: allErr }] = await Promise.all([
        supabase.from('daily_tracker').select('*').eq('date', date).maybeSingle(),
        supabase.from('daily_tracker').select('*'),
      ])
      if (dayErr) console.error(dayErr)
      if (allErr) console.error(allErr)
      setRow(dayData || { date })
      setAllRows(allData || [])
      setLoading(false)
    }
    load()
  }, [date, router])

  const fields = useMemo(() => fieldsForDate(date), [date])

  const doneKeys = useMemo(
    () => (row ? fields.filter((f) => row[f.key as keyof DailyTracker]).map((f) => f.key) : []),
    [row, fields]
  )

  const completion = row ? completionFor(row, date) : 0
  const missedCount = fields.length - doneKeys.length

  const donutData = [
    { name: 'Completed', value: doneKeys.length, color: '#16a34a' },
    { name: 'Missed', value: missedCount, color: '#e5e7eb' },
  ]

  const categoryBars = useMemo(() => {
    if (!row) return []
    return CATEGORY_GROUPS.map(({ category, keys }) => {
      const relevant = keys.filter((k) => fields.some((f) => f.key === k))
      if (relevant.length === 0) return null
      const yes = relevant.filter((k) => row[k as keyof DailyTracker]).length
      return {
        label: CATEGORY_LABELS[category],
        pct: Math.round((yes / relevant.length) * 100),
        color: CATEGORY_HEX[category],
      }
    }).filter(Boolean) as { label: string; pct: number; color: string }[]
  }, [row, fields])

  const allTimeAvg = useMemo(() => {
    if (allRows.length === 0) return 0
    const total = allRows.reduce((s, r) => s + completionFor(r, r.date), 0)
    return Math.round(total / allRows.length)
  }, [allRows])

  const diff = completion - allTimeAvg

  if (loading || !row) return <main className="p-8 text-center text-gray-500">Loading...</main>

  return (
    <main className="max-w-2xl mx-auto p-6">
      <button onClick={() => router.push('/history')} className="text-sm text-indigo-600 mb-4 hover:underline">
        ← Back to calendar
      </button>

      <div className="text-center mb-6">
        <h2 className="text-3xl font-bold">{formatFullDate(date)}</h2>
        <p className="text-sm text-gray-500 mt-1">{isWeekend(date) ? 'Weekend' : 'Weekday'}</p>
      </div>

      {/* Summary row: donut + stat cards */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex flex-col items-center justify-center">
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={donutData} dataKey="value" innerRadius={45} outerRadius={65} paddingAngle={2}>
                {donutData.map((d, i) => <Cell key={i} fill={d.color} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="text-center -mt-4">
            <div className="text-2xl font-extrabold">{completion}%</div>
            <div className="text-xs text-gray-500">Completed</div>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 flex-1 flex flex-col justify-center">
            <div className="text-xs text-gray-500">Tasks Done</div>
            <div className="text-2xl font-bold text-green-600">{doneKeys.length} / {fields.length}</div>
          </div>
          <div className={`rounded-2xl shadow-sm border p-4 flex-1 flex flex-col justify-center ${
            diff >= 0 ? 'bg-emerald-50 border-emerald-200' : 'bg-orange-50 border-orange-200'
          }`}>
            <div className="text-xs text-gray-500">Vs Your All-Time Avg ({allTimeAvg}%)</div>
            <div className={`text-2xl font-bold ${diff >= 0 ? 'text-emerald-600' : 'text-orange-600'}`}>
              {diff >= 0 ? '+' : ''}{diff}%
            </div>
          </div>
        </div>
      </div>

      {/* Category breakdown chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6">
        <h3 className="text-sm font-semibold mb-3">Category Breakdown — This Day</h3>
        <ResponsiveContainer width="100%" height={Math.max(160, categoryBars.length * 40)}>
          <BarChart data={categoryBars} layout="vertical" margin={{ left: 20 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} unit="%" tick={{ fontSize: 11 }} />
            <YAxis type="category" dataKey="label" width={110} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="pct" name="Completion %" radius={[0, 4, 4, 0]}>
              {categoryBars.map((c, i) => <Cell key={i} fill={c.color} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Full checklist for the day */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4">
        <h3 className="text-sm font-semibold mb-3">Full Checklist</h3>
        <ul className="space-y-2">
          {fields.map((f) => {
            const style = CATEGORY_STYLES[f.category]
            const checked = !!row[f.key as keyof DailyTracker]
            return (
              <li
                key={f.key}
                className={`flex items-center gap-3 p-3 rounded-lg border-2 ${style.bg} ${style.border} ${
                  checked ? '' : 'opacity-50'
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                  checked ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-500'
                }`}>
                  {checked ? '✓' : '✗'}
                </span>
                <span className={`font-medium ${style.text}`}>{f.label}</span>
              </li>
            )
          })}
        </ul>
      </div>
    </main>
  )
}