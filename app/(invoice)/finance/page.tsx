"use client"

import { useMemo, useState } from "react"
import Link from "next/link"
import { ChevronLeft, ChevronRight, History, Plus, Settings } from "lucide-react"
import { buttonVariants } from "@/components/ui/button"
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
  monthKeyOf,
  shiftMonth,
} from "@/features/invoice-finance/utils"

export default function FinancePage() {
  const { invoices, isLoading } = useFinanceInvoices()
  const [month, setMonth] = useState(currentMonth)

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

  return (
    <div className="min-h-svh bg-neutral-100 p-4 sm:p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-4 flex items-center justify-between gap-2">
          <h1 className="text-lg font-semibold text-neutral-900">
            Financial Overview
          </h1>
          <div className="flex gap-2">
            <Link
              href="/history"
              className={cn(
                buttonVariants({ variant: "outline", size: "sm" }),
                "gap-1.5"
              )}
            >
              <History className="h-4 w-4" />
              History
            </Link>
            <Link
              href="/new"
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" })
              )}
              aria-label="New invoice"
            >
              <Plus className="h-4 w-4" />
            </Link>
            <Link
              href="/settings"
              className={cn(
                buttonVariants({ variant: "outline", size: "icon" })
              )}
              aria-label="Settings"
            >
              <Settings className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <Card className="mb-4">
          <CardHeader>
            <CardTitle className="text-base">Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-end gap-2">
              <Field className="max-w-56">
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
                <CardTitle className="text-base">
                  Invoice breakdown
                </CardTitle>
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
