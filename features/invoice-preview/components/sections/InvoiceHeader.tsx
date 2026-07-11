type InvoiceHeaderProps = {
  businessName: string
}

export function InvoiceHeader({ businessName }: InvoiceHeaderProps) {
  return (
    <div className="flex items-end justify-between border-b border-neutral-800 pb-3">
      <span className="font-script text-3xl text-neutral-900">
        {businessName}
      </span>
      <span className="text-4xl font-light tracking-[0.35em] text-neutral-900">
        INVOICE
      </span>
    </div>
  )
}
