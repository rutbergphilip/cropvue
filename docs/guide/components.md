# Components

All components are exported from `cropvue` and auto-imported in Nuxt.

## CropVue

The main orchestrator component. Manages the full flow: dropzone, editor, and result.

```vue
<CropVue
  stencil="rectangle"
  :aspect-ratio="16 / 9"
  :output-quality="0.85"
  @done="handleDone"
  @error="handleError"
/>
```

### Slots

| Slot | Scoped Props | Purpose |
|------|-------------|---------|
| `#dropzone` | `{ open, isDragging }` | File selection area |
| `#editor` | `{ image, transform, crop, rotateLeft, ... }` | Crop editor |
| `#toolbar` | `{ rotateLeft, rotateRight, flipX, flipY, zoomIn, zoomOut, reset }` | Controls |
| `#preview` | `{ image, transform, crop }` | Live preview |
| `#actions` | `{ confirm, cancel, isUploading, progress }` | Action buttons |
| `#done` | `{ result, restart }` | Result display |
| `#error` | - | Error display |
| `#loading` | `{ progress }` | Loading state |

## CropEditor

Interactive editing area with CSS transforms. Shows the image, overlay, crop area, grid lines, and resize handles.

```vue
<CropEditor
  :image="cropper.image.value"
  :transform="cropper.transform.value"
  :crop="cropper.crop.value"
/>
```

### Slots

| Slot | Props | Purpose |
|------|-------|---------|
| `#image` | `{ style, image, transform }` | Custom image rendering |
| `#overlay` | `{ crop, clipPath }` | Dark overlay |
| `#crop-area` | `{ crop, style }` | Crop selection area |
| `#grid` | `{ crop }` | Rule-of-thirds grid |
| `#handles` | `{ crop }` | Resize handles |

## CropPreview

Real-time canvas preview using the same `renderCrop` function as final export.

```vue
<CropPreview
  :image="cropper.image.value"
  :transform="cropper.transform.value"
  :crop="cropper.crop.value"
  :max-width="300"
  :debounce="50"
/>
```

## CropDropzone

File drop area with drag-and-drop support.

```vue
<CropDropzone
  :accept="['image/*']"
  :max-size="10_000_000"
  @files="handleFiles"
  @error="handleError"
>
  <template #default="{ open, isDragging }">
    <div @click="open">
      {{ isDragging ? 'Drop here!' : 'Click or drag' }}
    </div>
  </template>
</CropDropzone>
```

## CropToolbar

Rotate, flip, and zoom controls. Fully replaceable via the default slot.

```vue
<CropToolbar
  :transform="cropper.transform.value"
  @rotate-left="cropper.rotateLeft"
  @rotate-right="cropper.rotateRight"
  @flip-x="cropper.flipX"
  @flip-y="cropper.flipY"
  @zoom-in="() => cropper.zoomBy(0.1)"
  @zoom-out="() => cropper.zoomBy(-0.1)"
  @reset="cropper.reset"
/>
```

## CropQueue

Multi-image queue display for batch cropping.

```vue
<CropQueue @select="handleSelect" @remove="handleRemove">
  <template #default="{ items, currentIndex, select, remove }">
    <div v-for="(item, i) in items" :key="item.id" @click="select(i)">
      <img :src="item.thumbnail" />
    </div>
  </template>
</CropQueue>
```

## CropStencil

Crop shape overlay using CSS clip-path. Supports rectangle, circle, and freeform polygons.

```vue
<CropStencil
  :crop="cropper.crop.value"
  :container-width="800"
  :container-height="600"
/>
```
