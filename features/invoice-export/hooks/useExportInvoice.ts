"use client"

import { useState } from "react"
import { exportNodeToPngDataUrl } from "@/features/invoice-export/services/exportToImage"
import { exportPngDataUrlToPdf } from "@/features/invoice-export/services/exportToPdf"

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = filename
  link.click()
}

export function useExportInvoice(nodeRef: React.RefObject<HTMLElement | null>) {
  const [isExporting, setIsExporting] = useState(false)

  const exportAsImage = async (filename: string) => {
    if (!nodeRef.current) return
    setIsExporting(true)
    try {
      const dataUrl = await exportNodeToPngDataUrl(nodeRef.current)
      downloadDataUrl(dataUrl, `${filename}.png`)
    } finally {
      setIsExporting(false)
    }
  }

  const exportAsPdf = async (filename: string) => {
    if (!nodeRef.current) return
    setIsExporting(true)
    try {
      const node = nodeRef.current
      const dataUrl = await exportNodeToPngDataUrl(node)
      const pdf = exportPngDataUrlToPdf(
        dataUrl,
        node.offsetWidth,
        node.offsetHeight
      )
      pdf.save(`${filename}.pdf`)
    } finally {
      setIsExporting(false)
    }
  }

  return { exportAsImage, exportAsPdf, isExporting }
}
