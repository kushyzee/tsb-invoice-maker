"use client"

import { useState } from "react"
import { useLiveQuery } from "dexie-react-hooks"
import { db } from "@/shared/lib/db"

export function useInvoiceHistory() {
  const [searchTerm, setSearchTerm] = useState("")

  const invoices = useLiveQuery(async () => {
    const all = await db.invoices.orderBy("createdAt").reverse().toArray()

    const term = searchTerm.trim().toLowerCase()
    if (!term) return all

    return all.filter(
      (invoice) =>
        invoice.customerName.toLowerCase().includes(term) ||
        invoice.invoiceNumber.toLowerCase().includes(term)
    )
  }, [searchTerm])

  return {
    invoices: invoices ?? [],
    isLoading: invoices === undefined,
    searchTerm,
    setSearchTerm,
  }
}
