import { db } from "@/shared/lib/db"
import type { Invoice } from "@/features/invoice-form/types"

// Invoices saved before the finance feature carry no expenses/amountPaid.
// The v3 upgrade backfills them; this covers any record that reached the app
// before that upgrade ran, so reads always satisfy the Invoice type.
function withFinancialDefaults(invoice: Invoice): Invoice {
  return {
    ...invoice,
    expenses: invoice.expenses ?? 0,
    amountPaid: invoice.amountPaid ?? 0,
  }
}

export async function saveInvoice(invoice: Invoice): Promise<void> {
  await db.invoices.put(invoice)
}

export async function deleteInvoice(id: string): Promise<void> {
  await db.invoices.delete(id)
}

export async function getInvoiceById(id: string): Promise<Invoice | undefined> {
  const invoice = await db.invoices.get(id)
  return invoice && withFinancialDefaults(invoice)
}

export async function getHighestInvoiceNumber(): Promise<number> {
  const all = await db.invoices.toArray()
  const numbers = all
    .map((inv) => Number(inv.invoiceNumber))
    .filter((n) => Number.isFinite(n))
  return numbers.length > 0 ? Math.max(...numbers) : 0
}
