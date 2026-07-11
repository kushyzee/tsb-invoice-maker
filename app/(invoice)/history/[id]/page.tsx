"use client"

import { useRef } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useLiveQuery } from "dexie-react-hooks"
import { ArrowLeft, Trash2, FileDown, ImageDown } from "lucide-react"
import { getInvoiceById, deleteInvoice } from "@/shared/lib/invoiceRepository"
import { InvoicePreview } from "@/features/invoice-preview/components/InvoicePreview"
import { useExportInvoice } from "@/features/invoice-export/hooks/useExportInvoice"
import { buildExportFilename } from "@/features/invoice-export/utils"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"

export default function InvoiceDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const previewRef = useRef<HTMLDivElement>(null)
  const { exportAsImage, exportAsPdf, isExporting } =
    useExportInvoice(previewRef)

  const invoice = useLiveQuery(async () => {
    const found = await getInvoiceById(params.id)
    return found ?? null
  }, [params.id])

  const handleDelete = async () => {
    const confirmed = window.confirm(
      "Delete this invoice? This can't be undone."
    )
    if (!confirmed) return
    await deleteInvoice(params.id)
    router.push("/history")
  }

  if (invoice === undefined) {
    return (
      <div className="min-h-svh bg-neutral-100 p-6">
        <p className="text-sm text-neutral-500">Loading…</p>
      </div>
    )
  }

  if (invoice === null) {
    return (
      <div className="min-h-svh bg-neutral-100 p-6">
        <p className="text-sm text-neutral-500">Invoice not found.</p>
        <Link href="/history" className="mt-2 inline-block text-sm underline">
          Back to history
        </Link>
      </div>
    )
  }

  const filename = buildExportFilename(invoice)

  return (
    <div className="min-h-svh bg-neutral-100 p-4 sm:p-6">
      <div className="mx-auto mb-4 flex max-w-[700px] items-center justify-between">
        <Link
          href="/history"
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1.5"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Link>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          className="gap-1.5 text-neutral-500 hover:text-red-600"
        >
          <Trash2 className="h-4 w-4" />
          Delete
        </Button>
      </div>

      <InvoicePreview ref={previewRef} invoice={invoice} />

      <div className="mx-auto mt-4 flex max-w-[700px] justify-end gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isExporting}
          onClick={() => exportAsImage(filename)}
          className="gap-1.5"
        >
          <ImageDown className="h-4 w-4" />
          {isExporting ? "Exporting…" : "Export image"}
        </Button>
        <Button
          type="button"
          size="sm"
          disabled={isExporting}
          onClick={() => exportAsPdf(filename)}
          className="gap-1.5"
        >
          <FileDown className="h-4 w-4" />
          {isExporting ? "Exporting…" : "Export PDF"}
        </Button>
      </div>
    </div>
  )
}
