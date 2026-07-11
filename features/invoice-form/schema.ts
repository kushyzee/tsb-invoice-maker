import { z } from "zod"

export const lineItemSchema = z.object({
  id: z.string(),
  description: z.string().min(1, "Description is required"),
  unitPrice: z.number().min(0, "Must be 0 or more"),
  qty: z.number().min(1, "Must be at least 1"),
})

export const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, "Invoice number is required"),
  customerName: z.string().min(1, "Customer name is required"),
  issueDate: z.string().min(1, "Issue date is required"),
  dueDate: z.string().min(1, "Due date is required"),
  lineItems: z.array(lineItemSchema).min(1, "Add at least one item"),
  discountType: z.enum(["none", "fixed", "percentage"]),
  discountValue: z.number().min(0),
})

export type InvoiceFormValues = z.infer<typeof invoiceFormSchema>
