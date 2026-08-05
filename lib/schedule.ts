export type DailyTracker = {
  id?: string
  date: string
  am_study_video?: boolean | null
  am_study_practice?: boolean | null
  commute_am_rc?: boolean | null
  lunch_rc1?: boolean | null
  lunch_rc2?: boolean | null
  commute_pm_rc?: boolean | null
  evening_study_video?: boolean | null
  evening_study_practice?: boolean | null
  weekend_extra_block?: boolean | null
  tech_revision?: boolean | null
  job_applications?: boolean | null
  slept_on_time?: boolean | null
  woke_on_time?: boolean | null
  notes?: string | null
}

export type Category = 'lrdi' | 'rc' | 'quant' | 'weekend_extra' | 'tech' | 'jobs' | 'sleep' | 'wake'

export type FieldMeta = { key: string; label: string; category: Category }

export const CATEGORY_LABELS: Record<Category, string> = {
  lrdi: 'LRDI Study',
  rc: 'RC Reading',
  quant: 'Quant Study',
  weekend_extra: 'Weekend Extra',
  tech: 'Tech Revision',
  jobs: 'Job Applications',
  sleep: 'Sleep',
  wake: 'Wake-up',
}

export const CATEGORY_HEX: Record<Category, string> = {
  lrdi: '#2563eb',
  rc: '#d97706',
  quant: '#7c3aed',
  weekend_extra: '#0d9488',
  tech: '#0891b2',
  jobs: '#db2777',
  sleep: '#4f46e5',
  wake: '#059669',
}

export const CATEGORY_STYLES: Record<Category, { bg: string; border: string; check: string; text: string }> = {
  lrdi:          { bg: 'bg-blue-50',    border: 'border-blue-300',    check: 'accent-blue-600',    text: 'text-blue-700' },
  rc:            { bg: 'bg-amber-50',   border: 'border-amber-300',   check: 'accent-amber-600',   text: 'text-amber-700' },
  quant:         { bg: 'bg-purple-50',  border: 'border-purple-300',  check: 'accent-purple-600',  text: 'text-purple-700' },
  weekend_extra: { bg: 'bg-teal-50',    border: 'border-teal-300',    check: 'accent-teal-600',    text: 'text-teal-700' },
  tech:          { bg: 'bg-cyan-50',    border: 'border-cyan-300',    check: 'accent-cyan-600',    text: 'text-cyan-700' },
  jobs:          { bg: 'bg-pink-50',    border: 'border-pink-300',    check: 'accent-pink-600',    text: 'text-pink-700' },
  sleep:         { bg: 'bg-indigo-50',  border: 'border-indigo-300',  check: 'accent-indigo-600',  text: 'text-indigo-700' },
  wake:          { bg: 'bg-emerald-50', border: 'border-emerald-300', check: 'accent-emerald-600', text: 'text-emerald-700' },
}

export const WEEKDAY_FIELDS: FieldMeta[] = [
  { key: 'am_study_video', label: 'LRDI Study - Video (6:20-7:20)', category: 'lrdi' },
  { key: 'am_study_practice', label: 'LRDI Study - Practice (7:20-8:20)', category: 'lrdi' },
  { key: 'commute_am_rc', label: 'Commute AM - RC Reading', category: 'rc' },
  { key: 'lunch_rc1', label: 'Lunch Break - RC 1', category: 'rc' },
  { key: 'lunch_rc2', label: 'Lunch Break - RC 2', category: 'rc' },
  { key: 'commute_pm_rc', label: 'Commute PM - RC Reading', category: 'rc' },
  { key: 'evening_study_video', label: 'Quant Study - Video', category: 'quant' },
  { key: 'evening_study_practice', label: 'Quant Study - Practice', category: 'quant' },
  { key: 'slept_on_time', label: 'Slept by 11:10 PM', category: 'sleep' },
  { key: 'woke_on_time', label: 'Woke by 6:10 AM', category: 'wake' },
]

export const WEEKEND_FIELDS: FieldMeta[] = [
  { key: 'am_study_video', label: 'Morning Study - Video', category: 'lrdi' },
  { key: 'am_study_practice', label: 'Morning Study - Practice', category: 'lrdi' },
  { key: 'evening_study_video', label: 'Quant Study - Video', category: 'quant' },
  { key: 'evening_study_practice', label: 'Quant Study - Practice', category: 'quant' },
  { key: 'weekend_extra_block', label: 'Weekend Extra Block (Mock/Revision)', category: 'weekend_extra' },
  { key: 'tech_revision', label: 'Tech Revision (DSA/SQL)', category: 'tech' },
  { key: 'job_applications', label: 'Job Applications', category: 'jobs' },
  { key: 'slept_on_time', label: 'Slept by 11:10 PM', category: 'sleep' },
  { key: 'woke_on_time', label: 'Woke by 6:10 AM', category: 'wake' },
]

export { isWeekend } from './date'

export function fieldsForDate(dateStr: string): FieldMeta[] {
  const weekend = new Date(dateStr + 'T00:00:00').getDay()
  return weekend === 0 || weekend === 6 ? WEEKEND_FIELDS : WEEKDAY_FIELDS
}