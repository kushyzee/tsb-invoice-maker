import jsPDF from "jspdf"
import { formatDateForPrint, formatNaira } from "@/shared/lib/money"
import {
  calculateFinance,
  formatMonthLabel,
  type MonthlyFinance,
} from "@/features/invoice-finance/utils"
import { FONT_FILE } from "@/features/invoice-finance/services/financeReportFont"
import type { Invoice } from "@/features/invoice-form/types"

type Rgb = [number, number, number]

const PAGE = { width: 210, height: 297 } // A4 portrait, in millimetres
const MARGIN = 15
const CONTENT_WIDTH = PAGE.width - MARGIN * 2
const CONTENT_BOTTOM = PAGE.height - MARGIN - 10
const FOOTER_BASELINE = PAGE.height - MARGIN + 4

// One weight only: jsPDF cannot synthesise a bold, and shipping a second TTF
// would double the asset. Hierarchy comes from size and colour instead.
const FONT = "Report"

const INK: Rgb = [23, 23, 23] // neutral-900
const MUTED: Rgb = [115, 115, 115] // neutral-500
const RULE: Rgb = [229, 229, 229] // neutral-200
// Resolved sRGB of `--destructive: oklch(0.577 0.245 27.325)` from
// app/globals.css, so a loss or an overpayment reads red here exactly as it does
// on the finance page. jsPDF never touches CSS, so the value is pinned here.
const DESTRUCTIVE: Rgb = [231, 0, 10]

const LINE_HEIGHT = 3.4
const ROW_PADDING = 1.8
const SUMMARY_CELL_WIDTH = (CONTENT_WIDTH - 6) / 2
const SUMMARY_CELL_HEIGHT = 15

/** Mirrors the five month tiles on the finance page, in the same order. */
const SUMMARY_METRICS: {
  label: string
  read: (totals: MonthlyFinance) => number
}[] = [
  { label: "Invoiced", read: (t) => t.invoiced },
  { label: "Collected", read: (t) => t.amountPaid },
  { label: "Expenses", read: (t) => t.expenses },
  { label: "Actual profit", read: (t) => t.actualProfit },
  { label: "Outstanding", read: (t) => t.outstanding },
]

/** Mirrors MonthlyInvoiceBreakdown's columns, order and alignment. */
const COLUMNS = [
  { label: "Invoice", width: 24, align: "left" },
  { label: "Customer", width: 44, align: "left" },
  { label: "Invoiced", width: 22, align: "right" },
  { label: "Amount paid", width: 22, align: "right" },
  { label: "Expenses", width: 22, align: "right" },
  { label: "Actual profit", width: 22, align: "right" },
  { label: "Outstanding", width: 24, align: "right" },
] as const

export type FinanceReportInput = {
  businessName: string
  month: string
  totals: MonthlyFinance
  invoices: Invoice[]
  fontBase64: string
}

type ReportRow = {
  invoiceLines: string[]
  customerLines: string[]
  values: number[]
  height: number
}

/**
 * Builds the internal monthly finance report as a real text PDF.
 *
 * Deliberately a pure data-in/PDF-out function with no second calculation path:
 * the caller hands over the totals and the month invoices the finance page
 * already computed, and per-row figures come from the same `calculateFinance`
 * the on-screen breakdown uses. It never filters, sorts, or re-sums.
 */
