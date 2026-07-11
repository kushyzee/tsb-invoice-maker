import { formatNaira } from "@/shared/lib/money"

type TotalsBlockProps = {
  subtotal: number
  discountAmount: number
  total: number
}

export function TotalsBlock({
  subtotal,
  discountAmount,
  total,
}: TotalsBlockProps) {
  return (
    <div className="border-t border-neutral-800 pt-3">
      <div className="flex items-baseline justify-between">
        <span className="text-xs font-bold tracking-wide text-neutral-900">
          SUBTOTAL
        </span>
        <span className="text-sm font-semibold text-neutral-900">
          {formatNaira(subtotal)}
        </span>
      </div>

      {discountAmount > 0 && (
        <div className="mt-1 flex items-baseline justify-end gap-2 text-sm text-neutral-800">
          <span>Discount</span>
          <span>−{formatNaira(discountAmount)}</span>
        </div>
      )}

      <div className="mt-1 flex items-baseline justify-end gap-2">
        <span className="text-sm font-bold text-neutral-900">TOTAL</span>
        <span className="text-sm font-bold text-neutral-900">
          {formatNaira(total)}
        </span>
      </div>
    </div>
  )
}
