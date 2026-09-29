"use client"

import { useState } from "react"
import {
  buildFinanceReportPdf,
  type FinanceReportInput,
} from "@/features/invoice-finance/services/financeReportPdf"
import { loadFinanceReportFont } from "@/features/invoice-finance/services/financeReportFont"
import { buildFinanceReportFilename } from "@/features/invoice-finance/utils"
import { shareOrDownload } from "@/features/invoice-export/services/shareOrDownload"

type FinanceReport = Omit<FinanceReportInput, "fontBase64">

/**
 * Builds the internal finance report and shares or downloads it.
 *
 * The caller passes the month already selected on the finance page together
 * with the totals and invoices it computed for that month, so the report cannot
 * drift from what is on screen. Errors propagate to the caller: the font fetch
 * is a real failure mode, and the button needs to say so rather than go quiet.
 */
export function useExportFinanceReport() {
  const [isExporting, setIsExporting] = useState(false)

  const exportAsPdf = async (report: FinanceReport): Promise<boolean> => {
    setIsExporting(true)
    try {
      const fontBase64 = await loadFinanceReportFont()
      const pdf = buildFinanceReportPdf({ ...report, fontBase64 })
      const filename = `${buildFinanceReportFilename(report.month)}.pdf`
      const file = new File([pdf.output("blob")], filename, {
        type: "application/pdf",
      })

      return await shareOrDownload(file, pdf.output("datauristring"), filename)
    } finally {
      setIsExporting(false)
    }
  }

  return { exportAsPdf, isExporting }
}