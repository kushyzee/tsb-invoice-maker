import { cn } from "@/lib/utils"
import { formatNaira } from "@/shared/lib/money"
import {
  calculateFinance,
  type FinanceInput,
} from "@/features/invoice-finance/utils"

type FinanceRowProps = {
  label: string
  value: number
  emphasis?: boolean
  hint?: string
}

function FinanceRow({ label, value, emphasis, hint }: FinanceRowProps) {
  return (
    <div className="flex justify-between">
      <span className="text-neutral-600">
        {label}
        {hint && <span className="ml-1 text-xs text-neutral-400">{hint}</span>}
      </span>
      <span
        className={cn(
          emphasis ? "font-semibold text-neutral-900" : "text-neutral-600",
          value < 0 && "text-destructive"
        )}
      >
        {formatNaira(value)}
      </span>
    </div>
  )
}

type InvoiceFinanceSummaryProps = {
  values: FinanceInput
}

/**
 * Internal-only financial summary. Must never be rendered inside the
 * customer-facing preview or anything handed to the export pipeline.
 */
export function InvoiceFinanceSummary({ values }: InvoiceFinanceSummaryProps) {
  const {
    invoiced,
    amountPaid,
    expenses,
    projectedProfit,
    actualProfit,
    outstanding,
  } = calculateFinance(values)

  return (
    <div className="space-y-1">
      <FinanceRow label="Invoiced" value={invoiced} />
      <FinanceRow label="Amount paid" value={amountPaid} />
      <FinanceRow label="Expenses" value={expenses} />

      <div className="mt-2 space-y-1 border-t border-neutral-200 pt-2">
        <FinanceRow label="Projected profit" value={projectedProfit} emphasis />
        <FinanceRow label="Actual profit" value={actualProfit} emphasis />
        <FinanceRow
          label="Outstanding"
          value={outstanding}
          emphasis
          hint={outstanding < 0 ? "(overpaid)" : undefined}
        />
      </div>
    </div>
  )
}
