import { db } from "@/shared/lib/db"
import type { Invoice } from "@/features/invoice-form/types"

export async function saveInvoice(invoice: Invoice): Promise<void> {
  await db.invoices.put(invoice)
}

export async function deleteInvoice(id: string): Promise<void> {
  await db.invoices.delete(id)
}

export async function getInvoiceById(id: string): Promise<Invoice | undefined> {
  return db.invoices.get(id)
}

export async function getHighestInvoiceNumber(): Promise<number> {
  const all = await db.invoices.toArray()
  const numbers = all
    .map((inv) => Number(inv.invoiceNumber))
    .filter((n) => Number.isFinite(n))
  return numbers.length > 0 ? Math.max(...numbers) : 0
}
