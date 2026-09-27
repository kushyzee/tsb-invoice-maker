"use client"

import { useRef, useState } from "react"
import { FileDown, ImageDown } from "lucide-react"
import { useInvoiceForm } from "@/features/invoice-form/hooks/useInvoiceForm"
import { useNextInvoiceNumber } from "@/features/invoice-form/hooks/useNextInvoiceNumber"
import { useSettings } from "@/features/settings/hooks/useSettings"
import { InvoiceForm } from "@/features/invoice-form/components/InvoiceForm"
import { InvoiceSummary } from "@/features/invoice-form/components/InvoiceSummary"
import { InvoicePreview } from "@/features/invoice-preview/components/InvoicePreview"
import { useExportInvoice } from "@/features/invoice-export/hooks/useExportInvoice"
import { buildExportFilename } from "@/features/invoice-export/utils"
import { Button } from "@/components/ui/button"
import { toast } from "@/components/ui/toast"
import { saveInvoice } from "@/shared/lib/invoiceRepository"
import { generateId } from "@/shared/lib/id"
import type { Invoice } from "@/features/invoice-form/types"
import type { InvoiceFormValues } from "@/features/invoice-form/schema"

type ActiveAction = "save" | "pdf" | "image" | null

export default function NewInvoicePage() {
  const suggestedInvoiceNumber = useNextInvoiceNumber()
  const { form, lineItems, addLineItem, removeLineItem } = useInvoiceForm(
    suggestedInvoiceNumber
  )
  const [activeAction, setActiveAction] = useState<ActiveAction>(null)
  const settings = useSettings()

  const previewRef = useRef<HTMLDivElement>(null)
  const { exportAsImage, exportAsPdf } = useExportInvoice(previewRef)

  const values = form.watch()

  const previewInvoice: Invoice = {
    id: "draft",
    createdAt: "",
    updatedAt: "",
    ...values,
  }

  const persistInvoice = async (data: InvoiceFormValues): Promise<Invoice> => {
    const now = new Date().toISOString()
    const invoice: Invoice = {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      ...data,
    }
    await saveInvoice(invoice)
    return invoice
  }

  const onSave = form.handleSubmit(async (data) => {
    setActiveAction("save")
    try {
      const invoice = await persistInvoice(data)
      toast.add({
        title: "Invoice saved",
        description: `Invoice #${invoice.invoiceNumber}`,
        type: "success",
      })
      form.reset()
    } finally {
      setActiveAction(null)
    }
  })

  const handleExport = (kind: "pdf" | "image") =>
    form.handleSubmit(async (data) => {
      setActiveAction(kind)
      try {
        const invoice = await persistInvoice(data)
        const filename = buildExportFilename(invoice)
        const exported =
          kind === "pdf"
            ? await exportAsPdf(filename)
            : await exportAsImage(filename)

        // A dismissed share sheet resolves false — don't claim it was exported.
        if (exported) {
          toast.add({
            title: "Invoice exported",
            description:
              kind === "pdf" ? "Saved as a PDF." : "Saved as a PNG image.",
            type: "success",
          })
        }
        form.reset()
      } finally {
        setActiveAction(null)
      }
    })()

  const isBusy = activeAction !== null

  return (
    <div className="p-4 sm:p-6">
      <form
        onSubmit={onSave}
        className="mx-auto grid max-w-6xl gap-6 lg:grid-cols-[380px_1fr]"
      >
        <div className="space-y-4">
          <InvoiceForm
            form={form}
            lineItems={lineItems}
            onAddLineItem={addLineItem}
            onRemoveLineItem={removeLineItem}
          />
          <InvoiceSummary values={values} />

          <div className="grid grid-cols-2 gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => handleExport("image")}
              className="gap-1.5"
            >
              <ImageDown className="h-4 w-4" />
              {activeAction === "image" ? "Exporting…" : "Export image"}
            </Button>
            <Button
              type="button"
              variant="outline"
              disabled={isBusy}
              onClick={() => handleExport("pdf")}
              className="gap-1.5"
            >
              <FileDown className="h-4 w-4" />
              {activeAction === "pdf" ? "Exporting…" : "Export PDF"}
            </Button>
          </div>

          <Button type="submit" className="w-full" disabled={isBusy}>
            {activeAction === "save" ? "Saving…" : "Save invoice"}
          </Button>
        </div>
        <InvoicePreview
          ref={previewRef}
          invoice={previewInvoice}
          settings={settings}
        />
      </form>
    </div>
  )
}
