"use client"

import { useState } from "react"
import { exportNodeToPngDataUrl } from "@/features/invoice-export/services/exportToImage"
import { exportPngDataUrlToPdf } from "@/features/invoice-export/services/exportToPdf"
import { shareOrDownload } from "@/features/invoice-export/services/shareOrDownload"
import { dataUrlToFile } from "@/features/invoice-export/utils"

export function useExportInvoice(nodeRef: React.RefObject<HTMLElement | null>) {
  const [isExporting, setIsExporting] = useState(false)

  const exportAsImage = async (filename: string): Promise<boolean> => {
    if (!nodeRef.current) return false
    setIsExporting(true)
    try {
      const dataUrl = await exportNodeToPngDataUrl(nodeRef.current)
      const file = dataUrlToFile(dataUrl, `${filename}.png`, "image/png")
      return await shareOrDownload(file, dataUrl, `${filename}.png`)
    } finally {
      setIsExporting(false)
    }
  }

  const exportAsPdf = async (filename: string): Promise<boolean> => {
    if (!nodeRef.current) return false
    setIsExporting(true)
    try {
      const node = nodeRef.current
      const dataUrl = await exportNodeToPngDataUrl(node)
      const pdf = exportPngDataUrlToPdf(
        dataUrl,
        node.offsetWidth,
        node.offsetHeight
      )
      const blob = pdf.output("blob")
      const file = new File([blob], `${filename}.pdf`, {
        type: "application/pdf",
      })
      const pdfDataUrl = pdf.output("datauristring")
      return await shareOrDownload(file, pdfDataUrl, `${filename}.pdf`)
    } finally {
      setIsExporting(false)
    }
  }

  return { exportAsImage, exportAsPdf, isExporting }
}
