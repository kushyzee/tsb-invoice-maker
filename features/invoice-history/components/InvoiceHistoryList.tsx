"use client"

import { InvoiceHistoryItem } from "@/features/invoice-history/components/InvoiceHistoryItem"
import type { Invoice } from "@/features/invoice-form/types"

type InvoiceHistoryListProps = {
  invoices: Invoice[]
  isLoading: boolean
  onDelete: (id: string) => void
}

export function InvoiceHistoryList({
  invoices,
  isLoading,
  onDelete,
}: InvoiceHistoryListProps) {
  if (isLoading) {
    return <p className="text-sm text-neutral-500">Loading…</p>
  }

  if (invoices.length === 0) {
    return (
      <p className="text-sm text-neutral-500">
        No invoices yet, create your first one to see it here.
      </p>
    )
  }

  return (
    <div className="space-y-2">
      {invoices.map((invoice) => (
        <InvoiceHistoryItem
          key={invoice.id}
          invoice={invoice}
          onDelete={onDelete}
        />
      ))}
    </div>
  )
}
