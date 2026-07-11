"use client"

import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import { formatNaira, formatDateForPrint } from "@/shared/lib/money"
import { calculateTotals } from "@/features/invoice-preview/utils"
import type { Invoice } from "@/features/invoice-form/types"

type InvoiceHistoryItemProps = {
  invoice: Invoice
  onDelete: (id: string) => void
}

export function InvoiceHistoryItem({
  invoice,
  onDelete,
}: InvoiceHistoryItemProps) {
  const { total } = calculateTotals(invoice)

  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 py-4">
        <Link href={`/history/${invoice.id}`} className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-neutral-900">
            {invoice.customerName || "Untitled"}
          </p>
          <p className="mt-0.5 text-xs text-neutral-500">
            Invoice #{invoice.invoiceNumber} ·{" "}
            {formatDateForPrint(invoice.issueDate)}
          </p>
        </Link>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-neutral-900">
            {formatNaira(total)} naira
          </span>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onDelete(invoice.id)}
            className="text-neutral-500 hover:text-red-600"
            aria-label={`Delete invoice ${invoice.invoiceNumber}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
