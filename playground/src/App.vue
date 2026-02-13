<script setup lang="ts">
import { ref, reactive, watch, computed } from 'vue'
import {
  CropVue,
  CropEditor,
  CropPreview,
  CropDropzone,
  CropToolbar,
  CropQueue,
  CropStencil,
} from 'cropvue'
import { useCropper, useDropzone, useImageQueue, useCompressor } from '@cropvue/core'
import type { CropResult, CropVueError, StencilType, OutputFormat, TransformState } from '@cropvue/core'
import 'cropvue/styles'

// ============================================================
// SECTION 1: Simple CropVue (default rendering)
// ============================================================
const simpleResult = ref<CropResult | null>(null)
const simpleError = ref<string | null>(null)

function handleSimpleDone(result: CropResult) {
  simpleResult.value = result
  simpleError.value = null
}
function handleSimpleError(error: CropVueError) {
  simpleError.value = error.message
}

// ============================================================
// SECTION 2: Circle Stencil with Aspect Ratio Lock
// ============================================================
const circleResult = ref<CropResult | null>(null)

function handleCircleDone(result: CropResult) {
  circleResult.value = result
}

// ============================================================
// SECTION 3: Custom Styled CropVue (scoped slots)
// ============================================================
const customResult = ref<CropResult | null>(null)

function handleCustomDone(result: CropResult) {
  customResult.value = result
}

// ============================================================
// SECTION 4: Dynamic Stencil & Aspect Ratio Switching
// ============================================================
const dynamicStencil = ref<StencilType>('rectangle')
const dynamicAspectRatio = ref<number | null>(null)
const dynamicFormat = ref<OutputFormat>('auto')
const dynamicQuality = ref(0.85)
const dynamicResult = ref<CropResult | null>(null)
const dynamicCropRef = ref<InstanceType<typeof CropVue> | null>(null)

const aspectRatioPresets = [
  { label: 'Free', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '3:2', value: 3 / 2 },
  { label: '2:3', value: 2 / 3 },
]

function handleDynamicDone(result: CropResult) {
  dynamicResult.value = result
}

// ============================================================
// SECTION 5: Composable-Only Usage (useCropper)
// ============================================================
const composableCropper = useCropper({
  stencil: 'rectangle',
  outputQuality: 0.85,
})
const composableResult = ref<CropResult | null>(null)
const composableStatus = ref('')

async function onComposableFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) {
    composableStatus.value = 'Loading...'
    await composableCropper.loadFile(input.files[0])
    composableStatus.value = 'Ready - use controls to manipulate'
  }
}

async function getComposableResult() {
  composableStatus.value = 'Processing...'
  const result = await composableCropper.getResult({ format: 'webp', quality: 0.8 })
  composableResult.value = result
  composableStatus.value = `Done: ${result.width}x${result.height}, ${(result.blob.size / 1024).toFixed(1)} KB`
}

// ============================================================
// SECTION 6: Standalone CropDropzone
// ============================================================
const dropzoneFiles = ref<File[]>([])
const dropzoneErrors = ref<string[]>([])

function onDropzoneFiles(files: File[]) {
  dropzoneFiles.value.push(...files)
}
function onDropzoneError(error: CropVueError) {
  dropzoneErrors.value.push(error.message)
}

// ============================================================
// SECTION 7: Standalone CropToolbar
// ============================================================
const toolbarTransform = ref<TransformState>({
  x: 0,
  y: 0,
  scale: 1,
  rotation: 0,
  flipX: false,
  flipY: false,
})
const toolbarLog = ref<string[]>([])

function logToolbarAction(action: string) {
  toolbarLog.value.unshift(action)
  if (toolbarLog.value.length > 10) toolbarLog.value.pop()
}

// ============================================================
// SECTION 8: CropVue with Output Format Options
// ============================================================
const formatResult = ref<CropResult | null>(null)
const selectedFormat = ref<OutputFormat>('webp')
const selectedQuality = ref(0.85)

function handleFormatDone(result: CropResult) {
  formatResult.value = result
}

// ============================================================
// SECTION 9: CropVue with Max File Size Validation
// ============================================================
const validationError = ref<string | null>(null)

function handleValidationError(error: CropVueError) {
  validationError.value = `${error.type}: ${error.message}`
}

// ============================================================
// SECTION 10: CropVue with Custom Output Dimensions
// ============================================================
const dimensionResult = ref<CropResult | null>(null)
const outputMaxWidth = ref(200)
const outputMaxHeight = ref(200)

function handleDimensionDone(result: CropResult) {
  dimensionResult.value = result
}

// ============================================================
// SECTION 11: Theme Override Demo (CSS Custom Properties)
// ============================================================
const themeResult = ref<CropResult | null>(null)
const activeTheme = ref<'default' | 'dark' | 'purple' | 'warm'>('default')

