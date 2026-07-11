"use client"

import { Input } from "@/components/ui/input"
import { Search } from "lucide-react"

type InvoiceSearchBarProps = {
  value: string
  onChange: (value: string) => void
}

export function InvoiceSearchBar({ value, onChange }: InvoiceSearchBarProps) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-neutral-400" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="Search by customer or invoice no."
        className="pl-9"
      />
    </div>
  )
}
