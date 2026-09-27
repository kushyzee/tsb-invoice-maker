import Link from "next/link"
import { cn } from "@/lib/utils"
import { formatDateForPrint, formatNaira } from "@/shared/lib/money"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { calculateFinance } from "@/features/invoice-finance/utils"
import type { Invoice } from "@/features/invoice-form/types"

type AmountCellProps = {
  value: number
}

function AmountCell({ value }: AmountCellProps) {
  return (
    <TableCell
      className={cn(
        "text-right tabular-nums",
        value < 0 && "font-medium text-destructive"
      )}
    >
      {formatNaira(value)}
    </TableCell>
  )
}

type MonthlyInvoiceBreakdownProps = {
  invoices: Invoice[]
}

/** Per-invoice figures for the selected month. Internal-only. */
export function MonthlyInvoiceBreakdown({
  invoices,
}: MonthlyInvoiceBreakdownProps) {
  if (invoices.length === 0) {
    return (
      <p className="py-6 text-center text-sm text-neutral-500">
        No invoices in this month.
      </p>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Invoice</TableHead>
          <TableHead>Customer</TableHead>
          <TableHead className="text-right">Invoiced</TableHead>
          <TableHead className="text-right">Amount paid</TableHead>
          <TableHead className="text-right">Expenses</TableHead>
          <TableHead className="text-right">Actual profit</TableHead>
          <TableHead className="text-right">Outstanding</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {invoices.map((invoice) => {
          const finance = calculateFinance(invoice)

          return (
            <TableRow key={invoice.id}>
              <TableCell className="font-medium text-neutral-900">
                <Link
                  href={`/history/${invoice.id}`}
                  className="underline-offset-4 hover:underline"
                >
                  #{invoice.invoiceNumber}
                </Link>
                <span className="block text-xs font-normal text-neutral-500">
                  {formatDateForPrint(invoice.issueDate)}
                </span>
              </TableCell>
              <TableCell className="max-w-40 truncate">
                {invoice.customerName || "Untitled"}
              </TableCell>
              <AmountCell value={finance.invoiced} />
              <AmountCell value={finance.amountPaid} />
              <AmountCell value={finance.expenses} />
              <AmountCell value={finance.actualProfit} />
              <AmountCell value={finance.outstanding} />
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
