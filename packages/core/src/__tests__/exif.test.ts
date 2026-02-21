import { describe, it, expect } from 'vitest'
import { readExifOrientation, getOrientationTransforms } from '../utils/exif'

// ---------------------------------------------------------------------------
// Helper: build a minimal JPEG/EXIF ArrayBuffer with a given orientation value
// ---------------------------------------------------------------------------

/**
 * Constructs a synthetic JPEG ArrayBuffer that contains an APP1 (EXIF)
 * segment with the orientation tag set to the requested value.
 *
 * The binary layout produced:
 *   [JPEG SOI] [APP1 marker] [segment length]
 *   [Exif\0\0] [TIFF header (byte order + magic + IFD offset)]
 *   [IFD entry count] [IFD entry for orientation tag]
 */
function buildJpegWithExif(
  orientation: number,
  options: { littleEndian?: boolean } = {},
): ArrayBuffer {
  const littleEndian = options.littleEndian ?? false

  // We need enough room for the full structure.  Layout:
  //
  //  Offset  Bytes  Content
  //  ------  -----  -------
  //  0       2      JPEG SOI  (0xFF 0xD8)
  //  2       2      APP1 marker  (0xFF 0xE1)
  //  4       2      APP1 segment length (including these 2 bytes, up to end)
  //  6       4      "Exif"  (0x45 0x78 0x69 0x66)
  //  10      2      0x0000
  //  12      2      Byte-order mark (MM = 0x4D4D, II = 0x4949)   <- tiffStart
  //  14      2      TIFF magic (42 = 0x002A)
  //  16      4      Offset to first IFD from tiffStart (= 8)
  //  20      2      IFD entry count (1)
  //  22      2      Tag  (0x0112 = orientation)
  //  24      2      Type (3 = SHORT)
  //  26      4      Count (1)
  //  30      2      Value (orientation)  -- stored in first 2 bytes of value field
  //  32      2      (padding / remainder of 4-byte value field)
  //  34             end

  const buf = new ArrayBuffer(34)
  const view = new DataView(buf)

  // JPEG SOI
  view.setUint16(0, 0xFFD8)

  // APP1 marker
  view.setUint16(2, 0xFFE1)

  // APP1 segment length (from offset 4 to end = 34 - 4 = 30)
  view.setUint16(4, 30)

  // "Exif" ASCII (0x45786966)
  view.setUint32(6, 0x45786966)
  // Two zero bytes
  view.setUint16(10, 0x0000)

  // ----- TIFF header starts at offset 12 (tiffStart) -----
  const tiffStart = 12

  // Byte order
  if (littleEndian) {
    view.setUint16(tiffStart, 0x4949) // "II"
  } else {
    view.setUint16(tiffStart, 0x4D4D) // "MM"
  }

  // TIFF magic number 42
  view.setUint16(tiffStart + 2, 42, littleEndian)

  // Offset to IFD0 from tiffStart (8 bytes into the TIFF header)
  view.setUint32(tiffStart + 4, 8, littleEndian)

  // ----- IFD0 starts at tiffStart + 8 = offset 20 -----
  const ifdStart = tiffStart + 8 // = 20

  // Number of IFD entries
  view.setUint16(ifdStart, 1, littleEndian)

  // IFD entry (12 bytes)
  const entryOffset = ifdStart + 2 // = 22
  view.setUint16(entryOffset, 0x0112, littleEndian) // tag: Orientation
  view.setUint16(entryOffset + 2, 3, littleEndian)  // type: SHORT
  view.setUint32(entryOffset + 4, 1, littleEndian)  // count: 1
  view.setUint16(entryOffset + 8, orientation, littleEndian) // value

  return buf
}

/**
 * Wraps an ArrayBuffer in a File with JPEG MIME type.
 * Provides the arrayBuffer() method that readExifOrientation calls.
 */
