'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import { supabase } from '@/lib/supabase'
import { fieldsForDate, DailyTracker, CATEGORY_LABELS, CATEGORY_HEX, Category } from '@/lib/schedule'
import { isWeekend, toDateStr, formatFullDate } from '@/lib/date'

function completionFor(row: DailyTracker) {
  const fields = fieldsForDate(row.date)
  const done = fields.filter((f) => row[f.key as keyof DailyTracker]).length
  return fields.length ? done / fields.length : 0
}

function startOfWeek(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDay()
  const diff = day === 0 ? -6 : 1 - day
  d.setDate(d.getDate() + diff)
  return toDateStr(d)
}

const ALL_CATEGORY_KEYS: { category: Category; keys: string[] }[] = [
  { category: 'lrdi', keys: ['am_study_video', 'am_study_practice'] },
  { category: 'rc', keys: ['commute_am_rc', 'lunch_rc1', 'lunch_rc2', 'commute_pm_rc'] },
  { category: 'quant', keys: ['evening_study_video', 'evening_study_practice'] },
  { category: 'weekend_extra', keys: ['weekend_extra_block'] },
  { category: 'tech', keys: ['tech_revision'] },
  { category: 'jobs', keys: ['job_applications'] },
  { category: 'sleep', keys: ['slept_on_time'] },
  { category: 'wake', keys: ['woke_on_time'] },
]

