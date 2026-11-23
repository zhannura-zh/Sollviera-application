import TextRecognition from '@react-native-ml-kit/text-recognition';
import PdfThumbnail from 'react-native-pdf-thumbnail';
import { mergeMrz, missingKzSide, parseMrz, type MrzResult } from '@/lib/mrz';

// On-device document reading (ML Kit): nothing leaves the phone.

/** Part of the photo to read, in its pixels. */
export interface Region {
  left: number;
  top: number;
  right: number;
  bottom: number;
  /** Size of the photo the region was computed for. */
  photoWidth: number;
  photoHeight: number;
}

/** Reads the photo; with `region`, only text lines whose centre lies inside it count. */
export async function recognizeImage(uri: string, region?: Region) {
  const ocr = await TextRecognition.recognize(uri);
  if (!region) return parseMrz([ocr.text, ...ocr.blocks.flatMap((b) => b.lines.map((l) => l.text))].join('\n'));
  const lines = ocr.blocks.flatMap((b) => b.lines);
  // Text outside the photo's size means the OCR saw it rotated: the region would be wrong, so
  // read the whole photo rather than nothing.
  const fits = lines.every(
    ({ frame }) => !frame || (frame.left + frame.width <= region.photoWidth * 1.02 && frame.top + frame.height <= region.photoHeight * 1.02)
  );
  if (!fits) return parseMrz(lines.map((l) => l.text).join('\n'));
  const inside = lines
    .filter(({ frame }) => {
      if (!frame) return false;
      const x = frame.left + frame.width / 2;
      const y = frame.top + frame.height / 2;
      return x >= region.left && x <= region.right && y >= region.top && y <= region.bottom;
    })
    .sort((a, b) => (a.frame?.top ?? 0) - (b.frame?.top ?? 0));
  return parseMrz(inside.map((l) => l.text).join('\n'));
}

/** Everything the guest form needs has been read (both sides for a Kazakhstan ID card). */
export const isComplete = (r: MrzResult) => !missingKzSide(r) && !!r.lastName && !!r.docNumber && !!r.birthDate;

/** Adds a new reading to what was read before; a reading of another document is ignored. */
export const combine = (sofar: MrzResult | null, found: MrzResult) => (sofar ? (mergeMrz(sofar, found) ?? sofar) : found);

// A PDF is rendered page by page on the device; pages of one document (e.g. both sides of an ID
// card) are combined until nothing is missing.
export async function recognizePdf(uri: string) {
  const pages = await PdfThumbnail.generateAllPages(uri, { quality: 100, maxWidth: 2400 });
  let result: MrzResult | null = null;
  for (const page of pages.slice(0, 10)) {
    const found = await recognizeImage(page.uri);
    if (!found) continue;
    result = combine(result, found);
    if (isComplete(result)) break;
  }
  return result;
}

const FIELDS = ['lastName', 'firstName', 'docNumber', 'birthDate', 'gender', 'nationality'] as const;

/**
 * Camera frames are read one after another; a field is trusted only once two frames gave the
 * same value, so a single misread frame never reaches the form. `history` holds recent readings.
 */
export function confirmedByTwoFrames(found: MrzResult, history: MrzResult[]): MrzResult | null {
  const confirmed = { ...found };
  for (const f of FIELDS) {
    if (!history.some((h) => h[f] && h[f] === found[f])) (confirmed as Record<string, string>)[f] = '';
  }
  return FIELDS.some((f) => confirmed[f]) ? confirmed : null;
}
