import { SettingsForm } from "@/features/settings/components/SettingsForm"

export default function SettingsPage() {
  return (
    <div className="min-h-svh bg-neutral-100 p-4 sm:p-6">
      <div className="mx-auto max-w-md">
        <h1 className="mb-4 text-lg font-semibold text-neutral-900">
          Settings
        </h1>
        <SettingsForm />
      </div>
    </div>
  )
}
