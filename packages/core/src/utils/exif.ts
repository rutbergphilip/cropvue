import type { ImageTransforms } from '../types'

/**
 * Read EXIF orientation tag from a JPEG file.
 * Returns 1 (normal) for non-JPEG or files without EXIF data.
 */
export async function readExifOrientation(file: File): Promise<number> {
  if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
    return 1
  }

  try {
    const buffer = await file.slice(0, 65536).arrayBuffer()
    const view = new DataView(buffer)

    if (view.getUint16(0) !== 0xFFD8) return 1

    let offset = 2
    while (offset < view.byteLength - 2) {
      const marker = view.getUint16(offset)
      offset += 2

      if (marker === 0xFFE1) {
        const length = view.getUint16(offset)
        offset += 2

        if (view.getUint32(offset) !== 0x45786966 || view.getUint16(offset + 4) !== 0x0000) {
          return 1
        }
        offset += 6

        const tiffStart = offset
        const isLittleEndian = view.getUint16(tiffStart) === 0x4949

        const ifdOffset = view.getUint32(tiffStart + 4, isLittleEndian)
        const numEntries = view.getUint16(tiffStart + ifdOffset, isLittleEndian)

        for (let i = 0; i < numEntries; i++) {
          const entryOffset = tiffStart + ifdOffset + 2 + i * 12
          if (entryOffset + 12 > view.byteLength) break
          const tag = view.getUint16(entryOffset, isLittleEndian)
          if (tag === 0x0112) {
            return view.getUint16(entryOffset + 8, isLittleEndian)
          }
        }
        return 1
      }

      if ((marker & 0xFF00) !== 0xFF00) break

      const segLength = view.getUint16(offset)
      offset += segLength
    }

    return 1
  } catch {
    return 1
  }
}

/**
 * Convert EXIF orientation (1-8) to rotation/flip transforms.
 */
export function getOrientationTransforms(orientation: number): ImageTransforms {
  switch (orientation) {
    case 2: return { rotate: 0, flip: { horizontal: true, vertical: false } }
    case 3: return { rotate: 180, flip: { horizontal: false, vertical: false } }
    case 4: return { rotate: 0, flip: { horizontal: false, vertical: true } }
    case 5: return { rotate: 90, flip: { horizontal: true, vertical: false } }
    case 6: return { rotate: 90, flip: { horizontal: false, vertical: false } }
    case 7: return { rotate: 270, flip: { horizontal: true, vertical: false } }
    case 8: return { rotate: 270, flip: { horizontal: false, vertical: false } }
    default: return { rotate: 0, flip: { horizontal: false, vertical: false } }
  }
}
