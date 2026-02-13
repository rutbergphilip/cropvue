import { ref } from 'vue'
import type { UploaderOptions, UploadResult, UploadFn } from '../types'

export function createUploadHandler(
  options: UploaderOptions
): UploadFn {
  if (options.handler) {
    return options.handler
  }

  if (options.url) {
    const url = options.url
    const fieldName = options.fieldName ?? 'file'
    const headers = options.headers ?? {}

    return async (file, { onProgress, signal }) => {
      const formData = new FormData()
      formData.append(fieldName, file)

      const xhr = new XMLHttpRequest()

      return new Promise<UploadResult>((resolve, reject) => {
        xhr.upload.addEventListener('progress', (e) => {
          if (e.lengthComputable) {
            onProgress(Math.round((e.loaded / e.total) * 100))
          }
        })

        xhr.addEventListener('load', () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              resolve(JSON.parse(xhr.responseText))
            } catch {
              resolve({})
            }
          } else {
            reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`))
          }
        })

        xhr.addEventListener('error', () => reject(new Error('Upload failed: network error')))
        xhr.addEventListener('abort', () => reject(new Error('Upload aborted')))

        signal.addEventListener('abort', () => xhr.abort())

        xhr.open('POST', url)
        for (const [key, value] of Object.entries(headers)) {
          xhr.setRequestHeader(key, value)
        }
        xhr.send(formData)
      })
    }
  }

  throw new Error('useUploader requires either a handler function or a url')
}

export function useUploader(options: UploaderOptions = {}) {
  const isUploading = ref(false)
  const progress = ref(0)
  const error = ref<string | null>(null)

  let abortController: AbortController | null = null

  async function upload(file: File | Blob): Promise<UploadResult> {
    const handler = createUploadHandler(options)
    isUploading.value = true
    progress.value = 0
    error.value = null
    abortController = new AbortController()

    const uploadFile = file instanceof File ? file : new File([file], 'cropped-image', { type: file.type })

    try {
      const result = await handler(uploadFile, {
        onProgress: (p) => { progress.value = p },
        signal: abortController.signal,
      })
      progress.value = 100
      return result
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'Upload failed'
      throw e
    } finally {
      isUploading.value = false
      abortController = null
    }
  }

  function abort() {
    abortController?.abort()
  }

  return { upload, isUploading, progress, error, abort }
}
