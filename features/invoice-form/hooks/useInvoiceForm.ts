"use client"

import { useEffect } from "react"
import { useForm, useFieldArray } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import {
  invoiceFormSchema,
  type InvoiceFormValues,
} from "@/features/invoice-form/schema"
import { generateId } from "@/shared/lib/utils"
import { Invoice } from "../types"

function todayISO() {
  return new Date().toISOString().slice(0, 10)
}

function emptyLineItem() {
  return { id: generateId(), description: "", unitPrice: 0, qty: 1 }
}

export function useInvoiceForm(
  suggestedInvoiceNumber: string,
  initialInvoice?: Invoice | null
) {
  const form = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceFormSchema),
    mode: "onBlur",
    defaultValues: {
      invoiceNumber: "",
      customerName: "",
      issueDate: todayISO(),
      dueDate: "",
      lineItems: [emptyLineItem()],
      discountType: "none",
      discountValue: 0,
    },
  })

  useEffect(() => {
    if (!initialInvoice) return
    form.reset({
      invoiceNumber: initialInvoice.invoiceNumber,
      customerName: initialInvoice.customerName,
      issueDate: initialInvoice.issueDate,
      dueDate: initialInvoice.dueDate,
      lineItems: initialInvoice.lineItems,
      discountType: initialInvoice.discountType,
      discountValue: initialInvoice.discountValue,
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialInvoice])

  useEffect(() => {
    if (suggestedInvoiceNumber && !form.formState.dirtyFields.invoiceNumber) {
      form.setValue("invoiceNumber", suggestedInvoiceNumber)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [suggestedInvoiceNumber])

  const lineItems = useFieldArray({
    control: form.control,
    name: "lineItems",
  })

  const addLineItem = () => lineItems.append(emptyLineItem())

  const removeLineItem = (index: number) => {
    if (lineItems.fields.length > 1) lineItems.remove(index)
  }

  return { form, lineItems, addLineItem, removeLineItem }
}
