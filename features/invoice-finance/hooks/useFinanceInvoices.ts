"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { listInvoices } from "@/shared/lib/invoiceRepository"

/**
 * All invoices, live. Reads through the repository so invoices created before
 * the finance feature arrive with their financial fields defaulted to 0.
 * Creating, editing, or deleting any invoice re-runs the query.
 */
export function useFinanceInvoices() {
  const invoices = useLiveQuery(() => listInvoices())

  return {
    invoices: invoices ?? [],
    isLoading: invoices === undefined,
  }
}
