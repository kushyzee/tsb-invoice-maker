import { SETTINGS } from "@/shared/lib/constants"

export function InvoiceFooter() {
  return (
    <div className="flex justify-end pt-6">
      <span className="font-script text-2xl text-neutral-900">
        {SETTINGS.businessName}
      </span>
    </div>
  )
}
