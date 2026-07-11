import jsPDF from "jspdf"

export function exportPngDataUrlToPdf(
  dataUrl: string,
  widthPx: number,
  heightPx: number
): jsPDF {
  const pdf = new jsPDF({
    orientation: heightPx >= widthPx ? "portrait" : "landscape",
    unit: "px",
    format: [widthPx, heightPx],
  })
  pdf.addImage(dataUrl, "PNG", 0, 0, widthPx, heightPx)
  return pdf
}
