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
