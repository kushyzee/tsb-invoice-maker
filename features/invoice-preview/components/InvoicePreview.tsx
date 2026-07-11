"use client"

import { useLayoutEffect, useRef, useState } from "react"
import type { Invoice } from "@/features/invoice-form/types"
import { calculateTotals } from "@/features/invoice-preview/utils"
import { InvoiceHeader } from "@/features/invoice-preview/components/sections/InvoiceHeader"
import { IssuedToBlock } from "@/features/invoice-preview/components/sections/IssuedToBlock"
import { InvoiceMetaBlock } from "@/features/invoice-preview/components/sections/InvoiceMetaBlock"
import { PayToBlock } from "@/features/invoice-preview/components/sections/PayToBlock"
import { PaymentNoteBlock } from "@/features/invoice-preview/components/sections/PaymentNoteBlock"
import { ItemsTable } from "@/features/invoice-preview/components/sections/ItemsTable"
import { TotalsBlock } from "@/features/invoice-preview/components/sections/TotalsBlock"
import { InvoiceFooter } from "@/features/invoice-preview/components/sections/InvoiceFooter"

type InvoicePreviewProps = {
  invoice: Invoice
}

const PAGE_WIDTH = 700

export function InvoicePreview({ invoice }: InvoicePreviewProps) {
  const { subtotal, discountAmount, total } = calculateTotals(invoice)

  const containerRef = useRef<HTMLDivElement>(null)
  const pageRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [pageHeight, setPageHeight] = useState<number | null>(null)

  useLayoutEffect(() => {
    const container = containerRef.current
    const page = pageRef.current
    if (!container || !page) return

    const measure = () => {
      const containerWidth = container.offsetWidth
      setScale(Math.min(containerWidth / PAGE_WIDTH, 1))
      setPageHeight(page.offsetHeight)
    }

    measure()

    const resizeObserver = new ResizeObserver(measure)
    resizeObserver.observe(container)
    resizeObserver.observe(page)

    return () => resizeObserver.disconnect()
  }, [invoice])

  const hasMeasured = pageHeight !== null

  const pageContent = (
    <>
      <InvoiceHeader />

      <div className="mt-14 flex justify-between">
        <IssuedToBlock customerName={invoice.customerName} />
        <InvoiceMetaBlock
          invoiceNumber={invoice.invoiceNumber}
          issueDate={invoice.issueDate}
          dueDate={invoice.dueDate}
        />
      </div>

      <div className="mt-8 flex justify-between">
        <PayToBlock />
        <PaymentNoteBlock />
      </div>

      <div className="mt-10">
        <ItemsTable lineItems={invoice.lineItems} />
      </div>

      <div className="mt-4">
        <TotalsBlock
          subtotal={subtotal}
          discountAmount={discountAmount}
          total={total}
        />
      </div>

      <InvoiceFooter />
    </>
  )

  return (
    <div ref={containerRef} className="w-full min-w-0">
      <div
        className="mx-auto overflow-hidden"
        style={
          hasMeasured
            ? { width: PAGE_WIDTH * scale, height: pageHeight! * scale }
            : undefined
        }
      >
        <div
          ref={pageRef}
          style={{
            width: PAGE_WIDTH,
            transform: hasMeasured ? `scale(${scale})` : undefined,
            transformOrigin: "top left",
          }}
          className="bg-white px-14 py-16 shadow-sm"
        >
          {pageContent}
        </div>
      </div>
    </div>
  )
}
