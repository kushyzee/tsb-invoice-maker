import type { Invoice } from "@/features/invoice-form/types"

type TotalsInput = Pick<Invoice, "lineItems" | "discountType" | "discountValue">

export function calculateTotals(invoice: TotalsInput) {
  const subtotal = invoice.lineItems.reduce(
    (sum, item) => sum + item.unitPrice * item.qty,
    0
  )

  let discountAmount = 0
  if (invoice.discountType === "fixed") discountAmount = invoice.discountValue
  if (invoice.discountType === "percentage") {
    discountAmount = (subtotal * invoice.discountValue) / 100
  }

  const total = Math.max(subtotal - discountAmount, 0)

  return { subtotal, discountAmount, total }
}
