"use client"

import { useInvoiceHistory } from "@/features/invoice-history/hooks/useInvoiceHistory"
import { InvoiceSearchBar } from "@/features/invoice-history/components/InvoiceSearchBar"
import { InvoiceHistoryList } from "@/features/invoice-history/components/InvoiceHistoryList"
import { deleteInvoice } from "@/shared/lib/invoiceRepository"

export default function HistoryPage() {
  const { invoices, isLoading, searchTerm, setSearchTerm } = useInvoiceHistory()

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm(
      "Delete this invoice? This can't be undone."
    )
    if (!confirmed) return
    await deleteInvoice(id)
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-2xl">
        <h1 className="mb-4 text-lg font-semibold text-neutral-900">
          Invoice History
        </h1>

        <div className="mb-4">
          <InvoiceSearchBar value={searchTerm} onChange={setSearchTerm} />
        </div>

        <InvoiceHistoryList
          invoices={invoices}
          isLoading={isLoading}
          onDelete={handleDelete}
        />
      </div>
    </div>
  )
}
