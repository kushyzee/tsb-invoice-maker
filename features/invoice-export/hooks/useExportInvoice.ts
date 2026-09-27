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

/**
 * Resolves `true` when the file was shared or downloaded, and `false` when the
 * user dismissed the share sheet — so callers can tell a completed export from
 * a cancelled one without guessing.
 */
async function shareOrDownload(
  file: File,
  dataUrlFallback: string,
  filename: string
): Promise<boolean> {
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean
    share?: (data: { files: File[]; title?: string }) => Promise<void>
  }

  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: filename })
      return true
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return false
    }
  }

  downloadDataUrl(dataUrlFallback, filename)
  return true
}

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
