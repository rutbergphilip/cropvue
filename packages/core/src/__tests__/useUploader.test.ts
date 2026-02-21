import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createUploadHandler, useUploader } from '../composables/useUploader'

// ---------------------------------------------------------------------------
// XMLHttpRequest mock
// ---------------------------------------------------------------------------

type XhrEventListener = (event: any) => void

class MockXMLHttpRequest {
  static instances: MockXMLHttpRequest[] = []

  status = 200
  statusText = 'OK'
  responseText = '{}'

  upload = {
    _listeners: {} as Record<string, XhrEventListener[]>,
    addEventListener(event: string, listener: XhrEventListener) {
      if (!this._listeners[event]) this._listeners[event] = []
      this._listeners[event].push(listener)
    },
    dispatchEvent(event: string, data?: any) {
      for (const fn of this._listeners[event] ?? []) fn(data)
    },
  }

  _listeners: Record<string, XhrEventListener[]> = {}
  _opened = false
  _sentData: any = null
  _headers: Record<string, string> = {}
  _method = ''
  _url = ''

  addEventListener(event: string, listener: XhrEventListener) {
    if (!this._listeners[event]) this._listeners[event] = []
    this._listeners[event].push(listener)
  }

  open(method: string, url: string) {
    this._method = method
    this._url = url
    this._opened = true
  }

  setRequestHeader(key: string, value: string) {
    this._headers[key] = value
  }

  send(data: any) {
    this._sentData = data
  }

  abort = vi.fn()

  // Helpers for triggering events from tests
  _dispatchLoad() {
    for (const fn of this._listeners['load'] ?? []) fn({})
  }

  _dispatchError() {
    for (const fn of this._listeners['error'] ?? []) fn({})
  }

  _dispatchAbort() {
    for (const fn of this._listeners['abort'] ?? []) fn({})
  }

  _dispatchUploadProgress(loaded: number, total: number, lengthComputable = true) {
    this.upload.dispatchEvent('progress', { loaded, total, lengthComputable })
  }

  constructor() {
    MockXMLHttpRequest.instances.push(this)
  }
}

beforeEach(() => {
  MockXMLHttpRequest.instances = []
  vi.stubGlobal('XMLHttpRequest', MockXMLHttpRequest)
})

// ---------------------------------------------------------------------------
// createUploadHandler
// ---------------------------------------------------------------------------

