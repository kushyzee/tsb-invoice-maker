import type { Invoice } from "@/features/invoice-form/types"

export function buildExportFilename(
  invoice: Pick<Invoice, "invoiceNumber" | "customerName">
): string {
  const safeName = invoice.customerName.trim().replace(/\s+/g, "-") || "invoice"
  return `TSB-Invoice-${invoice.invoiceNumber}-${safeName}`
}

export function dataUrlToFile(
  dataUrl: string,
  filename: string,
  mimeType: string
): File {
  const base64 = dataUrl.split(",")[1] ?? ""
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i)
  }
  return new File([bytes], filename, { type: mimeType })
}
