"use client"

import { Controller } from "react-hook-form"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"
import type { UseFormReturn, UseFieldArrayReturn } from "react-hook-form"
import { InvoiceFormValues } from "@/features/invoice-form/schema"

type InvoiceLineItemsTableProps = {
  form: UseFormReturn<InvoiceFormValues>
  lineItems: UseFieldArrayReturn<InvoiceFormValues, "lineItems">
  onRemoveLineItem: (index: number) => void
}

export function InvoiceLineItemsTable({
  form,
  lineItems,
  onRemoveLineItem,
}: InvoiceLineItemsTableProps) {
  return (
    <div className="space-y-3">
      {lineItems.fields.map((item, index) => (
        <div
          key={item.id}
          className="grid grid-cols-2 gap-2 sm:grid-cols-[1fr_110px_70px_36px] sm:items-start"
        >
          <div className="col-span-2 sm:col-span-1">
            <Controller
              name={`lineItems.${index}.description`}
              control={form.control}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={field.name} className="sr-only">
                    Item {index + 1} description
                  </FieldLabel>
                  <Input
                    {...field}
                    id={field.name}
                    aria-invalid={fieldState.invalid}
                    placeholder="Description"
                  />
                  {fieldState.invalid && (
                    <FieldError errors={[fieldState.error]} />
                  )}
                </Field>
              )}
            />
          </div>

          <Controller
            name={`lineItems.${index}.unitPrice`}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="sr-only">
                  Item {index + 1} unit price
                </FieldLabel>
                <Input
                  id={field.name}
                  type="number"
                  inputMode="numeric"
                  aria-invalid={fieldState.invalid}
                  placeholder="Unit price"
                  value={field.value === 0 ? "" : field.value}
                  onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                  onBlur={field.onBlur}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Controller
            name={`lineItems.${index}.qty`}
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="sr-only">
                  Item {index + 1} quantity
                </FieldLabel>
                <Input
                  id={field.name}
                  type="number"
                  inputMode="numeric"
                  aria-invalid={fieldState.invalid}
                  placeholder="Qty"
                  value={field.value}
                  onChange={(e) =>
                    field.onChange(Math.max(1, Number(e.target.value) || 1))
                  }
                  onBlur={field.onBlur}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />

          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemoveLineItem(index)}
            disabled={lineItems.fields.length <= 1}
            className="text-neutral-500 hover:text-red-600"
            aria-label={`Remove item ${index + 1}`}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
