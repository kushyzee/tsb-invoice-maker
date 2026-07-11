import { formatDateForPrint } from "@/shared/lib/money"

type InvoiceMetaBlockProps = {
  invoiceNumber: string
  issueDate: string
  dueDate: string
}

export function InvoiceMetaBlock({
  invoiceNumber,
  issueDate,
  dueDate,
}: InvoiceMetaBlockProps) {
  return (
    <div className="text-right text-sm text-neutral-800">
      <p>
        <span className="text-xs font-bold tracking-wide text-neutral-900">
          INVOICE NO:{" "}
        </span>
        <span className="ml-2 font-semibold">{invoiceNumber || "—"}</span>
      </p>
      <p className="mt-1">
        <span className="text-xs font-bold tracking-wide text-neutral-900">
          DATE:{" "}
        </span>
        <span className="ml-2">{formatDateForPrint(issueDate) || "—"}</span>
      </p>
      <p className="mt-1">
        <span className="text-xs font-bold tracking-wide text-neutral-900">
          DUE DATE:{" "}
        </span>
        <span className="ml-2">{formatDateForPrint(dueDate) || "—"}</span>
      </p>
    </div>
  )
}
