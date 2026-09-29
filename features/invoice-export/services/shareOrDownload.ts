function downloadDataUrl(dataUrl: string, filename: string) {
  const link = document.createElement("a")
  link.href = dataUrl
  link.download = filename
  link.click()
}

/**
 * Resolves `true` when the file was shared or downloaded, and `false` when the
 * user dismissed the share sheet — so callers can tell a completed export from
 * a cancelled one without guessing.
 *
 * Shared by the invoice export and the finance report export. The Web Share
 * fallback and its AbortError handling are easy to get subtly wrong, so there
 * is deliberately one implementation of it.
 */
export async function shareOrDownload(
  file: File,
  dataUrlFallback: string,
  filename: string
): Promise<boolean> {
  const nav = navigator as Navigator & {
    canShare?: (data: { files: File[] }) => boolean
    share?: (data: { files: File[]; title?: string }) => Promise<void>
  }

  if (nav.share && nav.canShare?.({ files: [file] })) {
    try {
      await nav.share({ files: [file], title: filename })
      return true
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") return false
    }
  }

  downloadDataUrl(dataUrlFallback, filename)
  return true
}