function jpegFileFromBuffer(buffer: ArrayBuffer): File {
  const blob = new Blob([buffer], { type: 'image/jpeg' })
  return new File([blob], 'photo.jpg', { type: 'image/jpeg' })
}

// ---------------------------------------------------------------------------
// getOrientationTransforms
// ---------------------------------------------------------------------------

describe('getOrientationTransforms', () => {
  it('returns no transform for orientation 1 (normal)', () => {
    const transforms = getOrientationTransforms(1)
    expect(transforms.rotate).toBe(0)
    expect(transforms.flip.horizontal).toBe(false)
    expect(transforms.flip.vertical).toBe(false)
  })

  it('returns horizontal flip for orientation 2', () => {
    const transforms = getOrientationTransforms(2)
    expect(transforms.rotate).toBe(0)
    expect(transforms.flip.horizontal).toBe(true)
    expect(transforms.flip.vertical).toBe(false)
  })

  it('returns 180 rotation for orientation 3', () => {
    const transforms = getOrientationTransforms(3)
    expect(transforms.rotate).toBe(180)
    expect(transforms.flip.horizontal).toBe(false)
    expect(transforms.flip.vertical).toBe(false)
  })

  it('returns vertical flip for orientation 4', () => {
    const transforms = getOrientationTransforms(4)
    expect(transforms.rotate).toBe(0)
    expect(transforms.flip.horizontal).toBe(false)
    expect(transforms.flip.vertical).toBe(true)
  })

  it('returns 90 rotation + horizontal flip for orientation 5', () => {
    const transforms = getOrientationTransforms(5)
    expect(transforms.rotate).toBe(90)
    expect(transforms.flip.horizontal).toBe(true)
    expect(transforms.flip.vertical).toBe(false)
  })

  it('returns 90 CW rotation for orientation 6', () => {
    const transforms = getOrientationTransforms(6)
    expect(transforms.rotate).toBe(90)
    expect(transforms.flip.horizontal).toBe(false)
    expect(transforms.flip.vertical).toBe(false)
  })

  it('returns 270 rotation + horizontal flip for orientation 7', () => {
    const transforms = getOrientationTransforms(7)
    expect(transforms.rotate).toBe(270)
    expect(transforms.flip.horizontal).toBe(true)
    expect(transforms.flip.vertical).toBe(false)
  })

  it('returns 270 rotation for orientation 8', () => {
    const transforms = getOrientationTransforms(8)
    expect(transforms.rotate).toBe(270)
    expect(transforms.flip.horizontal).toBe(false)
    expect(transforms.flip.vertical).toBe(false)
  })

  it('returns default (no transform) for unknown orientations', () => {
    for (const val of [0, 9, 10, 99, -1]) {
      const transforms = getOrientationTransforms(val)
      expect(transforms.rotate).toBe(0)
      expect(transforms.flip.horizontal).toBe(false)
      expect(transforms.flip.vertical).toBe(false)
    }
  })
})

// ---------------------------------------------------------------------------
// readExifOrientation
// ---------------------------------------------------------------------------

