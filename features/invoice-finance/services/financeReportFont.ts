// jsPDF's built-in fonts are WinAnsi/CP1252 encoded and cannot represent the
// naira sign (U+20A6): written through them, "₦230,000" extracts from the PDF
// as " ¦230,000". The report therefore embeds its own Unicode TTF instead, and
// `pdftotext` reads the exported figures back correctly.
const FONT_URL = "/fonts/Inter-Regular.ttf"

// The name the font is registered under inside jsPDF's virtual file system, not
// a URL. The report builder registers the same name.
export const FONT_FILE = "Inter-Regular.ttf"

// Inter Regular, same family the app already loads through next/font, so the
// report matches the UI. Static instance (no fvar/gvar) and OFL-1.1 — licence
// text sits beside it in public/fonts/OFL.txt.

// Cached across exports: the file is 324 KB and a report can be exported more
// than once in a session. A rejected load clears the cache so a later export
// can retry (e.g. the first export of an offline session).
let fontPromise: Promise<string> | null = null

export function loadFinanceReportFont(): Promise<string> {
  fontPromise ??= fetch(FONT_URL)
    .then((response) => {
      if (!response.ok) {
        throw new Error(`Font request failed with status ${response.status}`)
      }
      return response.arrayBuffer()
    })
    .then(arrayBufferToBase64)
    .catch((error: unknown) => {
      fontPromise = null
      throw error
    })

  return fontPromise
}

/**
 * btoa only takes a string, and spreading a 324 KB array into
 * `String.fromCharCode` overflows the call stack — so build it in chunks.
 */
function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer)
  const CHUNK_SIZE = 0x8000
  let binary = ""

  for (let i = 0; i < bytes.length; i += CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK_SIZE))
  }

  return btoa(binary)
}