import { Card, CardContent } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { formatNaira } from "@/shared/lib/money"
import type { MonthlyFinance } from "@/features/invoice-finance/utils"

type FinanceMetricProps = {
  label: string
  value: number
}

function FinanceMetric({ label, value }: FinanceMetricProps) {
  return (
    <Card size="sm">
      <CardContent className="space-y-1">
        <p className="text-xs font-medium tracking-wide text-neutral-500 uppercase">
          {label}
        </p>
        <p
          className={cn(
            "text-lg font-semibold text-neutral-900",
            value < 0 && "text-destructive"
          )}
        >
          {formatNaira(value)}
        </p>
      </CardContent>
    </Card>
  )
}

type MonthlyFinanceSummaryProps = {
  totals: MonthlyFinance
}

/** Internal-only month totals. Never part of the customer-facing output. */
export function MonthlyFinanceSummary({ totals }: MonthlyFinanceSummaryProps) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        <FinanceMetric label="Invoiced" value={totals.invoiced} />
        <FinanceMetric label="Collected" value={totals.amountPaid} />
        <FinanceMetric label="Expenses" value={totals.expenses} />
        <FinanceMetric label="Actual profit" value={totals.actualProfit} />
        <FinanceMetric label="Outstanding" value={totals.outstanding} />
      </div>

      <p className="text-sm text-neutral-600">
        {totals.invoiceCount}{" "}
        {totals.invoiceCount === 1 ? "invoice" : "invoices"}
      </p>
    </div>
  )
}
