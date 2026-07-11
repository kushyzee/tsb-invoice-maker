import { z } from "zod"

export const settingsSchema = z.object({
  businessName: z.string().min(1, "Business name is required"),
  payToBankName: z.string().min(1, "Bank name is required"),
  payToAccountName: z.string().min(1, "Account name is required"),
  payToAccountNumber: z.string().min(1, "Account number is required"),
  paymentTermsNote: z.string().min(1, "Payment terms note is required"),
})

export type SettingsFormValues = z.infer<typeof settingsSchema>