const themes = {
  default: {},
  dark: {
    '--cropvue-editor-bg': '#0a0a0a',
    '--cropvue-overlay-color': 'rgba(0, 0, 0, 0.7)',
    '--cropvue-crop-border-color': '#22d3ee',
    '--cropvue-grid-color': 'rgba(34, 211, 238, 0.3)',
    '--cropvue-handle-color': '#22d3ee',
    '--cropvue-toolbar-bg': '#1e293b',
    '--cropvue-toolbar-border-color': '#334155',
    '--cropvue-toolbar-btn-color': '#94a3b8',
    '--cropvue-toolbar-btn-hover-bg': '#334155',
    '--cropvue-btn-bg': '#1e293b',
    '--cropvue-btn-color': '#e2e8f0',
    '--cropvue-btn-border-color': '#334155',
    '--cropvue-btn-hover-bg': '#334155',
    '--cropvue-btn-confirm-bg': '#0891b2',
    '--cropvue-btn-confirm-border': '#0891b2',
    '--cropvue-btn-confirm-hover-bg': '#0e7490',
    '--cropvue-dropzone-border-color': '#334155',
    '--cropvue-dropzone-border-color-active': '#22d3ee',
    '--cropvue-dropzone-bg-active': 'rgba(34, 211, 238, 0.05)',
  },
  purple: {
    '--cropvue-editor-bg': '#1e1030',
    '--cropvue-overlay-color': 'rgba(30, 16, 48, 0.6)',
    '--cropvue-crop-border-color': '#a855f7',
    '--cropvue-grid-color': 'rgba(168, 85, 247, 0.3)',
    '--cropvue-handle-color': '#a855f7',
    '--cropvue-handle-border-radius': '2px',
    '--cropvue-toolbar-bg': '#2e1065',
    '--cropvue-toolbar-border-color': '#4c1d95',
    '--cropvue-toolbar-btn-color': '#c4b5fd',
    '--cropvue-toolbar-btn-hover-bg': '#4c1d95',
    '--cropvue-btn-bg': '#2e1065',
    '--cropvue-btn-color': '#e9d5ff',
    '--cropvue-btn-border-color': '#4c1d95',
    '--cropvue-btn-hover-bg': '#4c1d95',
    '--cropvue-btn-confirm-bg': '#9333ea',
    '--cropvue-btn-confirm-border': '#9333ea',
    '--cropvue-btn-confirm-hover-bg': '#7e22ce',
    '--cropvue-dropzone-border-color': '#4c1d95',
    '--cropvue-dropzone-border-color-active': '#a855f7',
    '--cropvue-dropzone-bg': 'rgba(30, 16, 48, 0.3)',
    '--cropvue-dropzone-bg-active': 'rgba(168, 85, 247, 0.1)',
  },
  warm: {
    '--cropvue-editor-bg': '#1c1917',
    '--cropvue-overlay-color': 'rgba(28, 25, 23, 0.6)',
    '--cropvue-crop-border-color': '#f59e0b',
    '--cropvue-grid-color': 'rgba(245, 158, 11, 0.3)',
    '--cropvue-handle-color': '#f59e0b',
    '--cropvue-handle-size': '14px',
    '--cropvue-handle-border-radius': '3px',
    '--cropvue-toolbar-bg': '#292524',
    '--cropvue-toolbar-border-color': '#44403c',
    '--cropvue-toolbar-btn-color': '#d6d3d1',
    '--cropvue-toolbar-btn-hover-bg': '#44403c',
    '--cropvue-btn-bg': '#292524',
    '--cropvue-btn-color': '#fafaf9',
    '--cropvue-btn-border-color': '#44403c',
    '--cropvue-btn-hover-bg': '#44403c',
    '--cropvue-btn-confirm-bg': '#d97706',
    '--cropvue-btn-confirm-border': '#d97706',
    '--cropvue-btn-confirm-hover-bg': '#b45309',
    '--cropvue-dropzone-border-color': '#44403c',
    '--cropvue-dropzone-border-color-active': '#f59e0b',
    '--cropvue-dropzone-bg-active': 'rgba(245, 158, 11, 0.05)',
  },
}

const themeStyle = computed(() => themes[activeTheme.value])

// ============================================================
// SECTION 12: Load Image from URL
// ============================================================
const urlInput = ref('https://picsum.photos/800/600')
const urlResult = ref<CropResult | null>(null)

function handleUrlDone(result: CropResult) {
  urlResult.value = result
}

// ============================================================
// Navigation
// ============================================================
const sections = [
  { id: 'simple', label: '1. Default CropVue' },
  { id: 'circle', label: '2. Circle Stencil' },
  { id: 'custom', label: '3. Custom Slots' },
  { id: 'dynamic', label: '4. Dynamic Settings' },
  { id: 'composable', label: '5. Composable API' },
  { id: 'dropzone', label: '6. Standalone Dropzone' },
  { id: 'toolbar', label: '7. Standalone Toolbar' },
  { id: 'format', label: '8. Output Formats' },
  { id: 'validation', label: '9. File Validation' },
  { id: 'dimensions', label: '10. Output Dimensions' },
  { id: 'theming', label: '11. Theming' },
  { id: 'url', label: '12. Load from URL' },
]
</script>

