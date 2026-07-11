"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { useInvoiceForm } from "@/features/invoice-form/hooks/useInvoiceForm"
import { useNextInvoiceNumber } from "@/features/invoice-form/hooks/useNextInvoiceNumber"
import { InvoiceForm } from "@/features/invoice-form/components/InvoiceForm"
import { InvoiceSummary } from "@/features/invoice-form/components/InvoiceSummary"
import { Button } from "@/components/ui/button"
import { saveInvoice } from "@/shared/lib/invoiceRepository"
import { generateId } from "@/shared/lib/utils"
import type { Invoice } from "@/features/invoice-form/types"
import { InvoicePreview } from "@/features/invoice-preview/components/InvoicePreview"

export default function NewInvoicePage() {
  const router = useRouter()
  const suggestedInvoiceNumber = useNextInvoiceNumber()
  const { form, lineItems, addLineItem, removeLineItem } = useInvoiceForm(
    suggestedInvoiceNumber
  )
  const [isSaving, setIsSaving] = useState(false)

  const values = form.watch()
  const previewInvoice: Invoice = {
    id: "draft",
    createdAt: "",
    updatedAt: "",
    ...values,
  }

  const onSubmit = form.handleSubmit(async (data) => {
    setIsSaving(true)
    const now = new Date().toISOString()
    const invoice: Invoice = {
      id: generateId(),
      createdAt: now,
      updatedAt: now,
      ...data,
    }
    await saveInvoice(invoice)
    router.push("/history")
  })

  return (
    <div className="min-h-svh bg-neutral-100 p-4 sm:p-6">
      <h1 className="mx-auto mb-4 max-w-6xl text-lg font-semibold text-neutral-900">
        TSB Invoice Maker
      </h1>
      <form
        onSubmit={onSubmit}
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
          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save invoice"}
          </Button>
        </div>
        <InvoicePreview invoice={previewInvoice} />
      </form>
    </div>
  )
}
