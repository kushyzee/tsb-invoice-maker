import { calculateTotals } from "@/features/invoice-preview/utils"
import type { Invoice } from "@/features/invoice-form/types"

/**
 * The stored financial inputs, plus the fields the invoice total derives from.
 * Accepts both a persisted `Invoice` and live form values.
 */
export type FinanceInput = Pick<
  Invoice,
  "lineItems" | "discountType" | "discountValue" | "expenses" | "amountPaid"
>

/**
 * Internal financial position of a single invoice. Every figure is derived on
 * read — none of it is persisted. The invoice total comes from the canonical
 * `calculateTotals`, not a second implementation.
 *
 * Profit and outstanding may legitimately be negative and are never clamped.
 */
export function calculateFinance(invoice: FinanceInput) {
  const { total: invoiced } = calculateTotals(invoice)
  const { expenses, amountPaid } = invoice

  return {
    invoiced,
    amountPaid,
    expenses,
    projectedProfit: invoiced - expenses,
    actualProfit: amountPaid - expenses,
    outstanding: invoiced - amountPaid,
  }
}

/**
 * The financial month of an invoice, derived from `issueDate` as a string.
 * Never parse the date: a bare "YYYY-MM-DD" parses as UTC midnight and reports
 * the previous month in negative-offset timezones. `dueDate`, `createdAt`, and
 * `updatedAt` are deliberately not used — when an invoice was typed up says
 * nothing about the month it was billed for.
 */
export function monthKeyOf(invoice: Pick<Invoice, "issueDate">): string {
  return invoice.issueDate.slice(0, 7)
}

/**
 * The current local calendar month, built from local getters rather than
 * `toISOString()`, which is UTC and can report the previous month during the
 * first hours of the local day.
 */
export function currentMonth(): string {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`
}

/**
 * Move a `YYYY-MM` key by whole months. Works on the numeric parts directly
 * rather than constructing a `Date`, for the same reason `monthKeyOf` slices.
 */
export function shiftMonth(month: string, delta: number): string {
  const [year, monthNumber] = month.split("-").map(Number)
  if (!year || !monthNumber) return month

  const monthsSinceEpoch = year * 12 + (monthNumber - 1) + delta
  const shiftedYear = Math.floor(monthsSinceEpoch / 12)
  const shiftedMonth = (monthsSinceEpoch % 12) + 1

  return `${shiftedYear}-${String(shiftedMonth).padStart(2, "0")}`
}

const MONTH_LABELS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
]

/**
 * Human label for a `YYYY-MM` key, e.g. "2026-09" → "September 2026". Built
 * from the key's own parts rather than by parsing it as a date, for the same
 * reason `monthKeyOf` slices instead of constructing a `Date`. An unset or
 * malformed key comes back unchanged, so the report can always name its month.
 */
export function formatMonthLabel(month: string): string {
  const [year, monthNumber] = month.split("-").map(Number)
  const label = MONTH_LABELS[monthNumber - 1]
  if (!year || !label) return month
  return `${label} ${year}`
}

/** Filename stem for the finance report PDF; the export appends the extension. */
export function buildFinanceReportFilename(month: string): string {
  return `TSB-Finance-Report-${month}`
}

export type MonthlyFinance = {
  invoiced: number
  amountPaid: number
  expenses: number
  actualProfit: number
  outstanding: number
  invoiceCount: number
}

/**
 * Totals for a set of invoices. Summed from `calculateFinance` per invoice so
 * the monthly and per-invoice figures cannot drift apart. Nothing is persisted;
 * the totals are recomputed from the underlying records on every read.
 */
export function calculateMonthlyFinance(
  invoices: FinanceInput[]
): MonthlyFinance {
  const totals = invoices.reduce(
    (accumulator, invoice) => {
      const finance = calculateFinance(invoice)
      return {
        invoiced: accumulator.invoiced + finance.invoiced,
        amountPaid: accumulator.amountPaid + finance.amountPaid,
        expenses: accumulator.expenses + finance.expenses,
        actualProfit: accumulator.actualProfit + finance.actualProfit,
        outstanding: accumulator.outstanding + finance.outstanding,
      }
    },
    { invoiced: 0, amountPaid: 0, expenses: 0, actualProfit: 0, outstanding: 0 }
  )

  return { ...totals, invoiceCount: invoices.length }
}
