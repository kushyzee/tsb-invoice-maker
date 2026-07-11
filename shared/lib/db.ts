import Dexie, { type EntityTable } from "dexie"
import type { Invoice } from "@/features/invoice-form/types"

export const db = new Dexie("tsb-invoice-maker") as Dexie & {
  invoices: EntityTable<Invoice, "id">
}

db.version(1).stores({
  invoices: "id, invoiceNumber, customerName, createdAt",
})
