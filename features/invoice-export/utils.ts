import type { Invoice } from "@/features/invoice-form/types"

export function buildExportFilename(
  invoice: Pick<Invoice, "invoiceNumber" | "customerName">
): string {
  const safeName = invoice.customerName.trim().replace(/\s+/g, "-") || "invoice"
  return `TSB-Invoice-${invoice.invoiceNumber}-${safeName}`
}
