import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { formatNaira } from "@/shared/lib/money"
import type { LineItem } from "@/features/invoice-form/types"

type ItemsTableProps = {
  lineItems: LineItem[]
}

export function ItemsTable({ lineItems }: ItemsTableProps) {
  return (
    <Table className="table-fixed">
      <TableHeader>
        <TableRow className="border-neutral-800 hover:bg-transparent">
          <TableHead className="text-xs font-bold tracking-wide text-neutral-900">
            DESCRIPTION
          </TableHead>
          <TableHead className="w-[110px] text-right text-xs font-bold tracking-wide text-neutral-900">
            UNIT PRICE
          </TableHead>
          <TableHead className="w-[70px] text-right text-xs font-bold tracking-wide text-neutral-900">
            QTY
          </TableHead>
          <TableHead className="w-[100px] text-right text-xs font-bold tracking-wide text-neutral-900">
            TOTAL
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {lineItems.map((item, index) => (
          <TableRow key={item.id} className="border-none hover:bg-transparent">
            <TableCell className="py-3 text-sm wrap-break-word whitespace-normal text-neutral-800">
              {index + 1}. {item.description || "—"}
            </TableCell>
            <TableCell className="py-3 text-right text-sm text-neutral-800">
              {formatNaira(item.unitPrice)}
            </TableCell>
            <TableCell className="py-3 text-right text-sm text-neutral-800">
              {item.qty}
            </TableCell>
            <TableCell className="py-3 text-right text-sm text-neutral-800">
              {formatNaira(item.unitPrice * item.qty)}
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