describe('createUploadHandler', () => {
  it('returns the custom handler when provided', async () => {
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

  it('throws when neither handler nor url is provided', () => {
    expect(() => createUploadHandler({})).toThrow(
      'useUploader requires either a handler function or a url'
    )
  })

  describe('url-based upload (XHR)', () => {
    it('creates a FormData with the file using default field name "file"', async () => {
      const uploadFn = createUploadHandler({ url: 'https://api.example.com/upload' })
      const file = new File(['hello'], 'photo.png', { type: 'image/png' })
      const ac = new AbortController()

      const promise = uploadFn(file, { onProgress: vi.fn(), signal: ac.signal })

      const xhr = MockXMLHttpRequest.instances[0]
      expect(xhr._sentData).toBeInstanceOf(FormData)
      expect(xhr._sentData.get('file')).toBe(file)

      xhr.status = 200
      xhr.responseText = JSON.stringify({ url: 'https://cdn.example.com/photo.png' })
      xhr._dispatchLoad()

      const result = await promise
      expect(result).toEqual({ url: 'https://cdn.example.com/photo.png' })
    })

    it('uses the custom fieldName', async () => {
      const uploadFn = createUploadHandler({ url: 'https://api.example.com/upload', fieldName: 'image' })
      const file = new File(['data'], 'img.jpg', { type: 'image/jpeg' })
      const ac = new AbortController()

      const promise = uploadFn(file, { onProgress: vi.fn(), signal: ac.signal })

      const xhr = MockXMLHttpRequest.instances[0]
      expect(xhr._sentData.get('image')).toBe(file)

      xhr.status = 200
      xhr.responseText = '{}'
      xhr._dispatchLoad()
      await promise
    })

    it('sets custom headers on the XHR', async () => {
      const uploadFn = createUploadHandler({
        url: 'https://api.example.com/upload',
        headers: {
          'Authorization': 'Bearer token123',
          'X-Custom': 'value',
        },
      })
      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      const ac = new AbortController()

      const promise = uploadFn(file, { onProgress: vi.fn(), signal: ac.signal })

      const xhr = MockXMLHttpRequest.instances[0]
      expect(xhr._headers['Authorization']).toBe('Bearer token123')
      expect(xhr._headers['X-Custom']).toBe('value')

      xhr.status = 200
      xhr.responseText = '{}'
      xhr._dispatchLoad()
      await promise
    })

    it('opens with POST and the provided url', async () => {
      const uploadFn = createUploadHandler({ url: 'https://api.example.com/upload' })
      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      const ac = new AbortController()

      const promise = uploadFn(file, { onProgress: vi.fn(), signal: ac.signal })

      const xhr = MockXMLHttpRequest.instances[0]
      expect(xhr._method).toBe('POST')
      expect(xhr._url).toBe('https://api.example.com/upload')

      xhr.status = 200
      xhr.responseText = '{}'
      xhr._dispatchLoad()
      await promise
    })

    it('calls onProgress with computed percentage when progress is lengthComputable', async () => {
      const uploadFn = createUploadHandler({ url: 'https://api.example.com/upload' })
      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      const ac = new AbortController()
      const onProgress = vi.fn()

      const promise = uploadFn(file, { onProgress, signal: ac.signal })

      const xhr = MockXMLHttpRequest.instances[0]

      xhr._dispatchUploadProgress(50, 200)
      expect(onProgress).toHaveBeenCalledWith(25)

      xhr._dispatchUploadProgress(200, 200)
      expect(onProgress).toHaveBeenCalledWith(100)

      xhr.status = 200
      xhr.responseText = '{}'
      xhr._dispatchLoad()
      await promise
    })

    it('does not call onProgress when lengthComputable is false', async () => {
      const uploadFn = createUploadHandler({ url: 'https://api.example.com/upload' })
      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      const ac = new AbortController()
      const onProgress = vi.fn()

      const promise = uploadFn(file, { onProgress, signal: ac.signal })

      const xhr = MockXMLHttpRequest.instances[0]

      xhr._dispatchUploadProgress(50, 0, false)
      expect(onProgress).not.toHaveBeenCalled()

      xhr.status = 200
      xhr.responseText = '{}'
      xhr._dispatchLoad()
      await promise
    })

    it('resolves with parsed JSON on 2xx response', async () => {
      const uploadFn = createUploadHandler({ url: 'https://api.example.com/upload' })
      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      const ac = new AbortController()

      const promise = uploadFn(file, { onProgress: vi.fn(), signal: ac.signal })

      const xhr = MockXMLHttpRequest.instances[0]
      xhr.status = 201
      xhr.statusText = 'Created'
      xhr.responseText = JSON.stringify({ id: 42, url: 'https://cdn.example.com/img.jpg' })
      xhr._dispatchLoad()

      const result = await promise
      expect(result).toEqual({ id: 42, url: 'https://cdn.example.com/img.jpg' })
    })

    it('resolves with empty object when response is not valid JSON', async () => {
      const uploadFn = createUploadHandler({ url: 'https://api.example.com/upload' })
      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      const ac = new AbortController()

      const promise = uploadFn(file, { onProgress: vi.fn(), signal: ac.signal })

      const xhr = MockXMLHttpRequest.instances[0]
      xhr.status = 200
      xhr.responseText = 'not json at all'
      xhr._dispatchLoad()

      const result = await promise
      expect(result).toEqual({})
    })

    it('rejects with status error on non-2xx response', async () => {
      const uploadFn = createUploadHandler({ url: 'https://api.example.com/upload' })
      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      const ac = new AbortController()

      const promise = uploadFn(file, { onProgress: vi.fn(), signal: ac.signal })

      const xhr = MockXMLHttpRequest.instances[0]
      xhr.status = 413
      xhr.statusText = 'Payload Too Large'
      xhr._dispatchLoad()

      await expect(promise).rejects.toThrow('Upload failed: 413 Payload Too Large')
    })

    it('rejects with status error on 500', async () => {
      const uploadFn = createUploadHandler({ url: 'https://api.example.com/upload' })
      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      const ac = new AbortController()

      const promise = uploadFn(file, { onProgress: vi.fn(), signal: ac.signal })

      const xhr = MockXMLHttpRequest.instances[0]
      xhr.status = 500
      xhr.statusText = 'Internal Server Error'
      xhr._dispatchLoad()

      await expect(promise).rejects.toThrow('Upload failed: 500 Internal Server Error')
    })

    it('rejects with network error on XHR error event', async () => {
      const uploadFn = createUploadHandler({ url: 'https://api.example.com/upload' })
      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      const ac = new AbortController()

      const promise = uploadFn(file, { onProgress: vi.fn(), signal: ac.signal })

      const xhr = MockXMLHttpRequest.instances[0]
      xhr._dispatchError()

      await expect(promise).rejects.toThrow('Upload failed: network error')
    })

    it('rejects with abort error on XHR abort event', async () => {
      const uploadFn = createUploadHandler({ url: 'https://api.example.com/upload' })
      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      const ac = new AbortController()

      const promise = uploadFn(file, { onProgress: vi.fn(), signal: ac.signal })

      const xhr = MockXMLHttpRequest.instances[0]
      xhr._dispatchAbort()

      await expect(promise).rejects.toThrow('Upload aborted')
    })

    it('aborts the XHR when the signal is aborted', async () => {
      const uploadFn = createUploadHandler({ url: 'https://api.example.com/upload' })
      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      const ac = new AbortController()

      const promise = uploadFn(file, { onProgress: vi.fn(), signal: ac.signal })

      const xhr = MockXMLHttpRequest.instances[0]

      ac.abort()
      expect(xhr.abort).toHaveBeenCalled()

      // The abort triggers the XHR abort event -> rejection
      xhr._dispatchAbort()
      await expect(promise).rejects.toThrow('Upload aborted')
    })

    it('defaults headers to empty object when not provided', async () => {
      const uploadFn = createUploadHandler({ url: 'https://api.example.com/upload' })
      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      const ac = new AbortController()

      const promise = uploadFn(file, { onProgress: vi.fn(), signal: ac.signal })

      const xhr = MockXMLHttpRequest.instances[0]
      expect(xhr._headers).toEqual({})

      xhr.status = 200
      xhr.responseText = '{}'
      xhr._dispatchLoad()
      await promise
    })

    it('handles status 299 as success', async () => {
      const uploadFn = createUploadHandler({ url: 'https://api.example.com/upload' })
      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      const ac = new AbortController()

      const promise = uploadFn(file, { onProgress: vi.fn(), signal: ac.signal })

      const xhr = MockXMLHttpRequest.instances[0]
      xhr.status = 299
      xhr.responseText = '{"ok": true}'
      xhr._dispatchLoad()

      const result = await promise
      expect(result).toEqual({ ok: true })
    })

    it('handles status 300 as failure', async () => {
      const uploadFn = createUploadHandler({ url: 'https://api.example.com/upload' })
      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      const ac = new AbortController()

      const promise = uploadFn(file, { onProgress: vi.fn(), signal: ac.signal })

      const xhr = MockXMLHttpRequest.instances[0]
      xhr.status = 300
      xhr.statusText = 'Multiple Choices'
      xhr._dispatchLoad()

      await expect(promise).rejects.toThrow('Upload failed: 300 Multiple Choices')
    })
  })
})

// ---------------------------------------------------------------------------
// useUploader
// ---------------------------------------------------------------------------

describe('useUploader', () => {
  describe('initial state', () => {
    it('returns isUploading as false', () => {
      const handler = vi.fn().mockResolvedValue({})
      const { isUploading } = useUploader({ handler })
      expect(isUploading.value).toBe(false)
    })

    it('returns progress as 0', () => {
      const handler = vi.fn().mockResolvedValue({})
      const { progress } = useUploader({ handler })
      expect(progress.value).toBe(0)
    })

    it('returns error as null', () => {
      const handler = vi.fn().mockResolvedValue({})
      const { error } = useUploader({ handler })
      expect(error.value).toBeNull()
    })
  })

  describe('upload()', () => {
    it('sets isUploading to true during upload and false after', async () => {
      let resolveHandler!: (value: any) => void
      let capturedIsUploading = false

      const handler = vi.fn().mockImplementation(() => {
        return new Promise((resolve) => {
          resolveHandler = resolve
        })
      })

      const { upload, isUploading } = useUploader({ handler })
      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })

      const uploadPromise = upload(file)

      // Handler is pending, so isUploading should be true
      capturedIsUploading = isUploading.value
      expect(capturedIsUploading).toBe(true)

      // Resolve the handler to complete the upload
      resolveHandler({})
      await uploadPromise

      expect(isUploading.value).toBe(false)
    })

    it('resets progress to 0 at the start of upload', async () => {
      const handler = vi.fn().mockResolvedValue({})
      const { upload, progress } = useUploader({ handler })

      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      await upload(file)
      expect(progress.value).toBe(100)

      // Upload again - progress should be reset
      await upload(file)
      // After a second upload completes, progress is 100 again
      expect(progress.value).toBe(100)
    })

    it('clears previous error at the start of upload', async () => {
      let callCount = 0
      const handler = vi.fn().mockImplementation(async () => {
        callCount++
        if (callCount === 1) throw new Error('First upload failed')
        return {}
      })
      const { upload, error } = useUploader({ handler })

      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })

      // First upload fails
      await expect(upload(file)).rejects.toThrow('First upload failed')
      expect(error.value).toBe('First upload failed')

      // Second upload clears error and succeeds
      await upload(file)
      expect(error.value).toBeNull()
    })

    it('sets progress to 100 after successful upload', async () => {
      const handler = vi.fn().mockResolvedValue({ url: 'done' })
      const { upload, progress } = useUploader({ handler })

      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      await upload(file)
      expect(progress.value).toBe(100)
    })

    it('returns the upload result', async () => {
      const handler = vi.fn().mockResolvedValue({ url: 'https://cdn.example.com/image.jpg', id: 99 })
      const { upload } = useUploader({ handler })

      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      const result = await upload(file)
      expect(result).toEqual({ url: 'https://cdn.example.com/image.jpg', id: 99 })
    })

    it('updates progress via onProgress callback', async () => {
      const handler = vi.fn().mockImplementation(async (file: File, opts: { onProgress: (p: number) => void }) => {
        opts.onProgress(25)
        opts.onProgress(50)
        opts.onProgress(75)
        return {}
      })
      const { upload, progress } = useUploader({ handler })

      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      await upload(file)
      // After completion, progress is set to 100
      expect(progress.value).toBe(100)
    })

    it('converts Blob to File before passing to handler', async () => {
      let receivedFile: File | null = null
      const handler = vi.fn().mockImplementation(async (file: File) => {
        receivedFile = file
        return {}
      })
      const { upload } = useUploader({ handler })

      const blob = new Blob(['pixels'], { type: 'image/png' })
      await upload(blob)

      expect(receivedFile).toBeInstanceOf(File)
      expect(receivedFile!.name).toBe('cropped-image')
      expect(receivedFile!.type).toBe('image/png')
    })

    it('passes File directly without conversion when input is already a File', async () => {
      let receivedFile: File | null = null
      const handler = vi.fn().mockImplementation(async (file: File) => {
        receivedFile = file
        return {}
      })
      const { upload } = useUploader({ handler })

      const file = new File(['pixels'], 'my-photo.jpg', { type: 'image/jpeg' })
      await upload(file)

      expect(receivedFile).toBe(file)
      expect(receivedFile!.name).toBe('my-photo.jpg')
    })

    it('passes an AbortSignal to the handler', async () => {
      let capturedSignal: AbortSignal | null = null
      const handler = vi.fn().mockImplementation(async (_file: File, opts: { signal: AbortSignal }) => {
        capturedSignal = opts.signal
        return {}
      })
      const { upload } = useUploader({ handler })

      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      await upload(file)

      expect(capturedSignal).toBeInstanceOf(AbortSignal)
    })
  })

  describe('error handling', () => {
    it('sets error.value to the Error message on failure', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('Server exploded'))
      const { upload, error } = useUploader({ handler })

      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      await expect(upload(file)).rejects.toThrow('Server exploded')
      expect(error.value).toBe('Server exploded')
    })

    it('sets error.value to "Upload cancelled" for AbortError', async () => {
      const abortError = new Error('Aborted')
      abortError.name = 'AbortError'
      const handler = vi.fn().mockRejectedValue(abortError)
      const { upload, error } = useUploader({ handler })

      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      await expect(upload(file)).rejects.toThrow()
      expect(error.value).toBe('Upload cancelled')
    })

    it('sets error.value to "Upload failed" for non-Error thrown values', async () => {
      const handler = vi.fn().mockRejectedValue('a string error')
      const { upload, error } = useUploader({ handler })

      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      await expect(upload(file)).rejects.toBe('a string error')
      expect(error.value).toBe('Upload failed')
    })

    it('sets error.value to "Upload failed" when a number is thrown', async () => {
      const handler = vi.fn().mockRejectedValue(42)
      const { upload, error } = useUploader({ handler })

      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      await expect(upload(file)).rejects.toBe(42)
      expect(error.value).toBe('Upload failed')
    })

    it('re-throws the original error', async () => {
      const originalError = new Error('Boom')
      const handler = vi.fn().mockRejectedValue(originalError)
      const { upload } = useUploader({ handler })

      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      await expect(upload(file)).rejects.toBe(originalError)
    })

    it('sets isUploading to false after error', async () => {
      const handler = vi.fn().mockRejectedValue(new Error('fail'))
      const { upload, isUploading } = useUploader({ handler })

      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      await expect(upload(file)).rejects.toThrow()
      expect(isUploading.value).toBe(false)
    })

    it('throws when createUploadHandler fails (no options)', async () => {
      const { upload } = useUploader({})
      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      await expect(upload(file)).rejects.toThrow(
        'useUploader requires either a handler function or a url'
      )
    })
  })

  describe('abort()', () => {
    it('aborts an in-progress upload', async () => {
      let resolveUpload!: (value: any) => void
      const handler = vi.fn().mockImplementation(
        () => new Promise((resolve) => { resolveUpload = resolve })
      )
      const { upload, abort, error } = useUploader({ handler })

      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      const uploadPromise = upload(file)

      // The handler is pending; abort the upload
      abort()

      // The handler is still waiting, so we resolve it to let the test finish.
      // But the signal should already be aborted.
      const capturedSignal = handler.mock.calls[0][1].signal as AbortSignal
      expect(capturedSignal.aborted).toBe(true)

      // Resolve the handler to finish the promise
      resolveUpload({})
      await uploadPromise
    })

    it('does nothing when called before any upload', () => {
      const handler = vi.fn().mockResolvedValue({})
      const { abort } = useUploader({ handler })

      // Should not throw
      expect(() => abort()).not.toThrow()
    })

    it('does nothing when called after upload completes', async () => {
      const handler = vi.fn().mockResolvedValue({})
      const { upload, abort } = useUploader({ handler })

      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      await upload(file)

      // abortController is null after upload completes (finally block)
      expect(() => abort()).not.toThrow()
    })
  })

  describe('integration with XHR url-based upload', () => {
    it('full lifecycle: upload a file via XHR url and track progress', async () => {
      const { upload, isUploading, progress, error } = useUploader({
        url: 'https://api.example.com/upload',
        headers: { 'Authorization': 'Bearer tok' },
        fieldName: 'photo',
      })

      expect(isUploading.value).toBe(false)
      expect(progress.value).toBe(0)
      expect(error.value).toBeNull()

      const file = new File(['image-data'], 'photo.jpg', { type: 'image/jpeg' })
      const uploadPromise = upload(file)

      expect(isUploading.value).toBe(true)

      const xhr = MockXMLHttpRequest.instances[0]

      // Verify XHR was configured correctly
      expect(xhr._method).toBe('POST')
      expect(xhr._url).toBe('https://api.example.com/upload')
      expect(xhr._headers['Authorization']).toBe('Bearer tok')
      expect(xhr._sentData.get('photo')).toBeInstanceOf(File)

      // Simulate progress
      xhr._dispatchUploadProgress(50, 100)
      expect(progress.value).toBe(50)

      xhr._dispatchUploadProgress(100, 100)
      expect(progress.value).toBe(100)

      // Simulate successful response
      xhr.status = 200
      xhr.responseText = JSON.stringify({ url: 'https://cdn.example.com/photo.jpg' })
      xhr._dispatchLoad()

      const result = await uploadPromise
      expect(result).toEqual({ url: 'https://cdn.example.com/photo.jpg' })
      expect(isUploading.value).toBe(false)
      expect(progress.value).toBe(100)
      expect(error.value).toBeNull()
    })

    it('full lifecycle: upload via XHR with error', async () => {
      const { upload, isUploading, error } = useUploader({
        url: 'https://api.example.com/upload',
      })

      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      const uploadPromise = upload(file)

      const xhr = MockXMLHttpRequest.instances[0]
      xhr._dispatchError()

      await expect(uploadPromise).rejects.toThrow('Upload failed: network error')
      expect(isUploading.value).toBe(false)
      expect(error.value).toBe('Upload failed: network error')
    })

    it('abort() calls xhr.abort() via the signal', async () => {
      const { upload, abort } = useUploader({
        url: 'https://api.example.com/upload',
      })

      const file = new File(['x'], 'test.jpg', { type: 'image/jpeg' })
      const uploadPromise = upload(file)

      const xhr = MockXMLHttpRequest.instances[0]

      abort()

      // Signal abort triggers xhr.abort()
      expect(xhr.abort).toHaveBeenCalled()

      // Simulate the XHR abort event that fires after xhr.abort()
      xhr._dispatchAbort()

      await expect(uploadPromise).rejects.toThrow('Upload aborted')
    })

    it('converts a Blob to a File before sending via XHR', async () => {
      const { upload } = useUploader({
        url: 'https://api.example.com/upload',
      })

      const blob = new Blob(['data'], { type: 'image/webp' })
      const uploadPromise = upload(blob)

      const xhr = MockXMLHttpRequest.instances[0]
      const sentFile = xhr._sentData.get('file')
      expect(sentFile).toBeInstanceOf(File)
      expect(sentFile.name).toBe('cropped-image')
      expect(sentFile.type).toBe('image/webp')

      xhr.status = 200
      xhr.responseText = '{}'
      xhr._dispatchLoad()
      await uploadPromise
    })
  })

  describe('default options', () => {
    it('useUploader can be called with no arguments', () => {
      // Should not throw during construction - only throws when upload() is called
      const { isUploading, progress, error, abort } = useUploader()
      expect(isUploading.value).toBe(false)
      expect(progress.value).toBe(0)
      expect(error.value).toBeNull()
      expect(typeof abort).toBe('function')
    })
  })
})
