"use client"

import { useState } from "react"
import { exportNodeToPngDataUrl } from "@/features/invoice-export/services/exportToImage"
import { exportPngDataUrlToPdf } from "@/features/invoice-export/services/exportToPdf"
import { dataUrlToFile } from "@/features/invoice-export/utils"

function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = filename
  link.click()
}

async function shareOrDownload(
  file: File,
  dataUrlFallback: string,
  filename: string
) {
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean
    share?: (data: { files: File[]; title?: string }) => Promise<void>
  }

  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: filename })
      return
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return
    }
  }

  downloadDataUrl(dataUrlFallback, filename)
}

export function useExportInvoice(nodeRef: React.RefObject<HTMLElement | null>) {
  const [isExporting, setIsExporting] = useState(false)

  const exportAsImage = async (filename: string) => {
    if (!nodeRef.current) return
    setIsExporting(true)
    try {
      const dataUrl = await exportNodeToPngDataUrl(nodeRef.current)
      const file = dataUrlToFile(dataUrl, `${filename}.png`, "image/png")
      await shareOrDownload(file, dataUrl, `${filename}.png`)
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
      const blob = pdf.output("blob")
      const file = new File([blob], `${filename}.pdf`, {
        type: "application/pdf",
      })
      const pdfDataUrl = pdf.output("datauristring")
      await shareOrDownload(file, pdfDataUrl, `${filename}.pdf`)
    } finally {
      setIsExporting(false)
    }
  }

  return { exportAsImage, exportAsPdf, isExporting }
}
