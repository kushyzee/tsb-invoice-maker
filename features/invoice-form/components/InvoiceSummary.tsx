import { Card, CardContent } from "@/components/ui/card"
import { formatNaira } from "@/shared/lib/money"
import { calculateTotals } from "@/features/invoice-preview/utils"
import type { InvoiceFormValues } from "@/features/invoice-form/schema"

type InvoiceSummaryProps = {
  values: Pick<
    InvoiceFormValues,
    "lineItems" | "discountType" | "discountValue"
  >
}

export function InvoiceSummary({ values }: InvoiceSummaryProps) {
  const { subtotal, discountAmount, total } = calculateTotals(values)

  return (
    <Card>
      <CardContent className="space-y-1 pt-6 text-sm">
        <div className="flex justify-between text-neutral-600">
          <span>Subtotal</span>
          <span>{formatNaira(subtotal)} naira</span>
        </div>
        {discountAmount > 0 && (
          <div className="flex justify-between text-neutral-600">
            <span>Discount</span>
            <span>−{formatNaira(discountAmount)}</span>
          </div>
        )}
        <div className="flex justify-between font-semibold text-neutral-900">
          <span>Total</span>
          <span>{formatNaira(total)} naira</span>
        </div>
      </CardContent>
    </Card>
  )
}
