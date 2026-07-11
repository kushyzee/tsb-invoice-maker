"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { getHighestInvoiceNumber } from "@/shared/lib/invoiceRepository"

export function useNextInvoiceNumber(): string {
  const highest = useLiveQuery(getHighestInvoiceNumber, [])

  if (highest === undefined) return ""
  return String(highest + 1).padStart(2, "0")
}
