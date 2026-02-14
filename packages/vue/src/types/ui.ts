export interface CropVueUI {
  root?: string
  dropzone?: string
  dropzoneActive?: string
  actions?: string
  cancelButton?: string
  confirmButton?: string
  done?: string
  resultImage?: string
}

export interface CropEditorUI {
  root?: string
  viewport?: string
  image?: string
  overlay?: string
  cropArea?: string
  grid?: string
  gridLine?: string
  handle?: string
}

export interface CropToolbarUI {
  root?: string
  default?: string
  button?: string
  separator?: string
}

export interface CropDropzoneUI {
  root?: string
  default?: string
}

export interface CropPreviewUI {
  root?: string
  canvas?: string
}

export interface CropQueueUI {
  root?: string
  list?: string
  item?: string
  itemActive?: string
  thumbnail?: string
  removeButton?: string
  checkIcon?: string
}

export interface CropStencilUI {
  root?: string
  shape?: string
}

export interface CropVueTheme {
  CropVue?: CropVueUI
  CropEditor?: CropEditorUI
  CropToolbar?: CropToolbarUI
  CropDropzone?: CropDropzoneUI
  CropPreview?: CropPreviewUI
  CropQueue?: CropQueueUI
  CropStencil?: CropStencilUI
}
