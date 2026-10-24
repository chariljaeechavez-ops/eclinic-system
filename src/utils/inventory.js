export const EXPIRY_WARNING_DAYS = 30

export function itemFlags(item, today = new Date()) {
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate())
  let expired = false, expiring = false
  if (item.expiry_date) {
    const days = Math.round((new Date(`${item.expiry_date}T00:00:00`) - start) / 86400000)
    expired = days < 0
    expiring = !expired && days <= EXPIRY_WARNING_DAYS
  }
  return { expired, expiring, low: item.balance <= item.low_stock_threshold }
}
