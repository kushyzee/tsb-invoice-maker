export function formatNaira(amount: number): string {
  return new Intl.NumberFormat("en-NG", { maximumFractionDigits: 0 }).format(
    Number.isFinite(amount) ? amount : 0
  )
}

export function formatDateForPrint(isoDate: string): string {
  if (!isoDate) return ""
  const [year, month, day] = isoDate.split("-")
  return `${day}.${month}.${year}`
}
