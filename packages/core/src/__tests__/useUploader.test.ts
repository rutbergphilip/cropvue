import { describe, it, expect, vi } from 'vitest'
import { createUploadHandler } from '../composables/useUploader'

describe('createUploadHandler', () => {
  it('calls custom handler when provided', async () => {
    const handler = vi.fn().mockResolvedValue({ url: 'https://example.com/img.jpg' })
    const upload = createUploadHandler({ handler })

    const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
    const result = await upload(file, {
      onProgress: vi.fn(),
      signal: new AbortController().signal,
    })

    expect(handler).toHaveBeenCalledWith(file, expect.objectContaining({ signal: expect.any(AbortSignal) }))
    expect(result.url).toBe('https://example.com/img.jpg')
  })

  it('throws when no handler or url is provided', () => {
    expect(() => createUploadHandler({})).toThrow()
  })
})
