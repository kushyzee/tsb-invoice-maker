import Dexie, { type EntityTable } from "dexie"
import type { Invoice } from "@/features/invoice-form/types"
import type { Settings } from "@/features/settings/types"

type SettingsRecord = Settings & { id: string }

export const db = new Dexie("tsb-invoice-maker") as Dexie & {
  invoices: EntityTable<Invoice, "id">
  settings: EntityTable<SettingsRecord, "id">
}

db.version(1).stores({
  invoices: "id, invoiceNumber, customerName, createdAt",
})

db.version(2).stores({
  invoices: "id, invoiceNumber, customerName, createdAt",
  settings: "id",
})

// No index changes — this version exists only to backfill the financial fields
// onto invoices that were saved before the finance feature existed.
db.version(3)
  .stores({
    invoices: "id, invoiceNumber, customerName, createdAt",
    settings: "id",
  })
  .upgrade((tx) =>
    tx
      .table("invoices")
      .toCollection()
      .modify((invoice) => {
        invoice.expenses ??= 0
        invoice.amountPaid ??= 0
      })
  )
