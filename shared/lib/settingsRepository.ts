import { db } from "@/shared/lib/db"
import { DEFAULT_SETTINGS } from "@/shared/lib/constants"
import type { Settings } from "@/features/settings/types"

const SETTINGS_ID = "singleton"

export async function getSettings(): Promise<Settings> {
  const record = await db.settings.get(SETTINGS_ID)
  return record ?? DEFAULT_SETTINGS
}

export async function saveSettings(settings: Settings): Promise<void> {
  await db.settings.put({ ...settings, id: SETTINGS_ID })
}
