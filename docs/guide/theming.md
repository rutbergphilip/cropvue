# Theming

CropVue uses CSS custom properties for theming. Override any variable to customize the appearance.

## Import Default Styles

```ts
import 'cropvue/styles'
```

## CSS Variables

### Overlay

```css
:root {
  --cropvue-overlay-color: rgba(0, 0, 0, 0.5);
  --cropvue-overlay-transition: 150ms ease;
}
```

### Crop Area

```css
:root {
  --cropvue-crop-border-color: #fff;
  --cropvue-crop-border-width: 2px;
  --cropvue-crop-border-style: solid;
}
```

### Grid

```css
:root {
  --cropvue-grid-color: rgba(255, 255, 255, 0.3);
  --cropvue-grid-width: 1px;
  --cropvue-grid-display: block; /* set to 'none' to hide */
}
```

### Handles

```css
:root {
  --cropvue-handle-color: #fff;
  --cropvue-handle-size: 10px;
  --cropvue-handle-border-radius: 50%;
}
```

### Dropzone

```css
:root {
  --cropvue-dropzone-border-color: #d1d5db;
  --cropvue-dropzone-border-color-active: #3b82f6;
  --cropvue-dropzone-bg: transparent;
  --cropvue-dropzone-bg-active: rgba(59, 130, 246, 0.05);
  --cropvue-dropzone-border-style: dashed;
  --cropvue-dropzone-border-radius: 8px;
}
```

### Toolbar

```css
:root {
  --cropvue-toolbar-bg: #fff;
  --cropvue-toolbar-border-radius: 8px;
  --cropvue-toolbar-border-color: #e5e7eb;
  --cropvue-toolbar-btn-color: #374151;
  --cropvue-toolbar-btn-hover-bg: #f3f4f6;
  --cropvue-toolbar-btn-radius: 6px;
}
```

### Queue

```css
:root {
  --cropvue-queue-thumb-size: 64px;
  --cropvue-queue-thumb-radius: 6px;
  --cropvue-queue-active-border: #3b82f6;
  --cropvue-queue-check-bg: #22c55e;
}
```

### Buttons

```css
:root {
  --cropvue-btn-bg: #fff;
  --cropvue-btn-color: #374151;
  --cropvue-btn-radius: 6px;
  --cropvue-btn-confirm-bg: #3b82f6;
  --cropvue-btn-confirm-color: #fff;
}
```

## Dark Mode Example

```css
.dark {
  --cropvue-editor-bg: #0a0a0a;
  --cropvue-overlay-color: rgba(0, 0, 0, 0.7);
  --cropvue-toolbar-bg: #1f2937;
  --cropvue-toolbar-border-color: #374151;
  --cropvue-toolbar-btn-color: #d1d5db;
  --cropvue-toolbar-btn-hover-bg: #374151;
  --cropvue-dropzone-border-color: #4b5563;
  --cropvue-btn-bg: #1f2937;
  --cropvue-btn-color: #d1d5db;
  --cropvue-btn-border-color: #374151;
}
```

## Scoped Slots

For maximum control, skip CSS variables entirely and use scoped slots to render your own UI:

```vue
<CropVue @done="handleDone">
  <template #toolbar="{ rotateLeft, rotateRight, zoomIn, zoomOut }">
    <!-- Your completely custom toolbar -->
    <MyCustomToolbar
      @rotate-left="rotateLeft"
      @rotate-right="rotateRight"
    />
  </template>
</CropVue>
```
