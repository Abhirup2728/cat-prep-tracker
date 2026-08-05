export function toDateStr(d: Date) {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export function todayStr() {
  return toDateStr(new Date())
}

export function isWeekend(dateStr: string) {
  const day = new Date(dateStr + 'T00:00:00').getDay()
  return day === 0 || day === 6
}

export function formatFullDate(dateStr: string) {
  const d = new Date(dateStr + 'T00:00:00')
  const day = d.getDate()
  const month = d.toLocaleString('en-US', { month: 'long' })
  const year = d.getFullYear()
  const suffix = (n: number) => {
    if (n >= 11 && n <= 13) return 'th'
    switch (n % 10) {
      case 1: return 'st'
      case 2: return 'nd'
      case 3: return 'rd'
      default: return 'th'
    }
  }
  return `${day}${suffix(day)} ${month} ${year}`
}

export const PLAN_START = '2026-07-28'
export const PLAN_END = '2026-11-29'

export function allPlanDates(): string[] {
  const dates: string[] = []
  const d = new Date(PLAN_START + 'T00:00:00')
  const end = new Date(PLAN_END + 'T00:00:00')
  while (d <= end) {
    dates.push(toDateStr(d))
    d.setDate(d.getDate() + 1)
  }
  return dates
}
export function daysRemaining(targetDateStr: string = PLAN_END) {
  const today = new Date(todayStr() + 'T00:00:00')
  const target = new Date(targetDateStr + 'T00:00:00')
  const diffMs = target.getTime() - today.getTime()
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24))
}