<template>
  <div class="playground">
    <header class="header">
      <h1>CropVue Playground</h1>
      <p class="subtitle">Comprehensive test cases for all features</p>
    </header>

    <nav class="nav">
      <a
        v-for="section in sections"
        :key="section.id"
        :href="`#${section.id}`"
        class="nav-link"
      >
        {{ section.label }}
      </a>
    </nav>

    <!-- ===== 1. Default CropVue ===== -->
    <section :id="'simple'" class="section">
      <h2>1. Default CropVue (Rectangle, Free Aspect)</h2>
      <p class="description">Basic usage with default rendering. Rectangle stencil, free aspect ratio, auto format.</p>

      <CropVue
        stencil="rectangle"
        :aspect-ratio="null"
        :output-quality="0.85"
        @done="handleSimpleDone"
        @error="handleSimpleError"
      >
        <template #done="{ result, restart }">
          <div class="result-card">
            <h3>Result</h3>
            <img v-if="result" :src="result.url" alt="Result" class="result-image" />
            <div v-if="result" class="result-meta">
              <span>{{ result.width }}x{{ result.height }}</span>
              <span>{{ result.blob.type }}</span>
              <span>{{ (result.blob.size / 1024).toFixed(1) }} KB</span>
            </div>
            <button class="btn btn--primary" @click="restart">Crop Another</button>
          </div>
        </template>
      </CropVue>

      <div v-if="simpleError" class="error-box">{{ simpleError }}</div>
    </section>

    <!-- ===== 2. Circle Stencil ===== -->
    <section :id="'circle'" class="section">
      <h2>2. Circle Stencil (1:1 Locked)</h2>
      <p class="description">Circle stencil with locked 1:1 aspect ratio. Ideal for avatar/profile picture cropping.</p>

      <CropVue
        stencil="circle"
        :aspect-ratio="1"
        output-format="webp"
        :output-quality="0.9"
        @done="handleCircleDone"
      >
        <template #dropzone="{ open, isDragging }">
          <div
            class="avatar-dropzone"
            :class="{ 'avatar-dropzone--active': isDragging }"
            @click="open"
          >
            <div class="avatar-placeholder">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
                <circle cx="12" cy="8" r="4" />
                <path d="M20 21a8 8 0 0 0-16 0" />
              </svg>
              <p>Upload profile picture</p>
            </div>
          </div>
        </template>

        <template #done="{ result, restart }">
          <div class="result-card result-card--center">
            <div v-if="result" class="avatar-result">
              <img :src="result.url" alt="Avatar" class="avatar-image" />
            </div>
            <div v-if="result" class="result-meta">
              <span>{{ result.width }}x{{ result.height }}</span>
              <span>{{ result.blob.type }}</span>
              <span>{{ (result.blob.size / 1024).toFixed(1) }} KB</span>
            </div>
            <button class="btn btn--primary" @click="restart">Choose Different Photo</button>
          </div>
        </template>
      </CropVue>
    </section>

    <!-- ===== 3. Custom Slots ===== -->
    <section :id="'custom'" class="section">
      <h2>3. Fully Custom Slots</h2>
      <p class="description">Complete UI customization via scoped slots: custom dropzone, toolbar, actions, and done state.</p>

      <CropVue
        stencil="rectangle"
        :aspect-ratio="16 / 9"
        output-format="jpeg"
        :output-quality="0.8"
        @done="handleCustomDone"
      >
        <template #dropzone="{ open, isDragging }">
          <div
            class="custom-drop"
            :class="{ 'custom-drop--active': isDragging }"
            @click="open"
          >
            <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" stroke-width="1.5">
              <path d="M12 16V4M12 4l4 4M12 4l-4 4" />
              <path d="M2 17l.621 2.485A2 2 0 0 0 4.561 21h14.878a2 2 0 0 0 1.94-1.515L22 17" />
            </svg>
            <p class="custom-drop__title">{{ isDragging ? 'Release to upload!' : 'Drag & drop your image' }}</p>
            <p class="custom-drop__subtitle">or click to browse (16:9 crop)</p>
          </div>
        </template>

        <template #toolbar="{ rotateLeft, rotateRight, flipX, flipY, zoomIn, zoomOut, reset }">
          <div class="custom-toolbar">
            <button class="custom-toolbar__btn" @click="rotateLeft" title="Rotate CCW">&#x21BA;</button>
            <button class="custom-toolbar__btn" @click="rotateRight" title="Rotate CW">&#x21BB;</button>
            <span class="custom-toolbar__divider">|</span>
            <button class="custom-toolbar__btn" @click="flipX" title="Flip H">&#x21C4;</button>
            <button class="custom-toolbar__btn" @click="flipY" title="Flip V">&#x21C5;</button>
            <span class="custom-toolbar__divider">|</span>
            <button class="custom-toolbar__btn" @click="zoomOut" title="Zoom Out">&#x2212;</button>
            <button class="custom-toolbar__btn" @click="zoomIn" title="Zoom In">&#x002B;</button>
            <span class="custom-toolbar__divider">|</span>
            <button class="custom-toolbar__btn custom-toolbar__btn--reset" @click="reset" title="Reset">Reset</button>
          </div>
        </template>

        <template #actions="{ confirm, cancel }">
          <div class="custom-actions">
            <button class="btn btn--ghost" @click="cancel">Discard</button>
            <button class="btn btn--primary" @click="confirm">Save Crop (16:9, JPEG)</button>
          </div>
        </template>

        <template #done="{ result, restart }">
          <div class="result-card">
            <h3>Custom Result View</h3>
            <img v-if="result" :src="result.url" alt="Result" class="result-image" />
            <table v-if="result" class="result-table">
              <tr><td>Dimensions</td><td>{{ result.width }} x {{ result.height }}</td></tr>
              <tr><td>Format</td><td>{{ result.blob.type }}</td></tr>
              <tr><td>Size</td><td>{{ (result.blob.size / 1024).toFixed(1) }} KB</td></tr>
              <tr><td>Original</td><td>{{ result.originalWidth }} x {{ result.originalHeight }}</td></tr>
            </table>
            <button class="btn btn--primary" @click="restart">Start Over</button>
          </div>
        </template>
      </CropVue>
    </section>

    <!-- ===== 4. Dynamic Stencil & Aspect Ratio ===== -->
    <section :id="'dynamic'" class="section">
      <h2>4. Dynamic Stencil & Settings</h2>
      <p class="description">Change stencil type, aspect ratio, output format, and quality in real-time.</p>

      <div class="controls-panel">
        <div class="control-group">
          <label>Stencil:</label>
          <div class="btn-group">
            <button
              v-for="s in ['rectangle', 'circle'] as StencilType[]"
              :key="s"
              class="btn btn--sm"
              :class="{ 'btn--active': dynamicStencil === s }"
              @click="dynamicStencil = s"
            >{{ s }}</button>
          </div>
        </div>

        <div class="control-group">
          <label>Aspect Ratio:</label>
          <div class="btn-group">
            <button
              v-for="preset in aspectRatioPresets"
              :key="preset.label"
              class="btn btn--sm"
              :class="{ 'btn--active': dynamicAspectRatio === preset.value }"
              @click="dynamicAspectRatio = preset.value"
            >{{ preset.label }}</button>
          </div>
        </div>

        <div class="control-group">
          <label>Format:</label>
          <div class="btn-group">
            <button
              v-for="f in ['auto', 'webp', 'jpeg', 'png'] as OutputFormat[]"
              :key="f"
              class="btn btn--sm"
              :class="{ 'btn--active': dynamicFormat === f }"
              @click="dynamicFormat = f"
            >{{ f }}</button>
          </div>
        </div>

        <div class="control-group">
          <label>Quality: {{ dynamicQuality.toFixed(2) }}</label>
          <input type="range" min="0.1" max="1" step="0.05" v-model.number="dynamicQuality" />
        </div>
      </div>

      <CropVue
        ref="dynamicCropRef"
        :stencil="dynamicStencil"
        :aspect-ratio="dynamicAspectRatio"
        :output-format="dynamicFormat"
        :output-quality="dynamicQuality"
        @done="handleDynamicDone"
      >
        <template #done="{ result, restart }">
          <div class="result-card">
            <h3>Dynamic Result</h3>
            <img v-if="result" :src="result.url" alt="Result" class="result-image" />
            <div v-if="result" class="result-meta">
              <span>{{ result.width }}x{{ result.height }}</span>
              <span>{{ result.blob.type }}</span>
              <span>{{ (result.blob.size / 1024).toFixed(1) }} KB</span>
              <span>Quality: {{ dynamicQuality }}</span>
            </div>
            <button class="btn btn--primary" @click="restart">Try Again</button>
          </div>
        </template>
      </CropVue>
    </section>

    <!-- ===== 5. Composable-Only Usage ===== -->
    <section :id="'composable'" class="section">
      <h2>5. Composable API (useCropper)</h2>
      <p class="description">Direct composable usage without CropVue component. Full control over state and rendering.</p>

      <input type="file" accept="image/*" @change="onComposableFileSelect" class="file-input" />

      <div v-if="composableCropper.isReady.value" class="composable-demo">
        <CropEditor
          :image="composableCropper.image.value"
          :transform="composableCropper.transform.value"
          :crop="composableCropper.crop.value"
          @update:transform="t => composableCropper.transform.value = t"
          @update:crop="c => composableCropper.crop.value = c"
        />

        <div class="composable-controls">
          <div class="btn-group">
            <button class="btn btn--sm" @click="composableCropper.rotateLeft()">Rotate Left</button>
            <button class="btn btn--sm" @click="composableCropper.rotateRight()">Rotate Right</button>
            <button class="btn btn--sm" @click="composableCropper.flipX()">Flip X</button>
            <button class="btn btn--sm" @click="composableCropper.flipY()">Flip Y</button>
          </div>
          <div class="btn-group">
            <button class="btn btn--sm" @click="composableCropper.zoomBy(-0.1)">Zoom -</button>
            <button class="btn btn--sm" @click="composableCropper.zoomBy(0.1)">Zoom +</button>
            <button class="btn btn--sm" @click="composableCropper.zoomTo(1)">100%</button>
            <button class="btn btn--sm" @click="composableCropper.zoomTo(2)">200%</button>
          </div>
          <div class="btn-group">
            <button class="btn btn--sm" @click="composableCropper.panTo(50, 50)">Pan to (50,50)</button>
            <button class="btn btn--sm" @click="composableCropper.panTo(0, 0)">Pan to (0,0)</button>
            <button class="btn btn--sm" @click="composableCropper.rotateTo(45)">Rotate to 45</button>
            <button class="btn btn--sm" @click="composableCropper.rotateTo(0)">Rotate to 0</button>
          </div>
          <div class="btn-group">
            <button class="btn btn--sm" @click="composableCropper.setStencil('rectangle')">Rectangle</button>
            <button class="btn btn--sm" @click="composableCropper.setStencil('circle')">Circle</button>
            <button class="btn btn--sm" @click="composableCropper.setAspectRatio(1)">1:1</button>
            <button class="btn btn--sm" @click="composableCropper.setAspectRatio(null)">Free</button>
            <button class="btn btn--sm btn--danger" @click="composableCropper.reset()">Reset</button>
          </div>
        </div>

        <div class="state-display">
          <h4>Current Transform State:</h4>
          <pre>{{ JSON.stringify(composableCropper.transform.value, null, 2) }}</pre>
          <h4>Current Crop State:</h4>
          <pre>{{ JSON.stringify(composableCropper.crop.value, null, 2) }}</pre>
        </div>

        <button class="btn btn--primary" @click="getComposableResult">Get Result</button>

        <div v-if="composableResult" class="result-card">
          <h3>Composable Result</h3>
          <img :src="composableResult.url" alt="Result" class="result-image" />
          <div class="result-meta">
            <span>{{ composableResult.width }}x{{ composableResult.height }}</span>
            <span>{{ composableResult.blob.type }}</span>
            <span>{{ (composableResult.blob.size / 1024).toFixed(1) }} KB</span>
          </div>
          <h4>Result Coordinates:</h4>
          <pre>{{ JSON.stringify(composableResult.coords, null, 2) }}</pre>
        </div>
      </div>
      <p v-else class="status-text">{{ composableStatus || 'Select a file to begin' }}</p>
    </section>

    <!-- ===== 6. Standalone CropDropzone ===== -->
    <section :id="'dropzone'" class="section">
      <h2>6. Standalone CropDropzone</h2>
      <p class="description">CropDropzone component used independently. Validates accept types and max file size.</p>

      <div class="dropzone-demos">
        <div class="dropzone-demo">
          <h4>Accept: image/* (any image)</h4>
          <CropDropzone @files="onDropzoneFiles" @error="onDropzoneError" />
        </div>

        <div class="dropzone-demo">
          <h4>Max 500KB with custom slot</h4>
          <CropDropzone
            :max-size="500 * 1024"
            :accept="['image/jpeg', 'image/png']"
            @files="onDropzoneFiles"
            @error="onDropzoneError"
          >
            <template #default="{ open, isDragging }">
              <div
                class="dropzone-styled"
                :class="{ 'dropzone-styled--active': isDragging }"
                @click="open"
              >
                <p>{{ isDragging ? 'Drop it!' : 'JPEG/PNG only, max 500KB' }}</p>
              </div>
            </template>
          </CropDropzone>
        </div>
      </div>

      <div v-if="dropzoneFiles.length" class="file-list">
        <h4>Received Files:</h4>
        <div v-for="(file, i) in dropzoneFiles" :key="i" class="file-item">
          {{ file.name }} - {{ file.type }} - {{ (file.size / 1024).toFixed(1) }} KB
        </div>
      </div>
      <div v-if="dropzoneErrors.length" class="error-list">
        <h4>Errors:</h4>
        <div v-for="(err, i) in dropzoneErrors" :key="i" class="error-item">{{ err }}</div>
      </div>
    </section>

    <!-- ===== 7. Standalone CropToolbar ===== -->
    <section :id="'toolbar'" class="section">
      <h2>7. Standalone CropToolbar</h2>
      <p class="description">CropToolbar renders default UI with SVG icons. Emits events for each action.</p>

      <div class="toolbar-demo">
        <h4>Default Toolbar</h4>
        <CropToolbar
          :transform="toolbarTransform"
          @rotate-left="logToolbarAction('rotate-left')"
          @rotate-right="logToolbarAction('rotate-right')"
          @flip-x="logToolbarAction('flip-x')"
          @flip-y="logToolbarAction('flip-y')"
          @zoom-in="logToolbarAction('zoom-in')"
          @zoom-out="logToolbarAction('zoom-out')"
          @reset="logToolbarAction('reset')"
        />
      </div>

      <div class="toolbar-demo">
        <h4>Custom Toolbar via Slot</h4>
        <CropToolbar :transform="toolbarTransform">
          <template #default="{ rotateLeft, rotateRight, flipX, flipY, zoomIn, zoomOut, reset }">
            <div class="custom-toolbar custom-toolbar--minimal">
              <button class="btn btn--sm" @click="() => { rotateLeft(); logToolbarAction('custom-rotate-left') }">
                Rotate L
              </button>
              <button class="btn btn--sm" @click="() => { rotateRight(); logToolbarAction('custom-rotate-right') }">
                Rotate R
              </button>
              <button class="btn btn--sm btn--primary" @click="() => { zoomIn(); logToolbarAction('custom-zoom-in') }">
                Zoom +
              </button>
              <button class="btn btn--sm btn--danger" @click="() => { reset(); logToolbarAction('custom-reset') }">
                Reset
              </button>
            </div>
          </template>
        </CropToolbar>
      </div>

      <div v-if="toolbarLog.length" class="action-log">
        <h4>Action Log:</h4>
        <div v-for="(entry, i) in toolbarLog" :key="i" class="log-entry">{{ entry }}</div>
      </div>
    </section>

    <!-- ===== 8. Output Formats ===== -->
    <section :id="'format'" class="section">
      <h2>8. Output Format Options</h2>
      <p class="description">Test different output formats (auto, webp, jpeg, png) and quality settings.</p>

      <div class="controls-panel">
        <div class="control-group">
          <label>Format:</label>
          <div class="btn-group">
            <button
              v-for="f in ['auto', 'webp', 'jpeg', 'png'] as OutputFormat[]"
              :key="f"
              class="btn btn--sm"
              :class="{ 'btn--active': selectedFormat === f }"
              @click="selectedFormat = f"
            >{{ f }}</button>
          </div>
        </div>
        <div class="control-group">
          <label>Quality: {{ selectedQuality.toFixed(2) }}</label>
          <input type="range" min="0.1" max="1" step="0.05" v-model.number="selectedQuality" />
        </div>
      </div>

      <CropVue
        stencil="rectangle"
        :output-format="selectedFormat"
        :output-quality="selectedQuality"
        @done="handleFormatDone"
      >
        <template #done="{ result, restart }">
          <div class="result-card">
            <img v-if="result" :src="result.url" alt="Result" class="result-image" />
            <div v-if="result" class="result-meta">
              <span>{{ result.width }}x{{ result.height }}</span>
              <span>Format: {{ result.blob.type }}</span>
              <span>Size: {{ (result.blob.size / 1024).toFixed(1) }} KB</span>
              <span>Quality: {{ selectedQuality }}</span>
            </div>
            <button class="btn btn--primary" @click="restart">Try Different Format</button>
          </div>
        </template>
      </CropVue>
    </section>

    <!-- ===== 9. File Validation ===== -->
    <section :id="'validation'" class="section">
      <h2>9. File Validation (Size & Type Restrictions)</h2>
      <p class="description">Max file size 100KB, only JPEG/PNG accepted. Try uploading an invalid file to see error handling.</p>

      <CropVue
        :accept="['image/jpeg', 'image/png']"
        :max-file-size="100 * 1024"
        @error="handleValidationError"
      >
        <template #dropzone="{ open, isDragging }">
          <div
            class="validation-dropzone"
            :class="{ 'validation-dropzone--active': isDragging }"
            @click="open"
          >
            <p>Drop image here</p>
            <small>JPEG/PNG only, max 100KB</small>
          </div>
        </template>
      </CropVue>

      <div v-if="validationError" class="error-box">
        Validation Error: {{ validationError }}
        <button class="btn btn--sm" @click="validationError = null" style="margin-left: 8px">Clear</button>
      </div>
    </section>

    <!-- ===== 10. Output Dimensions ===== -->
    <section :id="'dimensions'" class="section">
      <h2>10. Custom Output Dimensions</h2>
      <p class="description">Constrain output to max width/height. Output will be scaled down to fit these bounds.</p>

      <div class="controls-panel">
        <div class="control-group">
          <label>Max Width: {{ outputMaxWidth }}px</label>
          <input type="range" min="50" max="1000" step="50" v-model.number="outputMaxWidth" />
        </div>
        <div class="control-group">
          <label>Max Height: {{ outputMaxHeight }}px</label>
          <input type="range" min="50" max="1000" step="50" v-model.number="outputMaxHeight" />
        </div>
      </div>

      <CropVue
        :output-max-width="outputMaxWidth"
        :output-max-height="outputMaxHeight"
        output-format="png"
        @done="handleDimensionDone"
      >
        <template #done="{ result, restart }">
          <div class="result-card">
            <img v-if="result" :src="result.url" alt="Result" class="result-image" />
            <div v-if="result" class="result-meta">
              <span>Output: {{ result.width }}x{{ result.height }}</span>
              <span>Original: {{ result.originalWidth }}x{{ result.originalHeight }}</span>
              <span>Constrained to: {{ outputMaxWidth }}x{{ outputMaxHeight }} max</span>
              <span>{{ (result.blob.size / 1024).toFixed(1) }} KB</span>
            </div>
            <button class="btn btn--primary" @click="restart">Try Again</button>
          </div>
        </template>
      </CropVue>
    </section>

    <!-- ===== 11. Theming ===== -->
    <section :id="'theming'" class="section" :class="`theme-${activeTheme}`">
      <h2>11. CSS Custom Property Theming</h2>
      <p class="description">Full visual customization via CSS custom properties. Switch between themes below.</p>

      <div class="controls-panel">
        <div class="control-group">
          <label>Theme:</label>
          <div class="btn-group">
            <button
              v-for="t in ['default', 'dark', 'purple', 'warm'] as const"
              :key="t"
              class="btn btn--sm"
              :class="{ 'btn--active': activeTheme === t }"
              @click="activeTheme = t"
            >{{ t }}</button>
          </div>
        </div>
      </div>

      <div :style="themeStyle as any" class="themed-wrapper">
        <CropVue
          stencil="circle"
          :aspect-ratio="1"
          @done="(r: CropResult) => themeResult = r"
        >
          <template #done="{ result, restart }">
            <div class="result-card">
              <img v-if="result" :src="result.url" alt="Result" class="result-image" />
              <div v-if="result" class="result-meta">
                <span>Theme: {{ activeTheme }}</span>
                <span>{{ result.width }}x{{ result.height }}</span>
              </div>
              <button class="btn btn--primary" @click="restart">Try Another Theme</button>
            </div>
          </template>
        </CropVue>
      </div>
    </section>

    <!-- ===== 12. Load from URL ===== -->
    <section :id="'url'" class="section">
      <h2>12. Load Image from URL</h2>
      <p class="description">Load an image directly from a URL using the `src` prop instead of file upload.</p>

      <div class="url-input-row">
        <input
          v-model="urlInput"
          type="text"
          class="text-input"
          placeholder="Enter image URL..."
        />
      </div>

      <CropVue
        :src="urlInput"
        stencil="rectangle"
        @done="handleUrlDone"
        @error="(e: CropVueError) => console.error('URL error:', e)"
      >
        <template #done="{ result, restart }">
          <div class="result-card">
            <img v-if="result" :src="result.url" alt="Result" class="result-image" />
            <div v-if="result" class="result-meta">
              <span>{{ result.width }}x{{ result.height }}</span>
              <span>{{ result.blob.type }}</span>
              <span>{{ (result.blob.size / 1024).toFixed(1) }} KB</span>
            </div>
            <button class="btn btn--primary" @click="restart">Reload</button>
          </div>
        </template>
      </CropVue>
    </section>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
}

body {
  background: #f8fafc;
  color: #1e293b;
}

.playground {
  max-width: 900px;
  margin: 0 auto;
  padding: 2rem 1rem;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
}

.header {
  text-align: center;
  margin-bottom: 2rem;
}

.header h1 {
  font-size: 2rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.subtitle {
  color: #64748b;
  margin-top: 0.5rem;
}

/* Navigation */
.nav {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 2rem;
  padding: 1rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.nav-link {
  padding: 4px 10px;
  font-size: 13px;
  color: #475569;
  text-decoration: none;
  border-radius: 6px;
  transition: all 150ms;
}

.nav-link:hover {
  background: #f1f5f9;
  color: #0f172a;
}

/* Sections */
.section {
  margin-bottom: 2.5rem;
  padding: 1.5rem;
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
}

.section h2 {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
}

.description {
  color: #64748b;
  font-size: 14px;
  margin-bottom: 1rem;
}

/* Buttons */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  color: #374151;
  font-size: 14px;
  cursor: pointer;
  transition: all 150ms;
  white-space: nowrap;
}