export function buildFinanceReportPdf({
  businessName,
  month,
  totals,
  invoices,
  fontBase64,
}: FinanceReportInput): jsPDF {
  const pdf = new jsPDF({ unit: "mm", format: "a4", putOnlyUsedFonts: true })
  pdf.addFileToVFS(FONT_FILE, fontBase64)
  pdf.addFont(FONT_FILE, FONT, "normal")
  pdf.setFont(FONT, "normal")
  pdf.setFontSize(10)

  let y = MARGIN + 5

  setColour(pdf, INK)
  pdf.setFontSize(15)
  pdf.text(businessName, MARGIN, y)
  y += 6.5

  pdf.setFontSize(12)
  pdf.text("Financial Overview", MARGIN, y)
  y += 5.5

  setColour(pdf, MUTED)
  pdf.setFontSize(10)
  pdf.text(formatMonthLabel(month), MARGIN, y)
  y += 3

  drawRule(pdf, y)
  y += 9

  SUMMARY_METRICS.forEach((metric, index) => {
    const cellX = MARGIN + (index % 2) * (SUMMARY_CELL_WIDTH + 6)
    const cellY = y + Math.floor(index / 2) * SUMMARY_CELL_HEIGHT
    const value = metric.read(totals)

    setColour(pdf, MUTED)
    pdf.setFontSize(8)
    pdf.text(metric.label.toUpperCase(), cellX, cellY)

    pdf.setFontSize(12)
    setColour(pdf, value < 0 ? DESTRUCTIVE : INK)
    pdf.text(formatNaira(value), cellX, cellY + 6)
  })

  y += Math.ceil(SUMMARY_METRICS.length / 2) * SUMMARY_CELL_HEIGHT + 2

  setColour(pdf, MUTED)
  pdf.setFontSize(9)
  pdf.text(
    `${totals.invoiceCount} ${totals.invoiceCount === 1 ? "invoice" : "invoices"}`,
    MARGIN,
    y
  )
  y += 9

  setColour(pdf, INK)
  pdf.setFontSize(11)
  pdf.text("Invoice breakdown", MARGIN, y)
  y += 5

  if (invoices.length === 0) {
    setColour(pdf, MUTED)
    pdf.setFontSize(9)
    pdf.text("No invoices in this month.", MARGIN, y)
  } else {
    y = drawTableHeader(pdf, y)

    for (const invoice of invoices) {
      const row = buildRow(pdf, invoice)

      if (y + row.height > CONTENT_BOTTOM) {
        pdf.addPage()
        pdf.setFont(FONT, "normal")
        y = drawTableHeader(pdf, MARGIN + 4)
      }

      y = drawRow(pdf, row, y)
    }
  }

  stampFooters(pdf)

  return pdf
}

/**
 * Measured before drawing so a row is never split across a page break, and so a
 * long customer name wraps instead of being silently truncated.
 */
function buildRow(pdf: jsPDF, invoice: Invoice): ReportRow {
  const finance = calculateFinance(invoice)
  const invoiceLines = [
    `#${invoice.invoiceNumber}`,
    formatDateForPrint(invoice.issueDate),
  ].filter(Boolean)
  const customerLines = pdf.splitTextToSize(
    invoice.customerName || "Untitled",
    COLUMNS[1].width
  )
  const values = [
    finance.invoiced,
    finance.amountPaid,
    finance.expenses,
    finance.actualProfit,
    finance.outstanding,
  ]
  const lineCount = Math.max(invoiceLines.length, customerLines.length, 1)

  return {
    invoiceLines,
    customerLines,
    values,
    height: lineCount * LINE_HEIGHT + ROW_PADDING,
  }
}

function drawTableHeader(pdf: jsPDF, y: number): number {
  pdf.setFontSize(8)
  setColour(pdf, MUTED)

  let x = MARGIN
  for (const column of COLUMNS) {
    const at = column.align === "right" ? x + column.width : x
    pdf.text(column.label, at, y, { align: column.align })
    x += column.width
  }

  drawRule(pdf, y + 1.6)

  return y + 6
}

function drawRow(pdf: jsPDF, row: ReportRow, y: number): number {
  pdf.setFontSize(8)

  let x = MARGIN

  row.invoiceLines.forEach((line, index) => {
    setColour(pdf, INK)
    pdf.text(line, x, y + index * LINE_HEIGHT)
  })
  x += COLUMNS[0].width

  row.customerLines.forEach((line, index) => {
    setColour(pdf, INK)
    pdf.text(line, x, y + index * LINE_HEIGHT)
  })
  x += COLUMNS[1].width

  row.values.forEach((value, index) => {
    const column = COLUMNS[index + 2]
    setColour(pdf, value < 0 ? DESTRUCTIVE : INK)
    pdf.text(formatNaira(value), x + column.width, y, { align: "right" })
    x += column.width
  })

  return y + row.height
}

function drawRule(pdf: jsPDF, y: number) {
  setColour(pdf, RULE)
  pdf.setLineWidth(0.2)
  pdf.line(MARGIN, y, PAGE.width - MARGIN, y)
}

/** Stamped once the body is laid out, so every page carries the disclaimer. */
function stampFooters(pdf: jsPDF) {
  const pages = pdf.getNumberOfPages()

  for (let page = 1; page <= pages; page += 1) {
    pdf.setPage(page)
    pdf.setFont(FONT, "normal")
    pdf.setFontSize(7)
    setColour(pdf, MUTED)
    pdf.text(
      "Internal document — not a customer invoice.",
      MARGIN,
      FOOTER_BASELINE
    )
    pdf.text(`Page ${page} of ${pages}`, PAGE.width - MARGIN, FOOTER_BASELINE, {
      align: "right",
    })
  }
}

function setColour(pdf: jsPDF, [red, green, blue]: Rgb) {
  pdf.setTextColor(red, green, blue)
}