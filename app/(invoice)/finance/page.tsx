"use client"

import { useMemo, useState } from "react"
import { ChevronLeft, ChevronRight, FileDown } from "lucide-react"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { MonthlyFinanceSummary } from "@/features/invoice-finance/components/MonthlyFinanceSummary"
import { MonthlyInvoiceBreakdown } from "@/features/invoice-finance/components/MonthlyInvoiceBreakdown"
import { useFinanceInvoices } from "@/features/invoice-finance/hooks/useFinanceInvoices"
import {
  calculateMonthlyFinance,
  currentMonth,
  formatMonthLabel,
  monthKeyOf,
  shiftMonth,
} from "@/features/invoice-finance/utils"
import { useExportFinanceReport } from "@/features/invoice-finance/hooks/useExportFinanceReport"
import { useSettings } from "@/features/settings/hooks/useSettings"
import { toast } from "@/components/ui/toast"

export default function FinancePage() {
  const { invoices, isLoading } = useFinanceInvoices()
  const [month, setMonth] = useState(currentMonth)
  const settings = useSettings()
  const { exportAsPdf, isExporting } = useExportFinanceReport()

  const monthInvoices = useMemo(
    () =>
      invoices
        .filter((invoice) => monthKeyOf(invoice) === month)
        // Chronological within the month; invoice number breaks same-day ties.
        .sort(
          (a, b) =>
            a.issueDate.localeCompare(b.issueDate) ||
            (Number(a.invoiceNumber) || 0) - (Number(b.invoiceNumber) || 0)
        ),
    [invoices, month]
  )

  const totals = useMemo(
    () => calculateMonthlyFinance(monthInvoices),
    [monthInvoices]
  )

  // Hands the report the very objects the page is showing — the selected month,
  // its invoices, and their totals — so the PDF cannot disagree with the screen.
  const onExport = async () => {
    try {
      const exported = await exportAsPdf({
        businessName: settings.businessName,
        month,
        totals,
        invoices: monthInvoices,
      })

      // A dismissed share sheet resolves false — don't claim it was exported.
      if (exported) {
        toast.add({
          title: "Report exported",
          description: `Financial report for ${formatMonthLabel(month)}.`,
          type: "success",
        })
      }
    } catch {
      toast.add({
        title: "Export failed",
        description: "The report could not be created. Try again.",
        type: "error",
      })
    }
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-4 text-lg font-semibold text-neutral-900">
          Financial Overview
        </h1>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap items-end gap-2">
              <Field className="max-w-64">
                <FieldLabel htmlFor="finance-month" className="sr-only">
                  Month
                </FieldLabel>
                <Input
                  id="finance-month"
                  type="month"
                  value={month}
                  onChange={(event) => setMonth(event.target.value)}
                />
              </Field>
              <div className="inline-flex gap-2">
                <button
                  type="button"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "icon" }),
                    "shrink-0"
                  )}
                  onClick={() => setMonth((current) => shiftMonth(current, -1))}
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  className={cn(
                    buttonVariants({ variant: "outline", size: "icon" }),
                    "shrink-0"
                  )}
                  onClick={() => setMonth((current) => shiftMonth(current, 1))}
                  aria-label="Next month"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={onExport}
                disabled={isExporting || isLoading || !month}
                className="ml-auto flex-1 gap-1.5 sm:flex-auto"
              >
                <FileDown className="h-4 w-4" />
                {isExporting ? "Exporting…" : "Export PDF"}
              </Button>
            </div>
          </CardContent>
        </Card>

        {!month ? (
          <p className="text-sm text-neutral-500">
            Select a month to see its figures.
          </p>
        ) : isLoading ? (
          <p className="text-sm text-neutral-500">Loading…</p>
        ) : (
          <div className="space-y-4">
            <MonthlyFinanceSummary totals={totals} />

            <Card>
              <CardHeader>
                <CardTitle className="text-base">Invoice breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <MonthlyInvoiceBreakdown invoices={monthInvoices} />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