.btn:hover { background: #f3f4f6; }

.btn--sm { padding: 4px 10px; font-size: 12px; }

.btn--primary {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}
.btn--primary:hover { background: #2563eb; }

.btn--danger {
  background: #ef4444;
  color: #fff;
  border-color: #ef4444;
}
.btn--danger:hover { background: #dc2626; }

.btn--ghost {
  background: transparent;
  border-color: transparent;
  color: #6b7280;
}
.btn--ghost:hover { background: #f3f4f6; color: #374151; }

.btn--active {
  background: #3b82f6 !important;
  color: #fff !important;
  border-color: #3b82f6 !important;
}

.btn-group {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

/* Controls Panel */
.controls-panel {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  margin-bottom: 1rem;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 12px;
}

.control-group label {
  font-size: 13px;
  font-weight: 500;
  color: #475569;
  min-width: 100px;
}

.control-group input[type="range"] {
  flex: 1;
  max-width: 200px;
}

/* Results */
.result-card {
  padding: 1.5rem;
  text-align: center;
}

.result-card--center {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.result-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  margin: 1rem 0;
  border: 1px solid #e2e8f0;
}

.result-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
  justify-content: center;
  margin-bottom: 1rem;
  font-size: 13px;
  color: #64748b;
}

.result-meta span {
  padding: 2px 8px;
  background: #f1f5f9;
  border-radius: 4px;
}

.result-table {
  margin: 1rem auto;
  border-collapse: collapse;
  font-size: 14px;
}

.result-table td {
  padding: 4px 16px;
  border-bottom: 1px solid #f1f5f9;
  text-align: left;
}

.result-table td:first-child {
  font-weight: 500;
  color: #64748b;
}

/* Avatar Dropzone */
.avatar-dropzone {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
  border: 2px dashed #d1d5db;
  border-radius: 12px;
  cursor: pointer;
  transition: all 150ms;
}

.avatar-dropzone:hover {
  border-color: #3b82f6;
}

.avatar-dropzone--active {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.avatar-placeholder {
  text-align: center;
  color: #94a3b8;
}

.avatar-placeholder p {
  margin-top: 8px;
  font-size: 14px;
}

.avatar-result {
  margin: 1rem 0;
}

.avatar-image {
  width: 150px;
  height: 150px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid #e2e8f0;
}

/* Custom Dropzone */
.custom-drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 3rem;
  border: 2px dashed #d1d5db;
  border-radius: 16px;
  cursor: pointer;
  color: #94a3b8;
  transition: all 200ms;
}

.custom-drop:hover {
  border-color: #6366f1;
  color: #6366f1;
}

.custom-drop--active {
  border-color: #6366f1;
  background: rgba(99, 102, 241, 0.05);
  color: #6366f1;
}

.custom-drop__title {
  font-size: 16px;
  font-weight: 600;
}

.custom-drop__subtitle {
  font-size: 13px;
}

/* Custom Toolbar */
.custom-toolbar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  background: #1e293b;
  border-radius: 8px;
  margin: 8px 0;
}

.custom-toolbar--minimal {
  background: #f1f5f9;
}

.custom-toolbar__btn {
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: #e2e8f0;
  font-size: 16px;
  cursor: pointer;
  border-radius: 4px;
  transition: background 150ms;
}

.custom-toolbar__btn:hover {
  background: rgba(255, 255, 255, 0.1);
}

.custom-toolbar__btn--reset {
  font-size: 13px;
  color: #f87171;
}

.custom-toolbar__divider {
  color: #475569;
  margin: 0 2px;
}

/* Custom Actions */
.custom-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 12px 0;
}

/* Error Box */
.error-box {
  margin-top: 12px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  color: #dc2626;
  font-size: 14px;
}

/* Composable Demo */
.composable-demo {
  margin-top: 1rem;
}

.composable-controls {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-bottom: 1rem;
}

.state-display {
  margin: 1rem 0;
  padding: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
}

.state-display h4 {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 4px;
}

.state-display pre {
  font-size: 12px;
  color: #334155;
  overflow-x: auto;
  margin-bottom: 8px;
}

.status-text {
  color: #94a3b8;
  font-style: italic;
  padding: 1rem;
}

/* File Input */
.file-input {
  display: block;
  margin-bottom: 1rem;
}

/* Dropzone Demos */
.dropzone-demos {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
  margin-bottom: 1rem;
}

.dropzone-demo h4 {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
}

.dropzone-styled {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 120px;
  padding: 1rem;
  border: 2px dashed #fbbf24;
  border-radius: 12px;
  background: #fffbeb;
  color: #92400e;
  cursor: pointer;
  transition: all 150ms;
}

.dropzone-styled:hover {
  border-color: #f59e0b;
}

.dropzone-styled--active {
  border-color: #f59e0b;
  background: #fef3c7;
}

.file-list {
  margin-top: 12px;
}

.file-list h4 { font-size: 13px; color: #64748b; margin-bottom: 4px; }

.file-item {
  padding: 4px 8px;
  font-size: 13px;
  border-bottom: 1px solid #f1f5f9;
}

.error-list { margin-top: 8px; }
.error-list h4 { font-size: 13px; color: #dc2626; margin-bottom: 4px; }
.error-item {
  padding: 4px 8px;
  font-size: 13px;
  color: #dc2626;
  background: #fef2f2;
  border-radius: 4px;
  margin-bottom: 4px;
}

/* Toolbar Demo */
.toolbar-demo {
  margin-bottom: 1rem;
}

.toolbar-demo h4 {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 8px;
}

.action-log {
  margin-top: 12px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
}

.action-log h4 {
  font-size: 13px;
  color: #64748b;
  margin-bottom: 4px;
}

.log-entry {
  font-size: 12px;
  font-family: monospace;
  padding: 2px 0;
  color: #334155;
}

/* Validation Dropzone */
.validation-dropzone {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 150px;
  padding: 2rem;
  border: 2px dashed #fca5a5;
  border-radius: 12px;
  cursor: pointer;
  color: #dc2626;
  transition: all 150ms;
}

.validation-dropzone:hover {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.03);
}

.validation-dropzone--active {
  border-color: #ef4444;
  background: rgba(239, 68, 68, 0.05);
}

.validation-dropzone small {
  color: #f87171;
  margin-top: 4px;
}

/* URL Input */
.url-input-row {
  margin-bottom: 1rem;
}

.text-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  font-size: 14px;
  color: #1e293b;
}

.text-input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Theme Wrapper */
.themed-wrapper {
  border-radius: 12px;
  overflow: hidden;
}

.theme-dark .section {
  background: #0f172a;
  border-color: #1e293b;
  color: #e2e8f0;
}

.theme-dark .description { color: #94a3b8; }
.theme-dark .controls-panel { background: #1e293b; border-color: #334155; }
.theme-dark .control-group label { color: #94a3b8; }
</style>
