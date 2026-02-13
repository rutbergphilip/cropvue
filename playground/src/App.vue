<script setup lang="ts">
import { ref } from 'vue'
import { CropVue, CropEditor, CropPreview, CropDropzone, CropToolbar } from 'cropvue'
import { useCropper } from '@cropvue/core'
import type { CropResult, CropVueError } from '@cropvue/core'
import 'cropvue/styles'

// --- Simple usage (CropVue orchestrator) ---
const simpleResult = ref<CropResult | null>(null)

function handleDone(result: CropResult) {
  simpleResult.value = result
  console.log('Crop done:', {
    size: result.blob.size,
    type: result.blob.type,
    width: result.width,
    height: result.height,
  })
}

function handleError(error: CropVueError) {
  console.error('CropVue error:', error)
}

// --- Advanced usage (composable) ---
const showAdvanced = ref(false)
const cropper = useCropper({
  stencil: 'rectangle',
  outputQuality: 0.85,
})

const advancedResult = ref<CropResult | null>(null)

async function onAdvancedFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) {
    await cropper.loadFile(input.files[0])
  }
}

async function confirmAdvanced() {
  const result = await cropper.getResult()
  advancedResult.value = result
  console.log('Advanced crop result:', result)
}
</script>

<template>
  <div class="playground">
    <h1>CropVue Playground</h1>

    <section class="section">
      <h2>Simple Usage (CropVue component)</h2>
      <CropVue
        stencil="rectangle"
        :aspect-ratio="null"
        :output-quality="0.85"
        @done="handleDone"
        @error="handleError"
      >
        <template #dropzone="{ open, isDragging }">
          <div
            class="custom-dropzone"
            :class="{ 'custom-dropzone--active': isDragging }"
            @click="open"
          >
            <p>Drop an image here or click to browse</p>
          </div>
        </template>

        <template #toolbar="{ rotateLeft, rotateRight, flipX, flipY, zoomIn, zoomOut, reset }">
          <CropToolbar
            :transform="{ x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false }"
            @rotate-left="rotateLeft"
            @rotate-right="rotateRight"
            @flip-x="flipX"
            @flip-y="flipY"
            @zoom-in="zoomIn"
            @zoom-out="zoomOut"
            @reset="reset"
          />
        </template>

        <template #done="{ result, restart }">
          <div class="result">
            <h3>Cropped Result</h3>
            <img v-if="result" :src="result.url" alt="Result" class="result-image" />
            <p v-if="result">{{ result.width }}x{{ result.height }} - {{ (result.blob.size / 1024).toFixed(1) }}KB</p>
            <button @click="restart">Crop Another</button>
          </div>
        </template>
      </CropVue>
    </section>

    <section class="section">
      <h2>Advanced Usage (composable)</h2>
      <button @click="showAdvanced = !showAdvanced">
        {{ showAdvanced ? 'Hide' : 'Show' }} Advanced
      </button>

      <div v-if="showAdvanced" class="advanced">
        <input type="file" accept="image/*" @change="onAdvancedFileSelect" />

        <div v-if="cropper.isReady.value" class="advanced-controls">
          <div class="button-group">
            <button @click="cropper.rotateLeft()">Rotate Left</button>
            <button @click="cropper.rotateRight()">Rotate Right</button>
            <button @click="cropper.flipX()">Flip X</button>
            <button @click="cropper.flipY()">Flip Y</button>
            <button @click="cropper.zoomBy(0.1)">Zoom In</button>
            <button @click="cropper.zoomBy(-0.1)">Zoom Out</button>
            <button @click="cropper.reset()">Reset</button>
          </div>

          <p>
            Scale: {{ cropper.transform.value.scale.toFixed(2) }} |
            Rotation: {{ cropper.transform.value.rotation }} |
            Flip X: {{ cropper.transform.value.flipX }} |
            Flip Y: {{ cropper.transform.value.flipY }}
          </p>

          <button class="confirm-btn" @click="confirmAdvanced">Get Result</button>

          <div v-if="advancedResult" class="result">
            <h3>Result</h3>
            <img :src="advancedResult.url" alt="Advanced result" class="result-image" />
            <p>{{ advancedResult.width }}x{{ advancedResult.height }} - {{ (advancedResult.blob.size / 1024).toFixed(1) }}KB</p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>

<style>
* {
  box-sizing: border-box;
  margin: 0;
}

.playground {
  max-width: 800px;
  margin: 0 auto;
  padding: 2rem;
  font-family: system-ui, -apple-system, sans-serif;
}

h1 { margin-bottom: 2rem; }
h2 { margin-bottom: 1rem; }

.section {
  margin-bottom: 3rem;
  padding: 1.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
}

.custom-dropzone {
  border: 2px dashed #d1d5db;
  border-radius: 8px;
  padding: 3rem;
  text-align: center;
  color: #6b7280;
  cursor: pointer;
  transition: all 150ms ease;
}

.custom-dropzone:hover {
  border-color: #3b82f6;
  color: #3b82f6;
}

.custom-dropzone--active {
  border-color: #3b82f6;
  background: rgba(59, 130, 246, 0.05);
}

.result {
  text-align: center;
  padding: 1rem;
}

.result-image {
  max-width: 100%;
  max-height: 300px;
  border-radius: 8px;
  margin: 1rem 0;
}

.advanced {
  margin-top: 1rem;
}

.advanced-controls {
  margin-top: 1rem;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 1rem 0;
}

button {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 14px;
}

button:hover {
  background: #f3f4f6;
}

.confirm-btn {
  background: #3b82f6;
  color: #fff;
  border-color: #3b82f6;
}

.confirm-btn:hover {
  background: #2563eb;
}
</style>
