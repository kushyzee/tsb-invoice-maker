import { toPng } from "html-to-image"

export async function exportNodeToPngDataUrl(
  node: HTMLElement
): Promise<string> {
  return toPng(node, {
    pixelRatio: 3,
    style: {
      transform: "none",
    },
  })
}
