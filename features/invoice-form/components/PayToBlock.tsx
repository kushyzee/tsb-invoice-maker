import { SETTINGS } from "@/shared/lib/constants"

export function PayToBlock() {
  return (
    <div>
      <p className="text-xs font-bold tracking-wide text-neutral-900">
        PAY TO:
      </p>
      <p className="mt-1 text-sm text-neutral-800">{SETTINGS.payToBankName}</p>
      <p className="text-sm text-neutral-800">
        Account Name: {SETTINGS.payToAccountName}
      </p>
      <p className="text-sm text-neutral-800">
        Account No.: {SETTINGS.payToAccountNumber}
      </p>
    </div>
  )
}
