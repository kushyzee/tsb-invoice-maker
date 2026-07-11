"use client"

import { useEffect, useState } from "react"
import { Controller, useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldLabel, FieldError } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import {
  settingsSchema,
  type SettingsFormValues,
} from "@/features/settings/schema"
import { useSettings } from "@/features/settings/hooks/useSettings"
import { saveSettings } from "@/shared/lib/settingsRepository"

export function SettingsForm() {
  const currentSettings = useSettings()
  const [isSaving, setIsSaving] = useState(false)
  const [justSaved, setJustSaved] = useState(false)

  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: currentSettings,
  })

  // currentSettings arrives async (Dexie read) — same timing issue as the
  // invoice-number suggestion. Reset the form once the real values load.
  useEffect(() => {
    form.reset(currentSettings)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSettings])

  const onSubmit = form.handleSubmit(async (data) => {
    setIsSaving(true)
    setJustSaved(false)
    try {
      await saveSettings(data)
      setJustSaved(true)
    } finally {
      setIsSaving(false)
    }
  })

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Business Details</CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            name="businessName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Business name</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Pay To</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Controller
            name="payToBankName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Bank name</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="payToAccountName"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Account name</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
          <Controller
            name="payToAccountNumber"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name}>Account number</FieldLabel>
                <Input
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Payment Terms Note</CardTitle>
        </CardHeader>
        <CardContent>
          <Controller
            name="paymentTermsNote"
            control={form.control}
            render={({ field, fieldState }) => (
              <Field data-invalid={fieldState.invalid}>
                <FieldLabel htmlFor={field.name} className="sr-only">
                  Payment terms note
                </FieldLabel>
                <Textarea
                  {...field}
                  id={field.name}
                  aria-invalid={fieldState.invalid}
                  rows={3}
                />
                {fieldState.invalid && (
                  <FieldError errors={[fieldState.error]} />
                )}
              </Field>
            )}
          />
        </CardContent>
      </Card>

      <Button type="submit" className="w-full" disabled={isSaving}>
        {isSaving ? "Saving…" : justSaved ? "Saved ✓" : "Save settings"}
      </Button>
    </form>
  )
}
