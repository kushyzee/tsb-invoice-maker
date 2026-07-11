"use client"

import { useLiveQuery } from "dexie-react-hooks"
import { getSettings } from "@/shared/lib/settingsRepository"
import { DEFAULT_SETTINGS } from "@/shared/lib/constants"

export function useSettings() {
  const settings = useLiveQuery(getSettings, [])
  return settings ?? DEFAULT_SETTINGS
}
