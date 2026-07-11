import { SETTINGS } from "@/shared/lib/constants"

export function PaymentNoteBlock() {
  return (
    <p className="max-w-[220px] text-right text-sm leading-relaxed text-neutral-800">
      {SETTINGS.paymentTermsNote}
    </p>
  )
}
