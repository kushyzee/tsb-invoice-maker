"use client"

import Link from "next/link"
import { Plus } from "lucide-react"
import { useInvoiceHistory } from "@/features/invoice-history/hooks/useInvoiceHistory"
import { InvoiceSearchBar } from "@/features/invoice-history/components/InvoiceSearchBar"
import { InvoiceHistoryList } from "@/features/invoice-history/components/InvoiceHistoryList"
import { buttonVariants } from "@/components/ui/button"
import { deleteInvoice } from "@/shared/lib/invoiceRepository"
import { cn } from "@/lib/utils"

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
    <div className="min-h-svh bg-neutral-100 p-4 sm:p-6">
      <div className="mx-auto max-w-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-neutral-900">
            Invoice History
          </h1>
          <Link href="/new" className={cn(buttonVariants(), "gap-1.5")}>
            <Plus className="h-4 w-4" />
            New
          </Link>
        </div>

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
