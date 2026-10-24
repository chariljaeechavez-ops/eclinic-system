const TZ = 'Asia/Manila'

export function currentMonthKey(now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit' }).format(now).slice(0, 7)
}

// Returns the last `n` months (oldest first), with 0 for months that had no visits.
export function fillMonths(rows, now = new Date(), n = 6) {
  const [y, m] = currentMonthKey(now).split('-').map(Number)
  const byKey = Object.fromEntries(rows.map((r) => [r.month, r.count]))
  return Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(y, m - 1 - (n - 1 - i), 1))
    const key = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
    return { month: key, label: d.toLocaleString('en-PH', { month: 'short', timeZone: 'UTC' }), count: byKey[key] ?? 0 }
  })
}

export const dateKey = (d = new Date()) => new Intl.DateTimeFormat('en-CA', { timeZone: TZ }).format(d)
export const monthStartKey = (d = new Date()) => `${dateKey(d).slice(0, 7)}-01`
export const daysAgoKey = (n, d = new Date()) => dateKey(new Date(d.getTime() - n * 86400000))
