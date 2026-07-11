type InvoiceFooterProps = {
  businessName: string
}

export function InvoiceFooter({ businessName }: InvoiceFooterProps) {
  return (
    <div className="flex justify-end pt-6">
      <span className="font-script text-2xl text-neutral-900">
        {businessName}
      </span>
    </div>
  )
}
