"use client"

import { useState } from "react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useLiveQuery } from "dexie-react-hooks"
import { ArrowLeft } from "lucide-react"
import { getInvoiceById, saveInvoice } from "@/shared/lib/invoiceRepository"
import { useInvoiceForm } from "@/features/invoice-form/hooks/useInvoiceForm"
import { useSettings } from "@/features/settings/hooks/useSettings"
import { InvoiceForm } from "@/features/invoice-form/components/InvoiceForm"
import { InvoiceSummary } from "@/features/invoice-form/components/InvoiceSummary"
import { InvoicePreview } from "@/features/invoice-preview/components/InvoicePreview"
import { Button, buttonVariants } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Invoice } from "@/features/invoice-form/types"

export default function EditInvoicePage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const settings = useSettings()
  const [isSaving, setIsSaving] = useState(false)

  const existingInvoice = useLiveQuery(async () => {
    const found = await getInvoiceById(params.id)
    return found ?? null
  }, [params.id])

  const { form, lineItems, addLineItem, removeLineItem } = useInvoiceForm(
    "",
    existingInvoice
  )

  const values = form.watch()

  const previewInvoice: Invoice = {
    id: params.id,
    createdAt: existingInvoice?.createdAt ?? "",
    updatedAt: existingInvoice?.updatedAt ?? "",
    ...values,
  }

  const onSave = form.handleSubmit(async (data) => {
    if (!existingInvoice) return
    setIsSaving(true)
    try {
      const updated: Invoice = {
        ...existingInvoice,
        ...data,
        updatedAt: new Date().toISOString(),
      }
      await saveInvoice(updated)
      router.push(`/history/${params.id}`)
    } finally {
      setIsSaving(false)
    }
  })

  if (existingInvoice === undefined) {
    return (
      <div className="min-h-svh bg-neutral-100 p-6">
        <p className="text-sm text-neutral-500">Loading…</p>
      </div>
    )
  }

  if (existingInvoice === null) {
    return (
      <div className="min-h-svh bg-neutral-100 p-6">
        <p className="text-sm text-neutral-500">Invoice not found.</p>
        <Link href="/history" className="mt-2 inline-block text-sm underline">
          Back to history
        </Link>
      </div>
    )
  }

  return (
    <div className="min-h-svh bg-neutral-100 p-4 sm:p-6">
      <div className="mx-auto mb-4 flex max-w-6xl items-center justify-between">
        <Link
          href={`/history/${params.id}`}
          className={cn(
            buttonVariants({ variant: "ghost", size: "sm" }),
            "gap-1.5"
          )}
        >
          <ArrowLeft className="h-4 w-4" />
          Cancel
        </Link>
        <h1 className="text-lg font-semibold text-neutral-900">Edit Invoice</h1>
      </div>

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
          <Button type="submit" className="w-full" disabled={isSaving}>
            {isSaving ? "Saving…" : "Save changes"}
          </Button>
        </div>
        <InvoicePreview invoice={previewInvoice} settings={settings} />
      </form>
    </div>
  )
}
