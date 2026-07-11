type PayToBlockProps = {
  bankName: string
  accountName: string
  accountNumber: string
}

export function PayToBlock({
  bankName,
  accountName,
  accountNumber,
}: PayToBlockProps) {
  return (
    <div>
      <p className="text-xs font-bold tracking-wide text-neutral-900">
        PAY TO:
      </p>
      <p className="mt-1 text-sm text-neutral-800">{bankName}</p>
      <p className="text-sm text-neutral-800">Account Name: {accountName}</p>
      <p className="text-sm text-neutral-800">Account No.: {accountNumber}</p>
    </div>
  )
}
