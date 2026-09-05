import QRCode from "qrcode";

/**
 * The QR code the flyer and the table tent point at.
 *
 * Generated on request rather than checked in as an image, because the
 * address it encodes is the site's own URL plus /bad-decisions — if that
 * ever changes, a checked-in image would quietly point at the wrong thing.
 * SVG, not PNG: it prints crisp at flyer size from a vector with no library
 * beyond the one already doing the encoding.
 */
export async function decisionsQrSvg(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: "svg",
    margin: 1,
    color: { dark: "#000000", light: "#ffffff" },
  });
}
