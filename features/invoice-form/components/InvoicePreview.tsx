import type { Invoice } from "@/features/invoice-form/types"
import { calculateTotals } from "@/shared/lib/utils"
import { InvoiceHeader } from "./InvoiceHeader"
import { IssuedToBlock } from "./IssuedToBlock"
import { InvoiceMetaBlock } from "./InvoiceMetaBlock"
import { PayToBlock } from "./PayToBlock"
import { PaymentNoteBlock } from "./PaymentNoteBlock"
import { ItemsTable } from "./ItemsTable"
import { TotalsBlock } from "./TotalsBlock"
import { InvoiceFooter } from "./InvoiceFooter"

type InvoicePreviewProps = {
  invoice: Invoice
}
export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const { subtotal, discountAmount, total } = calculateTotals(invoice)

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px] bg-white px-10 py-12 shadow-sm sm:px-14 sm:py-16">
        <InvoiceHeader />

        <div className="mt-14 flex justify-between">
          <IssuedToBlock customerName={invoice.customerName} />
          <InvoiceMetaBlock
            invoiceNumber={invoice.invoiceNumber}
            issueDate={invoice.issueDate}
            dueDate={invoice.dueDate}
          />
        </div>

        <div className="mt-8 flex justify-between">
          <PayToBlock />
          <PaymentNoteBlock />
        </div>

        <div className="mt-10">
          <ItemsTable lineItems={invoice.lineItems} />
        </div>

        <div className="mt-4">
          <TotalsBlock
            subtotal={subtotal}
            discountAmount={discountAmount}
            total={total}
          />
        </div>

        <InvoiceFooter />
      </div>
    </div>
  )
}
