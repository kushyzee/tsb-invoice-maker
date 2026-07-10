export type LineItem = {
  id: string
  description: string
  unitPrice: number
  qty: number
}

export type DiscountType = "none" | "fixed" | "percentage"

export type Invoice = {
  id: string
  invoiceNumber: string
  customerName: string
  issueDate: string
  dueDate: string
  lineItems: LineItem[]
  discountType: DiscountType
  discountValue: number
  createdAt: string
  updatedAt: string
}