describe('readExifOrientation', () => {
  // ----- Non-JPEG files -----

  it('returns 1 for a PNG file', async () => {
    const file = new File(['fake'], 'test.png', { type: 'image/png' })
    expect(await readExifOrientation(file)).toBe(1)
  })

  it('returns 1 for a WebP file', async () => {
    const file = new File(['fake'], 'test.webp', { type: 'image/webp' })
    expect(await readExifOrientation(file)).toBe(1)
  })

  it('returns 1 for a file with empty MIME type', async () => {
    const file = new File(['fake'], 'test.bmp', { type: '' })
    expect(await readExifOrientation(file)).toBe(1)
  })

  // ----- Wrong SOI marker -----

  it('returns 1 when JPEG SOI marker is missing', async () => {
    // File has JPEG MIME type but garbage content (no 0xFFD8 at offset 0)
    const buf = new ArrayBuffer(16)
    const view = new DataView(buf)
    view.setUint16(0, 0x0000) // Not SOI
    const file = jpegFileFromBuffer(buf)
    expect(await readExifOrientation(file)).toBe(1)
  })

  // ----- Big-endian EXIF with each orientation value -----

  describe('big-endian (MM) EXIF', () => {
    for (let orient = 1; orient <= 8; orient++) {
      it(`reads orientation ${orient}`, async () => {
        const buf = buildJpegWithExif(orient, { littleEndian: false })
        const file = jpegFileFromBuffer(buf)
        expect(await readExifOrientation(file)).toBe(orient)
      })
    }
  })

  // ----- Little-endian EXIF with each orientation value -----

  describe('little-endian (II) EXIF', () => {
    for (let orient = 1; orient <= 8; orient++) {
      it(`reads orientation ${orient}`, async () => {
        const buf = buildJpegWithExif(orient, { littleEndian: true })
        const file = jpegFileFromBuffer(buf)
        expect(await readExifOrientation(file)).toBe(orient)
      })
    }
  })

  // ----- No APP1 / EXIF segment -----

  it('returns 1 when JPEG has no APP1 segment', async () => {
    // Valid SOI followed by an APP0 (JFIF) segment with no APP1
    const buf = new ArrayBuffer(20)
    const view = new DataView(buf)
    view.setUint16(0, 0xFFD8)  // SOI
    view.setUint16(2, 0xFFE0)  // APP0 marker (JFIF, not APP1)
    view.setUint16(4, 16)      // segment length
    // Remaining bytes are zero; loop will skip this segment then run out
    const file = jpegFileFromBuffer(buf)
    expect(await readExifOrientation(file)).toBe(1)
  })

  // ----- APP1 present but invalid Exif header -----

  it('returns 1 when APP1 has wrong Exif header string', async () => {
    const buf = new ArrayBuffer(34)
    const view = new DataView(buf)
    view.setUint16(0, 0xFFD8)
    view.setUint16(2, 0xFFE1)
    view.setUint16(4, 30)
    // Write "JFIF" instead of "Exif"
    view.setUint32(6, 0x4A464946) // "JFIF"
    view.setUint16(10, 0x0000)
    const file = jpegFileFromBuffer(buf)
    expect(await readExifOrientation(file)).toBe(1)
  })

  it('returns 1 when APP1 has wrong Exif padding bytes', async () => {
    const buf = new ArrayBuffer(34)
    const view = new DataView(buf)
    view.setUint16(0, 0xFFD8)
    view.setUint16(2, 0xFFE1)
    view.setUint16(4, 30)
    view.setUint32(6, 0x45786966) // "Exif" -- correct
    view.setUint16(10, 0x0001)    // should be 0x0000
    const file = jpegFileFromBuffer(buf)
    expect(await readExifOrientation(file)).toBe(1)
  })

  // ----- EXIF without orientation tag -----

  it('returns 1 when EXIF IFD contains no orientation tag', async () => {
    const buf = new ArrayBuffer(34)
    const view = new DataView(buf)

    view.setUint16(0, 0xFFD8)
    view.setUint16(2, 0xFFE1)
    view.setUint16(4, 30)
    view.setUint32(6, 0x45786966) // "Exif"
    view.setUint16(10, 0x0000)

    // TIFF header -- big-endian
    const tiffStart = 12
    view.setUint16(tiffStart, 0x4D4D)       // "MM"
    view.setUint16(tiffStart + 2, 42, false) // TIFF magic
    view.setUint32(tiffStart + 4, 8, false)  // IFD offset

    const ifdStart = tiffStart + 8
    view.setUint16(ifdStart, 1, false)       // 1 entry

    // Write a tag that is NOT orientation (e.g. 0x010E = ImageDescription)
    const entry = ifdStart + 2
    view.setUint16(entry, 0x010E, false)     // wrong tag
    view.setUint16(entry + 2, 3, false)      // SHORT
    view.setUint32(entry + 4, 1, false)      // count
    view.setUint16(entry + 8, 1, false)      // value

    const file = jpegFileFromBuffer(buf)
    expect(await readExifOrientation(file)).toBe(1)
  })

  // ----- Non-0xFF marker breaks the parsing loop -----

  it('returns 1 when a non-0xFF marker is encountered before APP1', async () => {
    const buf = new ArrayBuffer(12)
    const view = new DataView(buf)
    view.setUint16(0, 0xFFD8) // SOI
    view.setUint16(2, 0x0100) // invalid marker (high byte is 0x01, not 0xFF)
    // Loop should break because (0x0100 & 0xFF00) !== 0xFF00
    const file = jpegFileFromBuffer(buf)
    expect(await readExifOrientation(file)).toBe(1)
  })

  // ----- Multiple non-APP1 segments before APP1 -----

  it('skips non-APP1 segments and finds APP1', async () => {
    // SOI + APP0 segment (skip) + APP1 segment (with EXIF orientation 6)
    const buf = new ArrayBuffer(50)
    const view = new DataView(buf)

    // SOI
    view.setUint16(0, 0xFFD8)

    // APP0 segment (to be skipped)
    view.setUint16(2, 0xFFE0)  // APP0 marker
    view.setUint16(4, 4)       // segment length (minimal: just the 2 length bytes + 2 padding)

    // APP1 segment starts at offset 8 (2 SOI + 2 marker + 2 length + 2 skip body = 8)
    // Wait: after SOI (2 bytes), we read marker at offset 2 => 0xFFE0, offset becomes 4.
    // Then we read segLength at offset 4 => 4, offset becomes 4 + 4 = 8.
    // Now at offset 8 we read next marker.
    view.setUint16(8, 0xFFE1) // APP1 marker
    view.setUint16(10, 38)    // segment length (rest of buffer)

    // "Exif\0\0"
    view.setUint32(12, 0x45786966)
    view.setUint16(16, 0x0000)

    // TIFF header at offset 18
    const tiffStart = 18
    view.setUint16(tiffStart, 0x4D4D)       // big-endian
    view.setUint16(tiffStart + 2, 42, false)
    view.setUint32(tiffStart + 4, 8, false)

    const ifdStart = tiffStart + 8 // offset 26
    view.setUint16(ifdStart, 1, false)

    const entry = ifdStart + 2 // offset 28
    view.setUint16(entry, 0x0112, false)
    view.setUint16(entry + 2, 3, false)
    view.setUint32(entry + 4, 1, false)
    view.setUint16(entry + 8, 6, false)      // orientation 6

    const file = jpegFileFromBuffer(buf)
    expect(await readExifOrientation(file)).toBe(6)
  })

  // ----- IFD entry extends beyond buffer boundary -----

  it('returns 1 when IFD entry would read past end of buffer', async () => {
    // Build a minimal EXIF that claims 2 IFD entries but the buffer is too
    // short to hold the second entry.  The first entry is NOT the orientation
    // tag, so the loop continues to the second entry which overflows.
    const buf = new ArrayBuffer(36) // just barely enough for 1 entry, not 2
    const view = new DataView(buf)

    view.setUint16(0, 0xFFD8)
    view.setUint16(2, 0xFFE1)
    view.setUint16(4, 32) // segment length

    view.setUint32(6, 0x45786966)
    view.setUint16(10, 0x0000)

    const tiffStart = 12
    view.setUint16(tiffStart, 0x4D4D)
    view.setUint16(tiffStart + 2, 42, false)
    view.setUint32(tiffStart + 4, 8, false)

    const ifdStart = tiffStart + 8 // offset 20
    view.setUint16(ifdStart, 2, false) // claim 2 entries

    // First entry: NOT orientation
    const entry1 = ifdStart + 2 // offset 22
    view.setUint16(entry1, 0x010E, false)
    view.setUint16(entry1 + 2, 3, false)
    view.setUint32(entry1 + 4, 1, false)
    view.setUint16(entry1 + 8, 0, false)

    // Second entry starts at offset 34 and needs 12 bytes (34 + 12 = 46 > 36)
    // The loop guard (entryOffset + 12 > view.byteLength) should break here

    const file = jpegFileFromBuffer(buf)
    expect(await readExifOrientation(file)).toBe(1)
  })

  // ----- Truncated / corrupt data triggers catch block -----

  it('returns 1 when buffer is too small to even contain SOI check', async () => {
    // Only 1 byte -- getUint16(0) should throw because we need 2 bytes
    const buf = new ArrayBuffer(1)
    const file = jpegFileFromBuffer(buf)
    expect(await readExifOrientation(file)).toBe(1)
  })

  it('returns 1 when buffer is empty', async () => {
    const buf = new ArrayBuffer(0)
    const file = jpegFileFromBuffer(buf)
    expect(await readExifOrientation(file)).toBe(1)
  })

  // ----- JPEG MIME type variations -----

  it('accepts image/jpg MIME type', async () => {
    const buf = buildJpegWithExif(3, { littleEndian: false })
    const blob = new Blob([buf], { type: 'image/jpg' })
    const file = new File([blob], 'photo.jpg', { type: 'image/jpg' })
    expect(await readExifOrientation(file)).toBe(3)
  })

  // ----- Orientation tag is found in second IFD entry -----

  it('finds orientation tag when it is not the first IFD entry', async () => {
    // Two IFD entries: first is ImageDescription, second is Orientation
    const buf = new ArrayBuffer(46)
    const view = new DataView(buf)

    view.setUint16(0, 0xFFD8)
    view.setUint16(2, 0xFFE1)
    view.setUint16(4, 42) // segment length

    view.setUint32(6, 0x45786966) // "Exif"
    view.setUint16(10, 0x0000)

    const tiffStart = 12
    view.setUint16(tiffStart, 0x4949)         // little-endian
    view.setUint16(tiffStart + 2, 42, true)   // TIFF magic
    view.setUint32(tiffStart + 4, 8, true)    // IFD offset

    const ifdStart = tiffStart + 8 // offset 20
    view.setUint16(ifdStart, 2, true)         // 2 entries

    // Entry 1: ImageDescription (0x010E)
    const entry1 = ifdStart + 2 // offset 22
    view.setUint16(entry1, 0x010E, true)
    view.setUint16(entry1 + 2, 3, true)
    view.setUint32(entry1 + 4, 1, true)
    view.setUint16(entry1 + 8, 0, true)

    // Entry 2: Orientation (0x0112)
    const entry2 = entry1 + 12 // offset 34
    view.setUint16(entry2, 0x0112, true)
    view.setUint16(entry2 + 2, 3, true)
    view.setUint32(entry2 + 4, 1, true)
    view.setUint16(entry2 + 8, 5, true) // orientation 5

    const file = jpegFileFromBuffer(buf)
    expect(await readExifOrientation(file)).toBe(5)
  })

  // ----- While-loop exits when offset exceeds buffer -----

  it('returns 1 when JPEG segments exhaust the buffer without APP1', async () => {
    // Two small non-APP1 segments followed by end-of-buffer
    const buf = new ArrayBuffer(14)
    const view = new DataView(buf)

    view.setUint16(0, 0xFFD8)  // SOI

    // First segment: some marker 0xFFDB (DQT)
    view.setUint16(2, 0xFFDB)
    view.setUint16(4, 4) // segment length = 4

    // Second segment: 0xFFC0 (SOF0)
    view.setUint16(8, 0xFFC0)
    view.setUint16(10, 4) // segment length = 4
    // After this, offset = 10 + 4 = 14 which equals byteLength, loop exits

    const file = jpegFileFromBuffer(buf)
    expect(await readExifOrientation(file)).toBe(1)
  })
})
