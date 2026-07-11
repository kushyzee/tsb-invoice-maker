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