export default function Dashboard() {
  const [rows, setRows] = useState<DailyTracker[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('daily_tracker')
        .select('*')
        .order('date', { ascending: true })
      if (error) console.error('Dashboard load error:', error.message)
      setRows(data || [])
      setLoading(false)
    }
    load()
  }, [])

  const stats = useMemo(() => {
    if (rows.length === 0) {
      return { avg: 0, last7: 0, last30: 0, currentStreak: 0, longestStreak: 0, perfectDays: 0 }
    }
    const withPct = rows.map((r) => ({ date: r.date, pct: completionFor(r) }))
    const avg = withPct.reduce((s, r) => s + r.pct, 0) / withPct.length
    const last7 = withPct.slice(-7)
    const last7Avg = last7.reduce((s, r) => s + r.pct, 0) / last7.length
    const last30 = withPct.slice(-30)
    const last30Avg = last30.reduce((s, r) => s + r.pct, 0) / last30.length

    let longest = 0, running = 0
    for (const r of withPct) {
      if (r.pct === 1) { running += 1; longest = Math.max(longest, running) }
      else running = 0
    }
    let current = 0
    for (let i = withPct.length - 1; i >= 0; i--) {
      if (withPct[i].pct === 1) current += 1
      else break
    }
    const perfectDays = withPct.filter((r) => r.pct === 1).length

    return { avg, last7: last7Avg, last30: last30Avg, currentStreak: current, longestStreak: longest, perfectDays }
  }, [rows])

  const weeklyData = useMemo(() => {
    const weekMap = new Map<string, { total: number; count: number }>()
    for (const r of rows) {
      const wk = startOfWeek(r.date)
      const pct = completionFor(r)
      const existing = weekMap.get(wk) || { total: 0, count: 0 }
      weekMap.set(wk, { total: existing.total + pct, count: existing.count + 1 })
    }
    const weeks = Array.from(weekMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([week, v]) => ({ week, avg: Math.round((v.total / v.count) * 100) }))
    let cumTotal = 0, cumCount = 0
    return weeks.map((w) => {
      cumTotal += w.avg; cumCount += 1
      return { ...w, cumulative: Math.round(cumTotal / cumCount) }
    })
  }, [rows])

  const monthlyData = useMemo(() => {
    const monthMap = new Map<string, { total: number; count: number }>()
    for (const r of rows) {
      const month = r.date.slice(0, 7)
      const pct = completionFor(r)
      const existing = monthMap.get(month) || { total: 0, count: 0 }
      monthMap.set(month, { total: existing.total + pct, count: existing.count + 1 })
    }
    return Array.from(monthMap.entries())
      .sort(([a], [b]) => (a < b ? -1 : 1))
      .map(([month, v]) => ({ month, avg: Math.round((v.total / v.count) * 100) }))
  }, [rows])

  const categoryData = useMemo(() => {
    return ALL_CATEGORY_KEYS.map(({ category, keys }) => {
      let yes = 0, total = 0
      for (const r of rows) {
        for (const key of keys) {
          const val = r[key as keyof DailyTracker]
          if (val === null || val === undefined) continue
          total += 1
          if (val) yes += 1
        }
      }
      return { label: CATEGORY_LABELS[category], pct: total ? Math.round((yes / total) * 100) : 0, color: CATEGORY_HEX[category], raw: yes }
    })
  }, [rows])

  const pieData = useMemo(() => {
    return categoryData.filter((c) => c.raw > 0).map((c) => ({ name: c.label, value: c.raw, color: c.color }))
  }, [categoryData])

  const weekdayVsWeekend = useMemo(() => {
    const wd: number[] = [], we: number[] = []
    for (const r of rows) {
      const pct = completionFor(r) * 100
      if (isWeekend(r.date)) we.push(pct)
      else wd.push(pct)
    }
    const avg = (arr: number[]) => (arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0)
    return [
      { name: 'Weekday', avg: avg(wd) },
      { name: 'Weekend', avg: avg(we) },
    ]
  }, [rows])

  const recentDays = useMemo(() => [...rows].reverse().slice(0, 10), [rows])

  if (loading) return <main className="p-8 text-center text-gray-500">Loading...</main>

  return (
    <main className="max-w-5xl mx-auto p-6 space-y-10">
      <div className="text-center">
        <h2 className="text-2xl font-bold">Progress Dashboard</h2>
        <p className="text-sm text-gray-500">Everything below updates automatically as you check things off.</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <StatCard label="Avg Completion" value={`${Math.round(stats.avg * 100)}%`} color="from-indigo-500 to-indigo-600" />
        <StatCard label="Last 7-Day Avg" value={`${Math.round(stats.last7 * 100)}%`} color="from-purple-500 to-purple-600" />
        <StatCard label="Last 30-Day Avg" value={`${Math.round(stats.last30 * 100)}%`} color="from-fuchsia-500 to-fuchsia-600" />
        <StatCard label="Current Streak" value={`${stats.currentStreak} days`} color="from-emerald-500 to-emerald-600" />
        <StatCard label="Longest Streak" value={`${stats.longestStreak} days`} color="from-teal-500 to-teal-600" />
        <StatCard label="Perfect Days" value={`${stats.perfectDays}`} color="from-amber-500 to-amber-600" />
      </div>

      <ChartCard title="Weekly Avg vs Overall Growth Trend">
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} />
            <YAxis domain={[0, 100]} unit="%" />
            <Tooltip />
            <Legend />
            <Line type="monotone" dataKey="avg" name="Weekly Avg %" stroke="#16a34a" strokeWidth={2} />
            <Line type="monotone" dataKey="cumulative" name="Cumulative Avg %" stroke="#2563eb" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </ChartCard>

      <div className="grid md:grid-cols-2 gap-6">
        <ChartCard title="Monthly Tracker">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" tick={{ fontSize: 11 }} />
              <YAxis domain={[0, 100]} unit="%" />
              <Tooltip />
              <Bar dataKey="avg" name="Avg Completion %" fill="#7c3aed" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Weekday vs Weekend">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={weekdayVsWeekend}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 100]} unit="%" />
              <Tooltip />
              <Bar dataKey="avg" name="Avg Completion %" fill="#0d9488" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <ChartCard title="Category-wise Completion">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={categoryData} layout="vertical" margin={{ left: 30 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" domain={[0, 100]} unit="%" />
              <YAxis type="category" dataKey="label" width={130} tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="pct" name="Completion %">
                {categoryData.map((c, i) => (
                  <Cell key={i} fill={c.color} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Effort Distribution (all-time)">
          {pieData.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-16">Log a few days to see this chart fill in.</p>
          ) : (
            <ResponsiveContainer width="100%" height={320}>
              <PieChart>
                <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
                  {pieData.map((d, i) => (
                    <Cell key={i} fill={d.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </ChartCard>
      </div>

      <ChartCard title="Recent Days">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-gray-500 border-b">
                <th className="py-2 pr-4">Date</th>
                <th className="py-2 pr-4">Type</th>
                <th className="py-2">Completion</th>
              </tr>
            </thead>
            <tbody>
              {recentDays.map((r) => {
                const pct = Math.round(completionFor(r) * 100)
                return (
                  <tr key={r.date} className="border-b last:border-0">
                    <td className="py-2 pr-4 font-medium">{formatFullDate(r.date)}</td>
                    <td className="py-2 pr-4 text-gray-500">{isWeekend(r.date) ? 'Weekend' : 'Weekday'}</td>
                    <td className="py-2">
                      <div className="flex items-center gap-2">
                        <div className="w-32 bg-gray-100 rounded-full h-2">
                          <div className="bg-green-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="text-xs text-gray-500">{pct}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
              {recentDays.length === 0 && (
                <tr><td colSpan={3} className="py-6 text-center text-gray-400">No days logged yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </ChartCard>
    </main>
  )
}

function StatCard({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div className={`rounded-xl p-4 text-white shadow-sm bg-gradient-to-br ${color}`}>
      <div className="text-xs opacity-90">{label}</div>
      <div className="text-2xl font-bold">{value}</div>
    </div>
  )
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
      <h3 className="text-lg font-semibold mb-3">{title}</h3>
      {children}
    </section>
  )
}