import { toPng } from "html-to-image"

export async function exportNodeToPngDataUrl(
  node: HTMLElement
): Promise<string> {
  return toPng(node, {
    pixelRatio: 2,
    style: {
      transform: "none",
    },
  })
}
