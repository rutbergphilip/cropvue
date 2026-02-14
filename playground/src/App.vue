<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import {
  CropVue,
  CropEditor,
  CropDropzone,
  CropToolbar,
} from 'cropvue'
import { useCropper } from '@cropvue/core'
import type { CropResult, CropVueError, StencilType, OutputFormat, TransformState } from '@cropvue/core'
import 'cropvue/styles'
import { createHighlighter } from 'shiki'
import { codeSnippets } from './snippets'

// ============================================================
// Code Tabs — Shiki highlighter + toggle state
// ============================================================
const highlighter = ref<any>(null)
const showCode = ref<Record<string, boolean>>({})

function highlightedCode(sectionId: string) {
  if (!highlighter.value || !codeSnippets[sectionId]) return ''
  return highlighter.value.codeToHtml(codeSnippets[sectionId], {
    lang: 'vue',
    theme: 'vitesse-dark',
  })
}

async function copyCode(sectionId: string) {
  const code = codeSnippets[sectionId]
  if (code) {
    await navigator.clipboard.writeText(code)
  }
}

// ============================================================
// Navigation — IntersectionObserver tracks active section
// ============================================================
const sections = [
  { id: 'basics', label: 'The Basics' },
  { id: 'avatar', label: 'Avatar Studio' },
  { id: 'full-control', label: 'Full Control' },
  { id: 'shape-shifter', label: 'Shape Shifter' },
  { id: 'composable', label: 'Under the Hood' },
  { id: 'themes', label: 'Theme Gallery' },
  { id: 'standalone', label: 'Standalone' },
  { id: 'profile-editor', label: 'Profile Editor' },
  { id: 'post-composer', label: 'Post Composer' },
  { id: 'product-gallery', label: 'Product Gallery' },
]

const activeSection = ref('basics')
let observer: IntersectionObserver | null = null

onMounted(async () => {
  highlighter.value = await createHighlighter({
    themes: ['vitesse-dark'],
    langs: ['vue'],
  })

  observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          activeSection.value = entry.target.id
        }
      }
    },
    { rootMargin: '-80px 0px -55% 0px', threshold: 0 }
  )
  for (const { id } of sections) {
    const el = document.getElementById(id)
    if (el) observer!.observe(el)
  }
})

onUnmounted(() => observer?.disconnect())

// ============================================================
// Section 1: The Basics — zero-config with CSS var theming
// ============================================================
const basicsResult = ref<CropResult | null>(null)

const basicsTheme: Record<string, string> = {
  '--cropvue-crop-border-color': '#00d4ff',
  '--cropvue-grid-color': 'rgba(0, 212, 255, 0.3)',
  '--cropvue-handle-color': '#00d4ff',
  '--cropvue-dropzone-border-color': '#2a2a34',
  '--cropvue-dropzone-border-color-active': '#00d4ff',
  '--cropvue-dropzone-bg': 'rgba(0, 212, 255, 0.02)',
  '--cropvue-dropzone-bg-active': 'rgba(0, 212, 255, 0.06)',
  '--cropvue-editor-bg': '#111118',
  '--cropvue-overlay-color': 'rgba(12, 12, 15, 0.65)',
  '--cropvue-toolbar-bg': '#16161a',
  '--cropvue-toolbar-border-color': '#2a2a34',
  '--cropvue-toolbar-btn-color': '#72728a',
  '--cropvue-toolbar-btn-hover-bg': '#1e1e24',
  '--cropvue-toolbar-btn-hover-color': '#00d4ff',
  '--cropvue-btn-bg': '#1e1e24',
  '--cropvue-btn-color': '#e8e8ed',
  '--cropvue-btn-border-color': '#2a2a34',
  '--cropvue-btn-hover-bg': '#2a2a34',
  '--cropvue-btn-confirm-bg': '#00d4ff',
  '--cropvue-btn-confirm-border': '#00d4ff',
  '--cropvue-btn-confirm-color': '#0c0c0f',
  '--cropvue-btn-confirm-hover-bg': '#00b8db',
}

// ============================================================
// Section 2: Avatar Studio — circle stencil + custom dropzone
// ============================================================
const avatarResult = ref<CropResult | null>(null)

// ============================================================
// Section 3: Full Control — all slots overridden
// ============================================================
const fullControlResult = ref<CropResult | null>(null)

// ============================================================
// Section 4: Shape Shifter — dynamic reactive controls
// ============================================================
const shifterStencil = ref<StencilType>('rectangle')
const shifterAspect = ref<number | null>(null)
const shifterFormat = ref<OutputFormat>('auto')
const shifterQuality = ref(0.85)
const shifterResult = ref<CropResult | null>(null)

const aspectPresets = [
  { label: 'Free', value: null },
  { label: '1:1', value: 1 },
  { label: '4:3', value: 4 / 3 },
  { label: '16:9', value: 16 / 9 },
  { label: '3:2', value: 3 / 2 },
]

// ============================================================
// Section 5: Under the Hood — composable API
// ============================================================
const cropper = useCropper({ stencil: 'rectangle', outputQuality: 0.85 })
const composableResult = ref<CropResult | null>(null)
const composableStatus = ref('')

async function onFileSelect(event: Event) {
  const input = event.target as HTMLInputElement
  if (input.files?.[0]) {
    composableStatus.value = 'Loading...'
    await cropper.loadFile(input.files[0])
    composableStatus.value = 'Image loaded — transform, then export.'
  }
}

async function exportResult() {
  composableStatus.value = 'Rendering...'
  const result = await cropper.getResult({ format: 'webp', quality: 0.8 })
  composableResult.value = result
  composableStatus.value = `Done: ${result.width}\u00d7${result.height}, ${kb(result.blob.size)}`
}

// ============================================================
// Section 6: Theme Gallery — three themed CropVue instances
// ============================================================
const themeImageUrls: Record<string, string> = {
  midnight: 'https://picsum.photos/id/1015/400/300',
  violet: 'https://picsum.photos/id/1025/400/300',
  ember: 'https://picsum.photos/id/1035/400/300',
}

const themeConfigs = {
  midnight: {
    name: 'Midnight',
    accent: '#22d3ee',
    style: {
      '--cropvue-editor-bg': '#0a1628',
      '--cropvue-overlay-color': 'rgba(10, 22, 40, 0.7)',
      '--cropvue-crop-border-color': '#22d3ee',
      '--cropvue-grid-color': 'rgba(34, 211, 238, 0.3)',
      '--cropvue-handle-color': '#22d3ee',
      '--cropvue-toolbar-bg': '#0f1f38',
      '--cropvue-toolbar-border-color': '#1a3050',
      '--cropvue-toolbar-btn-color': '#7dd3fc',
      '--cropvue-toolbar-btn-hover-bg': '#1a3050',
      '--cropvue-btn-bg': '#0f1f38',
      '--cropvue-btn-color': '#e0f2fe',
      '--cropvue-btn-border-color': '#1a3050',
      '--cropvue-btn-hover-bg': '#1a3050',
      '--cropvue-btn-confirm-bg': '#0891b2',
      '--cropvue-btn-confirm-border': '#0891b2',
      '--cropvue-btn-confirm-hover-bg': '#0e7490',
      '--cropvue-dropzone-border-color': '#1a3050',
      '--cropvue-dropzone-border-color-active': '#22d3ee',
      '--cropvue-dropzone-bg': 'rgba(10, 22, 40, 0.5)',
      '--cropvue-dropzone-bg-active': 'rgba(34, 211, 238, 0.08)',
    },
  },
  violet: {
    name: 'Neon Violet',
    accent: '#a855f7',
    style: {
      '--cropvue-editor-bg': '#1a0a2e',
      '--cropvue-overlay-color': 'rgba(26, 10, 46, 0.7)',
      '--cropvue-crop-border-color': '#a855f7',
      '--cropvue-grid-color': 'rgba(168, 85, 247, 0.3)',
      '--cropvue-handle-color': '#a855f7',
      '--cropvue-toolbar-bg': '#240e40',
      '--cropvue-toolbar-border-color': '#3b1664',
      '--cropvue-toolbar-btn-color': '#c4b5fd',
      '--cropvue-toolbar-btn-hover-bg': '#3b1664',
      '--cropvue-btn-bg': '#240e40',
      '--cropvue-btn-color': '#e9d5ff',
      '--cropvue-btn-border-color': '#3b1664',
      '--cropvue-btn-hover-bg': '#3b1664',
      '--cropvue-btn-confirm-bg': '#9333ea',
      '--cropvue-btn-confirm-border': '#9333ea',
      '--cropvue-btn-confirm-hover-bg': '#7e22ce',
      '--cropvue-dropzone-border-color': '#3b1664',
      '--cropvue-dropzone-border-color-active': '#a855f7',
      '--cropvue-dropzone-bg': 'rgba(26, 10, 46, 0.5)',
      '--cropvue-dropzone-bg-active': 'rgba(168, 85, 247, 0.08)',
    },
  },
  ember: {
    name: 'Ember',
    accent: '#f59e0b',
    style: {
      '--cropvue-editor-bg': '#1c1210',
      '--cropvue-overlay-color': 'rgba(28, 18, 16, 0.7)',
      '--cropvue-crop-border-color': '#f59e0b',
      '--cropvue-grid-color': 'rgba(245, 158, 11, 0.3)',
      '--cropvue-handle-color': '#f59e0b',
      '--cropvue-toolbar-bg': '#2a1c18',
      '--cropvue-toolbar-border-color': '#3d2a22',
      '--cropvue-toolbar-btn-color': '#fcd34d',
      '--cropvue-toolbar-btn-hover-bg': '#3d2a22',
      '--cropvue-btn-bg': '#2a1c18',
      '--cropvue-btn-color': '#fef3c7',
      '--cropvue-btn-border-color': '#3d2a22',
      '--cropvue-btn-hover-bg': '#3d2a22',
      '--cropvue-btn-confirm-bg': '#d97706',
      '--cropvue-btn-confirm-border': '#d97706',
      '--cropvue-btn-confirm-hover-bg': '#b45309',
      '--cropvue-dropzone-border-color': '#3d2a22',
      '--cropvue-dropzone-border-color-active': '#f59e0b',
      '--cropvue-dropzone-bg': 'rgba(28, 18, 16, 0.5)',
      '--cropvue-dropzone-bg-active': 'rgba(245, 158, 11, 0.08)',
    },
  },
} as const

type ThemeKey = keyof typeof themeConfigs

// ============================================================
// Section 7: Standalone Parts — bento grid
// ============================================================
const standaloneFiles = ref<File[]>([])
const urlInput = ref('https://picsum.photos/id/1040/800/600')
const urlResult = ref<CropResult | null>(null)
const toolbarTransform = ref<TransformState>({
  x: 0, y: 0, scale: 1, rotation: 0, flipX: false, flipY: false,
})
const toolbarLog = ref<string[]>([])

function logAction(action: string) {
  toolbarLog.value.unshift(action)
  if (toolbarLog.value.length > 6) toolbarLog.value.pop()
}

// ============================================================
// Section 8: Profile Editor — avatar + form card
// ============================================================
const profileAvatar = ref<CropResult | null>(null)
const profileName = ref('Alex Johnson')
const profileEmail = ref('alex@example.com')
const profileBio = ref('Design-minded developer who loves clean UI.')
const profileSaved = ref(false)

const profileTheme: Record<string, string> = {
  '--cropvue-editor-bg': '#1c1917',
  '--cropvue-editor-aspect-ratio': '1',
  '--cropvue-toolbar-separator-display': 'none',
  '--cropvue-overlay-color': 'rgba(28, 25, 23, 0.65)',
  '--cropvue-crop-border-color': '#a3a3a3',
  '--cropvue-grid-color': 'rgba(163, 163, 163, 0.25)',
  '--cropvue-handle-color': '#d4d4d4',
  '--cropvue-toolbar-bg': '#292524',
  '--cropvue-toolbar-border-color': '#44403c',
  '--cropvue-toolbar-btn-color': '#a8a29e',
  '--cropvue-toolbar-btn-hover-bg': '#44403c',
  '--cropvue-toolbar-btn-size': '28px',
  '--cropvue-toolbar-padding': '4px',
  '--cropvue-toolbar-gap': '2px',
  '--cropvue-toolbar-separator-height': '14px',
  '--cropvue-btn-bg': '#292524',
  '--cropvue-btn-color': '#e7e5e4',
  '--cropvue-btn-border-color': '#44403c',
  '--cropvue-btn-hover-bg': '#44403c',
  '--cropvue-btn-padding': '6px 12px',
  '--cropvue-btn-font-size': '12px',
  '--cropvue-btn-confirm-bg': '#06b6d4',
  '--cropvue-btn-confirm-border': '#06b6d4',
  '--cropvue-btn-confirm-color': '#fff',
  '--cropvue-btn-confirm-hover-bg': '#0891b2',
  '--cropvue-actions-padding': '8px 0',
  '--cropvue-actions-gap': '6px',
  '--cropvue-dropzone-border-color': '#44403c',
  '--cropvue-dropzone-border-color-active': '#06b6d4',
  '--cropvue-dropzone-bg': 'rgba(28, 25, 23, 0.5)',
  '--cropvue-dropzone-bg-active': 'rgba(6, 182, 212, 0.08)',
}

function saveProfile() {
  profileSaved.value = true
  setTimeout(() => { profileSaved.value = false }, 2000)
}

// ============================================================
// Section 9: Post Composer — cover image + text
// ============================================================
const postCover = ref<CropResult | null>(null)
const postTitle = ref('')
const postBody = ref('')
const postTags = ref(['Design', 'Vue', 'Tutorial'])
const postPublished = ref(false)

function publishPost() {
  postPublished.value = true
  setTimeout(() => { postPublished.value = false }, 2000)
}

function removePostCover() {
  postCover.value = null
}

// ============================================================
// Section 10: Product Gallery — multi-slot images
// ============================================================
const productImages = ref<(CropResult | null)[]>([null, null, null, null])
const activeProductSlot = ref<number | null>(null)
const showProductCropper = ref(false)

function openProductSlot(index: number) {
  activeProductSlot.value = index
  showProductCropper.value = true
}

function onProductCrop(result: CropResult) {
  if (activeProductSlot.value !== null) {
    const imgs = [...productImages.value]
    imgs[activeProductSlot.value] = result
    productImages.value = imgs
  }
  showProductCropper.value = false
  activeProductSlot.value = null
}

function removeProductImage(index: number) {
  const imgs = [...productImages.value]
  imgs[index] = null
  productImages.value = imgs
}

// ============================================================
// Helpers
// ============================================================
function kb(bytes: number) {
  return `${(bytes / 1024).toFixed(1)} KB`
}
</script>

<template>
  <div class="app">
    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- HERO                                                   -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <header class="hero">
      <div class="hero__grid" aria-hidden="true"></div>
      <div class="hero__content">
        <h1 class="hero__title">CropVue</h1>
        <p class="hero__tagline">Image cropping for Vue, reimagined.</p>
        <p class="hero__sub">10 interactive demos showcasing what's possible.</p>
      </div>
    </header>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- STICKY NAV                                             -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <nav class="nav">
      <a
        v-for="s in sections"
        :key="s.id"
        :href="`#${s.id}`"
        class="nav__pill"
        :class="{ 'nav__pill--active': activeSection === s.id }"
      >{{ s.label }}</a>
    </nav>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- 01 · THE BASICS                                        -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <section id="basics" class="showcase">
      <div class="showcase__header">
        <span class="showcase__num" style="--accent: var(--cyan)">01</span>
        <div>
          <h2 class="showcase__title">The Basics</h2>
          <p class="showcase__desc">Zero-config defaults with CSS variable theming. No custom slots — just drop and crop.</p>
        </div>
        <div class="showcase__toggle">
          <button class="toggle-btn" :class="{ 'toggle-btn--active': !showCode['basics'] }" @click="showCode['basics'] = false">Preview</button>
          <button class="toggle-btn" :class="{ 'toggle-btn--active': showCode['basics'] }" @click="showCode['basics'] = true">Code</button>
        </div>
      </div>

      <template v-if="!showCode['basics']">
      <div class="basics__frame">
        <div class="basics__corner basics__corner--tl"></div>
        <div class="basics__corner basics__corner--tr"></div>
        <div class="basics__corner basics__corner--bl"></div>
        <div class="basics__corner basics__corner--br"></div>
        <div :style="basicsTheme">
          <CropVue
            stencil="rectangle"
            :aspect-ratio="null"
            :output-quality="0.85"
            @done="(r: CropResult) => basicsResult = r"
          >
            <template #done="{ result, restart }">
              <div class="result">
                <img v-if="result" :src="result.url" alt="Cropped result" class="result__img" />
                <div v-if="result" class="result__meta">
                  <span class="pill">{{ result.width }}&times;{{ result.height }}</span>
                  <span class="pill">{{ result.blob.type }}</span>
                  <span class="pill">{{ kb(result.blob.size) }}</span>
                </div>
                <button class="btn btn--cyan" @click="restart">Crop Another</button>
              </div>
            </template>
          </CropVue>
        </div>
      </div>
      </template>

      <div v-else class="snippet">
        <div class="snippet__header">
          <span class="snippet__filename">BasicExample.vue</span>
          <button class="snippet__copy" @click="copyCode('basics')">Copy</button>
        </div>
        <div class="snippet__body" v-html="highlightedCode('basics')"></div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- 02 · AVATAR STUDIO                                     -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <section id="avatar" class="showcase">
      <div class="showcase__header">
        <span class="showcase__num" style="--accent: var(--magenta)">02</span>
        <div>
          <h2 class="showcase__title">Avatar Studio</h2>
          <p class="showcase__desc">Circle stencil with 1:1 lock. Custom dropzone and result display via scoped slots.</p>
        </div>
        <div class="showcase__toggle">
          <button class="toggle-btn" :class="{ 'toggle-btn--active': !showCode['avatar'] }" @click="showCode['avatar'] = false">Preview</button>
          <button class="toggle-btn" :class="{ 'toggle-btn--active': showCode['avatar'] }" @click="showCode['avatar'] = true">Code</button>
        </div>
      </div>

      <template v-if="!showCode['avatar']">
      <div class="avatar__card">
        <CropVue
          stencil="circle"
          :aspect-ratio="1"
          output-format="webp"
          :output-quality="0.9"
          @done="(r: CropResult) => avatarResult = r"
        >
          <template #dropzone="{ open, isDragging }">
            <div
              class="avatar__drop"
              :class="{ 'avatar__drop--active': isDragging }"
              @click="open"
            >
              <div class="avatar__drop-inner">
                <div class="avatar__circle">
                  <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5">
                    <circle cx="12" cy="8" r="4" />
                    <path d="M20 21a8 8 0 0 0-16 0" />
                  </svg>
                </div>
                <div class="avatar__drop-text">
                  <span class="avatar__drop-title">{{ isDragging ? 'Drop to upload' : 'Upload avatar' }}</span>
                  <span class="avatar__drop-sub">Click or drag an image</span>
                </div>
              </div>
              <div class="avatar__lines">
                <div class="avatar__line"></div>
                <div class="avatar__line avatar__line--short"></div>
              </div>
            </div>
          </template>

          <template #done="{ result, restart }">
            <div class="result result--center">
              <div v-if="result" class="avatar__result-ring">
                <img :src="result.url" alt="Avatar" class="avatar__result-img" />
              </div>
              <div v-if="result" class="result__meta">
                <span class="pill pill--magenta">{{ result.width }}&times;{{ result.height }}</span>
                <span class="pill pill--magenta">{{ result.blob.type }}</span>
                <span class="pill pill--magenta">{{ kb(result.blob.size) }}</span>
              </div>
              <button class="btn btn--magenta" @click="restart">Choose Different Photo</button>
            </div>
          </template>
        </CropVue>
      </div>
      </template>

      <div v-else class="snippet">
        <div class="snippet__header">
          <span class="snippet__filename">AvatarStudio.vue</span>
          <button class="snippet__copy" @click="copyCode('avatar')">Copy</button>
        </div>
        <div class="snippet__body" v-html="highlightedCode('avatar')"></div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- 03 · FULL CONTROL                                      -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <section id="full-control" class="showcase">
      <div class="showcase__header">
        <span class="showcase__num" style="--accent: var(--emerald)">03</span>
        <div>
          <h2 class="showcase__title">Full Control</h2>
          <p class="showcase__desc">Every slot overridden — custom dropzone, toolbar, actions, and result view.</p>
        </div>
        <div class="showcase__toggle">
          <button class="toggle-btn" :class="{ 'toggle-btn--active': !showCode['full-control'] }" @click="showCode['full-control'] = false">Preview</button>
          <button class="toggle-btn" :class="{ 'toggle-btn--active': showCode['full-control'] }" @click="showCode['full-control'] = true">Code</button>
        </div>
      </div>

      <template v-if="!showCode['full-control']">
      <CropVue
        stencil="rectangle"
        :aspect-ratio="16 / 9"
        output-format="jpeg"
        :output-quality="0.8"
        @done="(r: CropResult) => fullControlResult = r"
      >
        <template #dropzone="{ open, isDragging }">
          <div class="terminal" :class="{ 'terminal--active': isDragging }" @click="open">
            <div class="terminal__bar">
              <span class="terminal__dot terminal__dot--red"></span>
              <span class="terminal__dot terminal__dot--yellow"></span>
              <span class="terminal__dot terminal__dot--green"></span>
              <span class="terminal__bar-title">cropvue &mdash; upload</span>
            </div>
            <div class="terminal__body">
              <p class="terminal__line">
                <span class="terminal__prompt">$</span>
                <span>{{ isDragging ? 'receiving --image stream...' : 'drop --image here' }}</span>
                <span class="terminal__cursor"></span>
              </p>
              <p class="terminal__hint">or click to browse &middot; 16:9 JPEG output</p>
            </div>
          </div>
        </template>

        <template #toolbar="{ rotateLeft, rotateRight, flipX, flipY, zoomIn, zoomOut, reset }">
          <div class="dock">
            <button class="dock__btn" @click="rotateLeft" title="Rotate left">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M2.5 2v6h6"/><path d="M2.66 12.5a9 9 0 1 0 1.34-5L2.5 8"/></svg>
            </button>
            <button class="dock__btn" @click="rotateRight" title="Rotate right">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.5 2v6h-6"/><path d="M21.34 12.5a9 9 0 1 1-1.34-5L21.5 8"/></svg>
            </button>
            <span class="dock__sep"></span>
            <button class="dock__btn" @click="flipX" title="Flip horizontal">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M8 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3"/><path d="M16 3h3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-3"/><line x1="12" y1="20" x2="12" y2="4"/></svg>
            </button>
            <button class="dock__btn" @click="flipY" title="Flip vertical">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 8V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v3"/><path d="M3 16v3a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-3"/><line x1="4" y1="12" x2="20" y2="12"/></svg>
            </button>
            <span class="dock__sep"></span>
            <button class="dock__btn" @click="zoomOut" title="Zoom out">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>
            <button class="dock__btn" @click="zoomIn" title="Zoom in">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><line x1="11" y1="8" x2="11" y2="14"/><line x1="8" y1="11" x2="14" y2="11"/></svg>
            </button>
            <span class="dock__sep"></span>
            <button class="dock__btn dock__btn--danger" @click="reset" title="Reset">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>
            </button>
          </div>
        </template>

        <template #actions="{ confirm, cancel }">
          <div class="terminal__actions">
            <button class="btn btn--ghost" @click="cancel">Discard</button>
            <button class="btn btn--emerald" @click="confirm">Export 16:9 JPEG</button>
          </div>
        </template>

        <template #done="{ result, restart }">
          <div class="result">
            <img v-if="result" :src="result.url" alt="Result" class="result__img" />
            <table v-if="result" class="result__table">
              <tr><td>Dimensions</td><td>{{ result.width }} &times; {{ result.height }}</td></tr>
              <tr><td>Format</td><td>{{ result.blob.type }}</td></tr>
              <tr><td>Size</td><td>{{ kb(result.blob.size) }}</td></tr>
              <tr><td>Original</td><td>{{ result.originalWidth }} &times; {{ result.originalHeight }}</td></tr>
            </table>
            <button class="btn btn--emerald" @click="restart">Start Over</button>
          </div>
        </template>
      </CropVue>
      </template>

      <div v-else class="snippet">
        <div class="snippet__header">
          <span class="snippet__filename">FullControl.vue</span>
          <button class="snippet__copy" @click="copyCode('full-control')">Copy</button>
        </div>
        <div class="snippet__body" v-html="highlightedCode('full-control')"></div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- 04 · SHAPE SHIFTER                                     -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <section id="shape-shifter" class="showcase">
      <div class="showcase__header">
        <span class="showcase__num" style="--accent: var(--amber)">04</span>
        <div>
          <h2 class="showcase__title">Shape Shifter</h2>
          <p class="showcase__desc">Reactive props — change stencil, aspect ratio, format and quality in real-time.</p>
        </div>
        <div class="showcase__toggle">
          <button class="toggle-btn" :class="{ 'toggle-btn--active': !showCode['shape-shifter'] }" @click="showCode['shape-shifter'] = false">Preview</button>
          <button class="toggle-btn" :class="{ 'toggle-btn--active': showCode['shape-shifter'] }" @click="showCode['shape-shifter'] = true">Code</button>
        </div>
      </div>

      <template v-if="!showCode['shape-shifter']">
      <div class="controls">
        <div class="controls__row">
          <span class="controls__label">Stencil</span>
          <div class="controls__pills">
            <button
              v-for="s in (['rectangle', 'circle'] as StencilType[])"
              :key="s"
              class="pill-btn"
              :class="{ 'pill-btn--active': shifterStencil === s }"
              @click="shifterStencil = s"
            >{{ s }}</button>
          </div>
        </div>
        <div class="controls__row">
          <span class="controls__label">Ratio</span>
          <div class="controls__pills">
            <button
              v-for="p in aspectPresets"
              :key="p.label"
              class="pill-btn"
              :class="{ 'pill-btn--active': shifterAspect === p.value }"
              @click="shifterAspect = p.value"
            >{{ p.label }}</button>
          </div>
        </div>
        <div class="controls__row">
          <span class="controls__label">Format</span>
          <div class="controls__pills">
            <button
              v-for="f in (['auto', 'webp', 'jpeg', 'png'] as OutputFormat[])"
              :key="f"
              class="pill-btn"
              :class="{ 'pill-btn--active': shifterFormat === f }"
              @click="shifterFormat = f"
            >{{ f }}</button>
          </div>
        </div>
        <div class="controls__row">
          <span class="controls__label">Quality</span>
          <div class="controls__slider">
            <input type="range" min="0.1" max="1" step="0.05" v-model.number="shifterQuality" class="range-input" />
            <span class="controls__value">{{ shifterQuality.toFixed(2) }}</span>
          </div>
        </div>
      </div>

      <CropVue
        :stencil="shifterStencil"
        :aspect-ratio="shifterAspect"
        :output-format="shifterFormat"
        :output-quality="shifterQuality"
        @done="(r: CropResult) => shifterResult = r"
      >
        <template #done="{ result, restart }">
          <div class="result">
            <img v-if="result" :src="result.url" alt="Result" class="result__img" />
            <div v-if="result" class="result__meta">
              <span class="pill pill--amber">{{ result.width }}&times;{{ result.height }}</span>
              <span class="pill pill--amber">{{ result.blob.type }}</span>
              <span class="pill pill--amber">{{ kb(result.blob.size) }}</span>
              <span class="pill pill--amber">q{{ shifterQuality }}</span>
            </div>
            <button class="btn btn--amber" @click="restart">Try Again</button>
          </div>
        </template>
      </CropVue>
      </template>

      <div v-else class="snippet">
        <div class="snippet__header">
          <span class="snippet__filename">ShapeShifter.vue</span>
          <button class="snippet__copy" @click="copyCode('shape-shifter')">Copy</button>
        </div>
        <div class="snippet__body" v-html="highlightedCode('shape-shifter')"></div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- 05 · UNDER THE HOOD                                    -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <section id="composable" class="showcase showcase--blueprint">
      <div class="showcase__header">
        <span class="showcase__num" style="--accent: var(--cyan)">05</span>
        <div>
          <h2 class="showcase__title">Under the Hood</h2>
          <p class="showcase__desc">The <code>useCropper()</code> composable with manual <code>CropEditor</code> wiring. Full programmatic control.</p>
        </div>
        <div class="showcase__toggle">
          <button class="toggle-btn" :class="{ 'toggle-btn--active': !showCode['composable'] }" @click="showCode['composable'] = false">Preview</button>
          <button class="toggle-btn" :class="{ 'toggle-btn--active': showCode['composable'] }" @click="showCode['composable'] = true">Code</button>
        </div>
      </div>

      <template v-if="!showCode['composable']">
      <label class="file-btn">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        Choose File
        <input type="file" accept="image/*" @change="onFileSelect" hidden />
      </label>

      <template v-if="cropper.isReady.value">
        <CropEditor
          :image="cropper.image.value"
          :transform="cropper.transform.value"
          :crop="cropper.crop.value"
          @update:transform="t => cropper.transform.value = t"
          @update:crop="c => cropper.crop.value = c"
        />

        <div class="blueprint__controls">
          <div class="btn-row">
            <button class="btn btn--sm btn--outline" @click="cropper.rotateLeft()">&#x21BA; Rotate L</button>
            <button class="btn btn--sm btn--outline" @click="cropper.rotateRight()">&#x21BB; Rotate R</button>
            <button class="btn btn--sm btn--outline" @click="cropper.flipX()">&#x21C4; Flip X</button>
            <button class="btn btn--sm btn--outline" @click="cropper.flipY()">&#x21C5; Flip Y</button>
          </div>
          <div class="btn-row">
            <button class="btn btn--sm btn--outline" @click="cropper.zoomBy(-0.1)">&minus; Zoom</button>
            <button class="btn btn--sm btn--outline" @click="cropper.zoomBy(0.1)">+ Zoom</button>
            <button class="btn btn--sm btn--outline" @click="cropper.setStencil('rectangle')">&#x25AD; Rect</button>
            <button class="btn btn--sm btn--outline" @click="cropper.setStencil('circle')">&#x25CB; Circle</button>
            <button class="btn btn--sm btn--danger-outline" @click="cropper.reset()">Reset</button>
          </div>
        </div>

        <div class="code-block">
          <div class="code-block__header">transform state</div>
          <pre>{{ JSON.stringify(cropper.transform.value, null, 2) }}</pre>
        </div>

        <button class="btn btn--cyan" style="margin-top: 12px" @click="exportResult">Export Result</button>

        <div v-if="composableResult" class="result" style="margin-top: 16px">
          <img :src="composableResult.url" alt="Result" class="result__img" />
          <div class="result__meta">
            <span class="pill">{{ composableResult.width }}&times;{{ composableResult.height }}</span>
            <span class="pill">{{ composableResult.blob.type }}</span>
            <span class="pill">{{ kb(composableResult.blob.size) }}</span>
          </div>
        </div>
      </template>

      <p v-else class="status-text">{{ composableStatus || 'Select a file to begin' }}</p>
      </template>

      <div v-else class="snippet">
        <div class="snippet__header">
          <span class="snippet__filename">ComposableExample.vue</span>
          <button class="snippet__copy" @click="copyCode('composable')">Copy</button>
        </div>
        <div class="snippet__body" v-html="highlightedCode('composable')"></div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- 06 · THEME GALLERY                                     -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <section id="themes" class="showcase">
      <div class="showcase__header">
        <span class="showcase__num" style="--accent: #a78bfa">06</span>
        <div>
          <h2 class="showcase__title">Theme Gallery</h2>
          <p class="showcase__desc">Three radically different themes — all CSS custom properties, zero code changes.</p>
        </div>
        <div class="showcase__toggle">
          <button class="toggle-btn" :class="{ 'toggle-btn--active': !showCode['themes'] }" @click="showCode['themes'] = false">Preview</button>
          <button class="toggle-btn" :class="{ 'toggle-btn--active': showCode['themes'] }" @click="showCode['themes'] = true">Code</button>
        </div>
      </div>

      <template v-if="!showCode['themes']">
      <div class="theme-grid">
        <div
          v-for="(theme, key) in themeConfigs"
          :key="key"
          class="theme-card"
          :style="{ '--card-accent': theme.accent }"
        >
          <div class="theme-card__accent"></div>
          <h3 class="theme-card__name">{{ theme.name }}</h3>
          <div class="theme-card__body" :style="theme.style">
            <CropVue
              stencil="circle"
              :aspect-ratio="1"
              :src="themeImageUrls[key as ThemeKey]"
            >
              <template #done="{ result, restart }">
                <div class="result result--compact">
                  <img v-if="result" :src="result.url" alt="Result" class="result__img result__img--sm" />
                  <button class="btn btn--sm btn--outline" @click="restart">Redo</button>
                </div>
              </template>
            </CropVue>
          </div>
        </div>
      </div>
      </template>

      <div v-else class="snippet">
        <div class="snippet__header">
          <span class="snippet__filename">ThemeExample.vue</span>
          <button class="snippet__copy" @click="copyCode('themes')">Copy</button>
        </div>
        <div class="snippet__body" v-html="highlightedCode('themes')"></div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- 07 · STANDALONE PARTS                                  -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <section id="standalone" class="showcase">
      <div class="showcase__header">
        <span class="showcase__num" style="--accent: var(--emerald)">07</span>
        <div>
          <h2 class="showcase__title">Standalone Parts</h2>
          <p class="showcase__desc">Individual components used independently — dropzone, toolbar, and URL loading.</p>
        </div>
        <div class="showcase__toggle">
          <button class="toggle-btn" :class="{ 'toggle-btn--active': !showCode['standalone'] }" @click="showCode['standalone'] = false">Preview</button>
          <button class="toggle-btn" :class="{ 'toggle-btn--active': showCode['standalone'] }" @click="showCode['standalone'] = true">Code</button>
        </div>
      </div>

      <template v-if="!showCode['standalone']">
      <div class="bento">
        <!-- Standalone Dropzone -->
        <div class="bento__item">
          <h3 class="bento__label">CropDropzone</h3>
          <CropDropzone @files="(f: File[]) => standaloneFiles.push(...f)">
            <template #default="{ open, isDragging }">
              <div
                class="rainbow-drop"
                :class="{ 'rainbow-drop--active': isDragging }"
                @click="open"
              >
                <div class="rainbow-drop__inner">
                  <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5" opacity="0.6">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  <span>{{ isDragging ? 'Release!' : 'Drop files here' }}</span>
                </div>
              </div>
            </template>
          </CropDropzone>
          <div v-if="standaloneFiles.length" class="bento__files">
            <span v-for="(f, i) in standaloneFiles" :key="i" class="pill pill--sm">{{ f.name }}</span>
          </div>
        </div>

        <!-- Standalone Toolbar -->
        <div class="bento__item">
          <h3 class="bento__label">CropToolbar</h3>
          <div class="bento__toolbar-wrap">
            <CropToolbar
              :transform="toolbarTransform"
              @rotate-left="logAction('rotate-left')"
              @rotate-right="logAction('rotate-right')"
              @flip-x="logAction('flip-x')"
              @flip-y="logAction('flip-y')"
              @zoom-in="logAction('zoom-in')"
              @zoom-out="logAction('zoom-out')"
              @reset="logAction('reset')"
            />
          </div>
          <div v-if="toolbarLog.length" class="bento__log">
            <span v-for="(entry, i) in toolbarLog" :key="i" class="bento__log-entry">{{ entry }}</span>
          </div>
        </div>

        <!-- URL Loading -->
        <div class="bento__item bento__item--url">
          <h3 class="bento__label">URL Loading</h3>
          <div class="url-row">
            <input
              v-model="urlInput"
              type="text"
              class="url-input"
              placeholder="Enter image URL..."
            />
          </div>
          <CropVue
            :src="urlInput"
            stencil="rectangle"
            @done="(r: CropResult) => urlResult = r"
          >
            <template #done="{ result, restart }">
              <div class="result result--compact">
                <img v-if="result" :src="result.url" alt="Result" class="result__img result__img--sm" />
                <div v-if="result" class="result__meta">
                  <span class="pill">{{ result.width }}&times;{{ result.height }}</span>
                  <span class="pill">{{ kb(result.blob.size) }}</span>
                </div>
                <button class="btn btn--emerald btn--sm" @click="restart">Reload</button>
              </div>
            </template>
          </CropVue>
        </div>
      </div>
      </template>

      <div v-else class="snippet">
        <div class="snippet__header">
          <span class="snippet__filename">StandaloneParts.vue</span>
          <button class="snippet__copy" @click="copyCode('standalone')">Copy</button>
        </div>
        <div class="snippet__body" v-html="highlightedCode('standalone')"></div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- 08 · PROFILE EDITOR                                    -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <section id="profile-editor" class="showcase">
      <div class="showcase__header">
        <span class="showcase__num" style="--accent: var(--cyan)">08</span>
        <div>
          <h2 class="showcase__title">Profile Editor</h2>
          <p class="showcase__desc">A realistic settings card — circular avatar crop alongside form fields. See how CropVue blends into app UI.</p>
        </div>
        <div class="showcase__toggle">
          <button class="toggle-btn" :class="{ 'toggle-btn--active': !showCode['profile-editor'] }" @click="showCode['profile-editor'] = false">Preview</button>
          <button class="toggle-btn" :class="{ 'toggle-btn--active': showCode['profile-editor'] }" @click="showCode['profile-editor'] = true">Code</button>
        </div>
      </div>

      <template v-if="!showCode['profile-editor']">
      <div class="profile-editor">
        <div class="profile-editor__grid">
          <div class="profile-editor__avatar-col">
            <div :style="profileTheme" style="width: 100%">
              <CropVue
                v-if="!profileAvatar"
                stencil="circle"
                :aspect-ratio="1"
                output-format="webp"
                :output-quality="0.9"
                @done="(r: CropResult) => profileAvatar = r"
              >
                <template #dropzone="{ open, isDragging }">
                  <div
                    class="profile-editor__drop"
                    :class="{ 'profile-editor__drop--active': isDragging }"
                    @click="open"
                  >
                    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
                      <circle cx="12" cy="13" r="4"/>
                    </svg>
                    <span>{{ isDragging ? 'Drop photo' : 'Upload photo' }}</span>
                  </div>
                </template>
              </CropVue>
              <div v-else class="profile-editor__avatar-done">
                <img :src="profileAvatar.url" alt="Avatar" class="profile-editor__avatar-img" />
                <button class="profile-editor__change-link" @click="profileAvatar = null">Change photo</button>
              </div>
            </div>
          </div>
          <div class="profile-editor__form-col">
            <div class="profile-editor__field">
              <label class="profile-editor__label">Name</label>
              <input v-model="profileName" type="text" class="profile-editor__input" />
            </div>
            <div class="profile-editor__field">
              <label class="profile-editor__label">Email</label>
              <input v-model="profileEmail" type="email" class="profile-editor__input" />
            </div>
            <div class="profile-editor__field">
              <label class="profile-editor__label">Bio</label>
              <textarea v-model="profileBio" rows="3" class="profile-editor__input profile-editor__textarea"></textarea>
            </div>
          </div>
        </div>
        <div class="profile-editor__actions">
          <button class="btn btn--ghost">Cancel</button>
          <button class="btn btn--cyan" @click="saveProfile">
            {{ profileSaved ? 'Saved!' : 'Save Profile' }}
          </button>
        </div>
      </div>
      </template>

      <div v-else class="snippet">
        <div class="snippet__header">
          <span class="snippet__filename">ProfileEditor.vue</span>
          <button class="snippet__copy" @click="copyCode('profile-editor')">Copy</button>
        </div>
        <div class="snippet__body" v-html="highlightedCode('profile-editor')"></div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- 09 · POST COMPOSER                                      -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <section id="post-composer" class="showcase">
      <div class="showcase__header">
        <span class="showcase__num" style="--accent: var(--magenta)">09</span>
        <div>
          <h2 class="showcase__title">Post Composer</h2>
          <p class="showcase__desc">Blog/social post creator with a 16:9 cover image area. Crop replaces the placeholder inline.</p>
        </div>
        <div class="showcase__toggle">
          <button class="toggle-btn" :class="{ 'toggle-btn--active': !showCode['post-composer'] }" @click="showCode['post-composer'] = false">Preview</button>
          <button class="toggle-btn" :class="{ 'toggle-btn--active': showCode['post-composer'] }" @click="showCode['post-composer'] = true">Code</button>
        </div>
      </div>

      <template v-if="!showCode['post-composer']">
      <div class="post-composer">
        <div class="post-composer__cover-area">
          <CropVue
            v-if="!postCover"
            stencil="rectangle"
            :aspect-ratio="16 / 9"
            output-format="jpeg"
            :output-quality="0.85"
            @done="(r: CropResult) => postCover = r"
          >
            <template #dropzone="{ open, isDragging }">
              <div
                class="post-composer__drop"
                :class="{ 'post-composer__drop--active': isDragging }"
                @click="open"
              >
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
                <span>{{ isDragging ? 'Drop to set cover' : 'Add cover image' }}</span>
                <span class="post-composer__drop-hint">16:9 ratio &middot; Click or drag</span>
              </div>
            </template>
          </CropVue>
          <div v-else class="post-composer__cover-done">
            <img :src="postCover.url" alt="Cover" class="post-composer__cover-img" />
            <button class="post-composer__remove" @click="removePostCover">&times;</button>
          </div>
        </div>
        <div class="post-composer__body">
          <input
            v-model="postTitle"
            type="text"
            class="post-composer__title-input"
            placeholder="Post title..."
          />
          <textarea
            v-model="postBody"
            rows="4"
            class="post-composer__body-input"
            placeholder="Write your post..."
          ></textarea>
          <div class="post-composer__tags">
            <span v-for="tag in postTags" :key="tag" class="post-composer__tag">{{ tag }}</span>
          </div>
        </div>
        <div class="post-composer__actions">
          <button class="btn btn--ghost">Save Draft</button>
          <button class="btn btn--magenta" @click="publishPost">
            {{ postPublished ? 'Published!' : 'Publish' }}
          </button>
        </div>
      </div>
      </template>

      <div v-else class="snippet">
        <div class="snippet__header">
          <span class="snippet__filename">PostComposer.vue</span>
          <button class="snippet__copy" @click="copyCode('post-composer')">Copy</button>
        </div>
        <div class="snippet__body" v-html="highlightedCode('post-composer')"></div>
      </div>
    </section>

    <!-- ═══════════════════════════════════════════════════════ -->
    <!-- 10 · PRODUCT GALLERY                                    -->
    <!-- ═══════════════════════════════════════════════════════ -->
    <section id="product-gallery" class="showcase">
      <div class="showcase__header">
        <span class="showcase__num" style="--accent: var(--emerald)">10</span>
        <div>
          <h2 class="showcase__title">Product Gallery</h2>
          <p class="showcase__desc">E-commerce product card with a shared CropVue instance — one cropper fills multiple image slots.</p>
        </div>
        <div class="showcase__toggle">
          <button class="toggle-btn" :class="{ 'toggle-btn--active': !showCode['product-gallery'] }" @click="showCode['product-gallery'] = false">Preview</button>
          <button class="toggle-btn" :class="{ 'toggle-btn--active': showCode['product-gallery'] }" @click="showCode['product-gallery'] = true">Code</button>
        </div>
      </div>

      <template v-if="!showCode['product-gallery']">
      <div class="product-gallery">
        <div class="product-gallery__images">
          <div
            class="product-gallery__slot product-gallery__slot--hero"
            @click="!productImages[0] ? openProductSlot(0) : undefined"
          >
            <template v-if="productImages[0]">
              <img :src="productImages[0].url" alt="Product main" class="product-gallery__slot-img" />
              <div class="product-gallery__overlay">
                <button class="product-gallery__overlay-btn" @click.stop="openProductSlot(0)">Change</button>
                <button class="product-gallery__overlay-btn product-gallery__overlay-btn--danger" @click.stop="removeProductImage(0)">Remove</button>
              </div>
            </template>
            <div v-else class="product-gallery__placeholder">
              <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              <span>Main photo</span>
            </div>
          </div>
          <div class="product-gallery__thumbs">
            <div
              v-for="i in [1, 2, 3]"
              :key="i"
              class="product-gallery__slot product-gallery__slot--thumb"
              @click="!productImages[i] ? openProductSlot(i) : undefined"
            >
              <template v-if="productImages[i]">
                <img :src="productImages[i]!.url" alt="Product thumbnail" class="product-gallery__slot-img" />
                <div class="product-gallery__overlay">
                  <button class="product-gallery__overlay-btn" @click.stop="openProductSlot(i)">Change</button>
                  <button class="product-gallery__overlay-btn product-gallery__overlay-btn--danger" @click.stop="removeProductImage(i)">Remove</button>
                </div>
              </template>
              <div v-else class="product-gallery__placeholder">
                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              </div>
            </div>
          </div>
        </div>

        <div v-if="showProductCropper" class="product-gallery__cropper">
          <CropVue
            stencil="rectangle"
            :aspect-ratio="1"
            output-format="webp"
            :output-quality="0.9"
            @done="onProductCrop"
          >
            <template #actions="{ confirm, cancel }">
              <div class="product-gallery__cropper-actions">
                <button class="btn btn--ghost" @click="() => { showProductCropper = false; cancel() }">Cancel</button>
                <button class="btn btn--emerald" @click="confirm">Use Photo</button>
              </div>
            </template>
          </CropVue>
        </div>

        <div class="product-gallery__info">
          <h3 class="product-gallery__name">Artisan Ceramic Vase</h3>
          <p class="product-gallery__price">$89.00</p>
          <p class="product-gallery__desc-text">Hand-thrown stoneware vase with reactive glaze finish. Each piece is unique — slight variations in color and texture are part of the charm.</p>
          <button class="btn btn--emerald product-gallery__cta">Add to Cart</button>
        </div>
      </div>
      </template>

      <div v-else class="snippet">
        <div class="snippet__header">
          <span class="snippet__filename">ProductGallery.vue</span>
          <button class="snippet__copy" @click="copyCode('product-gallery')">Copy</button>
        </div>
        <div class="snippet__body" v-html="highlightedCode('product-gallery')"></div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="footer">
      <p>Built with <strong>CropVue</strong> &middot; Vue 3 &middot; No extra dependencies</p>
    </footer>
  </div>
</template>

<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:ital,opsz,wght@0,9..40,100..1000;1,9..40,100..1000&family=Syne:wght@400..800&display=swap');

/* =========================================================
   CUSTOM PROPERTIES
   ========================================================= */
:root {
  --bg: #0c0c0f;
  --surface: #14141a;
  --surface-2: #1a1a22;
  --surface-3: #22222c;
  --border: #2a2a34;
  --border-light: #34343f;
  --text: #e8e8ed;
  --text-dim: #8888a0;
  --text-muted: #55556a;

  --cyan: #00d4ff;
  --cyan-dim: rgba(0, 212, 255, 0.15);
  --magenta: #ff2d8a;
  --magenta-dim: rgba(255, 45, 138, 0.15);
  --amber: #ffb020;
  --amber-dim: rgba(255, 176, 32, 0.15);
  --emerald: #10e080;
  --emerald-dim: rgba(16, 224, 128, 0.15);

  --font-display: 'Syne', sans-serif;
  --font-body: 'DM Sans', sans-serif;
  --nav-h: 56px;
}

/* =========================================================
   RESET & BASE
   ========================================================= */
*, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

html {
  scroll-behavior: smooth;
}

body {
  background: var(--bg);
  color: var(--text);
  font-family: var(--font-body);
  font-size: 15px;
  line-height: 1.6;
  -webkit-font-smoothing: antialiased;
}

code {
  font-family: 'DM Mono', 'SF Mono', monospace;
  font-size: 0.85em;
  padding: 2px 6px;
  background: var(--surface-2);
  border-radius: 4px;
  color: var(--cyan);
}

/* =========================================================
   APP CONTAINER
   ========================================================= */
.app {
  max-width: 960px;
  margin: 0 auto;
  padding: 0 20px 80px;
}

/* =========================================================
   HERO
   ========================================================= */
.hero {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 340px;
  overflow: hidden;
  margin-bottom: 0;
}

.hero__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgba(0, 212, 255, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.06) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 70%);
  -webkit-mask-image: radial-gradient(ellipse 60% 60% at 50% 50%, black 20%, transparent 70%);
  animation: gridDrift 20s linear infinite;
}

@keyframes gridDrift {
  from { background-position: 0 0; }
  to { background-position: 48px 48px; }
}

.hero__content {
  text-align: center;
  animation: fadeSlideUp 0.8s ease-out;
}

.hero__title {
  font-family: var(--font-display);
  font-size: clamp(3.5rem, 8vw, 5.5rem);
  font-weight: 800;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, var(--cyan) 0%, var(--magenta) 100%);
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  line-height: 1.1;
}

.hero__tagline {
  font-family: var(--font-display);
  font-size: clamp(1.1rem, 2.5vw, 1.4rem);
  font-weight: 400;
  color: var(--text-dim);
  margin-top: 12px;
}

.hero__sub {
  font-size: 14px;
  color: var(--text-muted);
  margin-top: 8px;
}

@keyframes fadeSlideUp {
  from { opacity: 0; transform: translateY(24px); }
  to { opacity: 1; transform: translateY(0); }
}

/* =========================================================
   STICKY NAV
   ========================================================= */
.nav {
  position: sticky;
  top: 0;
  z-index: 100;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  padding: 10px 16px;
  margin: 0 -20px 32px;
  background: rgba(12, 12, 15, 0.75);
  backdrop-filter: blur(16px);
  -webkit-backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--border);
}

.nav__pill {
  padding: 6px 14px;
  font-size: 13px;
  font-weight: 500;
  color: var(--text-muted);
  text-decoration: none;
  border-radius: 999px;
  transition: all 200ms ease;
  white-space: nowrap;
}

.nav__pill:hover {
  color: var(--text-dim);
  background: var(--surface-2);
}

.nav__pill--active {
  color: var(--text);
  background: var(--surface-3);
}

/* =========================================================
   SHOWCASE (SECTION) BASE
   ========================================================= */
.showcase {
  margin-bottom: 48px;
  padding: 32px;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 16px;
  scroll-margin-top: calc(var(--nav-h) + 16px);
}

.showcase__header {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  margin-bottom: 24px;
}

.showcase__num {
  flex-shrink: 0;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 700;
  color: var(--accent, var(--cyan));
  background: color-mix(in srgb, var(--accent, var(--cyan)) 12%, transparent);
  padding: 4px 10px;
  border-radius: 6px;
  line-height: 1.4;
}

.showcase__title {
  font-family: var(--font-display);
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
  line-height: 1.3;
}

.showcase__desc {
  color: var(--text-dim);
  font-size: 14px;
  margin-top: 4px;
  line-height: 1.5;
}

/* =========================================================
   SHOWCASE: PREVIEW/CODE TOGGLE
   ========================================================= */
.showcase__toggle {
  margin-left: auto;
  display: flex;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
  flex-shrink: 0;
  align-self: center;
}

.toggle-btn {
  padding: 6px 14px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  background: transparent;
  border: none;
  cursor: pointer;
  transition: all 180ms ease;
}

.toggle-btn:hover {
  color: var(--text-dim);
}

.toggle-btn--active {
  background: var(--surface-3);
  color: var(--text);
}

/* =========================================================
   CODE SNIPPET DISPLAY
   ========================================================= */
.snippet {
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
}

.snippet__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 14px;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

.snippet__filename {
  font-family: 'DM Mono', 'SF Mono', monospace;
  font-size: 12px;
  color: var(--text-dim);
}

.snippet__copy {
  padding: 3px 10px;
  font-family: var(--font-body);
  font-size: 11px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface-3);
  border: 1px solid var(--border);
  border-radius: 5px;
  cursor: pointer;
  transition: all 150ms ease;
}

.snippet__copy:hover {
  color: var(--text);
  border-color: var(--border-light);
}

.snippet__body {
  overflow-x: auto;
}

.snippet__body pre {
  padding: 16px !important;
  margin: 0 !important;
  background: var(--surface) !important;
  font-family: 'DM Mono', 'SF Mono', monospace !important;
  font-size: 13px !important;
  line-height: 1.6 !important;
}

.snippet__body code {
  background: none !important;
  padding: 0 !important;
  border-radius: 0 !important;
  color: inherit !important;
}

/* =========================================================
   SHARED: BUTTONS
   ========================================================= */
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 10px 20px;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--surface-2);
  color: var(--text);
  cursor: pointer;
  transition: all 200ms ease;
  white-space: nowrap;
}

.btn:hover { background: var(--surface-3); }
.btn--sm { padding: 6px 12px; font-size: 12px; }

.btn--cyan { background: var(--cyan); color: #0c0c0f; border-color: var(--cyan); }
.btn--cyan:hover { background: #00b8db; }

.btn--magenta { background: var(--magenta); color: #fff; border-color: var(--magenta); }
.btn--magenta:hover { background: #e0206e; }

.btn--emerald { background: var(--emerald); color: #0c0c0f; border-color: var(--emerald); }
.btn--emerald:hover { background: #0cc56d; }

.btn--amber { background: var(--amber); color: #0c0c0f; border-color: var(--amber); }
.btn--amber:hover { background: #e09a10; }

.btn--ghost { background: transparent; border-color: transparent; color: var(--text-dim); }
.btn--ghost:hover { color: var(--text); background: var(--surface-2); }

.btn--outline { background: transparent; border-color: var(--border-light); color: var(--text-dim); }
.btn--outline:hover { border-color: var(--text-muted); color: var(--text); }

.btn--danger-outline { border-color: rgba(255, 80, 80, 0.3); color: #ff6060; }
.btn--danger-outline:hover { border-color: #ff6060; background: rgba(255, 80, 80, 0.08); }

.btn-row {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-bottom: 8px;
}

/* =========================================================
   SHARED: RESULT DISPLAY
   ========================================================= */
.result {
  padding: 24px;
  text-align: center;
}

.result--center {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.result--compact {
  padding: 16px;
}

.result__img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 10px;
  margin-bottom: 16px;
  border: 1px solid var(--border);
}

.result__img--sm {
  max-height: 180px;
}

.result__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  justify-content: center;
  margin-bottom: 16px;
}

.result__table {
  margin: 0 auto 16px;
  border-collapse: collapse;
  font-size: 13px;
  text-align: left;
}

.result__table td {
  padding: 5px 20px 5px 0;
  border-bottom: 1px solid var(--border);
}

.result__table td:first-child {
  color: var(--text-muted);
  font-weight: 500;
}

/* =========================================================
   SHARED: PILLS / TAGS
   ========================================================= */
.pill {
  display: inline-block;
  padding: 3px 10px;
  font-size: 12px;
  font-weight: 500;
  color: var(--text-dim);
  background: var(--surface-2);
  border-radius: 6px;
}

.pill--sm { padding: 2px 8px; font-size: 11px; }
.pill--magenta { background: var(--magenta-dim); color: var(--magenta); }
.pill--amber { background: var(--amber-dim); color: var(--amber); }

/* =========================================================
   SHARED: STATUS TEXT
   ========================================================= */
.status-text {
  color: var(--text-muted);
  font-style: italic;
  padding: 24px;
  text-align: center;
}

/* =========================================================
   01 · THE BASICS — geometric wireframe
   ========================================================= */
.basics__frame {
  position: relative;
  padding: 2px;
  border-radius: 12px;
}

.basics__corner {
  position: absolute;
  width: 24px;
  height: 24px;
  border-color: var(--cyan);
  border-style: solid;
  border-width: 0;
  opacity: 0.5;
  z-index: 1;
  pointer-events: none;
}

.basics__corner--tl { top: -4px; left: -4px; border-top-width: 2px; border-left-width: 2px; border-top-left-radius: 4px; }
.basics__corner--tr { top: -4px; right: -4px; border-top-width: 2px; border-right-width: 2px; border-top-right-radius: 4px; }
.basics__corner--bl { bottom: -4px; left: -4px; border-bottom-width: 2px; border-left-width: 2px; border-bottom-left-radius: 4px; }
.basics__corner--br { bottom: -4px; right: -4px; border-bottom-width: 2px; border-right-width: 2px; border-bottom-right-radius: 4px; }

/* =========================================================
   02 · AVATAR STUDIO — glassmorphism
   ========================================================= */
.avatar__card {
  background: linear-gradient(135deg, rgba(255, 45, 138, 0.05) 0%, rgba(0, 212, 255, 0.03) 100%);
  border: 1px solid rgba(255, 45, 138, 0.12);
  border-radius: 16px;
  padding: 2px;
  backdrop-filter: blur(8px);
}

.avatar__drop {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  padding: 40px 32px;
  border-radius: 14px;
  cursor: pointer;
  transition: all 250ms ease;
}

.avatar__drop:hover .avatar__circle {
  border-color: var(--magenta);
  box-shadow: 0 0 24px rgba(255, 45, 138, 0.2);
}

.avatar__drop--active .avatar__circle {
  border-color: var(--magenta);
  box-shadow: 0 0 32px rgba(255, 45, 138, 0.3);
  background: rgba(255, 45, 138, 0.06);
}

.avatar__drop-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.avatar__circle {
  width: 96px;
  height: 96px;
  border: 2px dashed var(--border-light);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--text-muted);
  transition: all 300ms ease;
}

.avatar__drop-text {
  text-align: center;
}

.avatar__drop-title {
  display: block;
  font-weight: 600;
  font-size: 15px;
  color: var(--text);
}

.avatar__drop-sub {
  display: block;
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 2px;
}

.avatar__lines {
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 140px;
  opacity: 0.15;
}

.avatar__line {
  height: 8px;
  background: var(--text-dim);
  border-radius: 4px;
}

.avatar__line--short {
  width: 60%;
}

.avatar__result-ring {
  padding: 3px;
  border-radius: 50%;
  background: linear-gradient(135deg, var(--cyan), var(--magenta));
  margin-bottom: 16px;
}

.avatar__result-img {
  display: block;
  width: 128px;
  height: 128px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--surface);
}

/* =========================================================
   03 · FULL CONTROL — terminal aesthetic
   ========================================================= */
.terminal {
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 250ms ease;
}

.terminal:hover,
.terminal--active {
  border-color: var(--emerald);
}

.terminal__bar {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 14px;
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

.terminal__dot {
  width: 11px;
  height: 11px;
  border-radius: 50%;
}

.terminal__dot--red { background: #ff5f57; }
.terminal__dot--yellow { background: #febc2e; }
.terminal__dot--green { background: #28c840; }

.terminal__bar-title {
  margin-left: auto;
  font-size: 12px;
  color: var(--text-muted);
  font-family: 'DM Mono', 'SF Mono', monospace;
}

.terminal__body {
  padding: 32px 24px;
  background: var(--surface);
}

.terminal__line {
  font-family: 'DM Mono', 'SF Mono', monospace;
  font-size: 15px;
  color: var(--emerald);
  display: flex;
  align-items: center;
  gap: 10px;
}

.terminal__prompt {
  color: var(--text-muted);
  user-select: none;
}

.terminal__cursor {
  display: inline-block;
  width: 8px;
  height: 18px;
  background: var(--emerald);
  animation: blink 1s step-end infinite;
}

@keyframes blink {
  50% { opacity: 0; }
}

.terminal__hint {
  font-size: 13px;
  color: var(--text-muted);
  margin-top: 8px;
}

/* Dock toolbar */
.dock {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 8px 12px;
  margin: 8px 0;
  background: rgba(16, 224, 128, 0.04);
  border: 1px solid rgba(16, 224, 128, 0.1);
  border-radius: 12px;
  backdrop-filter: blur(8px);
}

.dock__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border: none;
  background: transparent;
  color: var(--text-dim);
  cursor: pointer;
  border-radius: 8px;
  transition: all 150ms ease;
}

.dock__btn:hover {
  background: rgba(16, 224, 128, 0.1);
  color: var(--emerald);
}

.dock__btn--danger:hover {
  background: rgba(255, 80, 80, 0.1);
  color: #ff6060;
}

.dock__sep {
  width: 1px;
  height: 20px;
  background: var(--border);
  margin: 0 4px;
}

.terminal__actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 12px 0;
}

/* =========================================================
   04 · SHAPE SHIFTER — control dashboard
   ========================================================= */
.controls {
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 16px 20px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 12px;
  margin-bottom: 16px;
}

.controls__row {
  display: flex;
  align-items: center;
  gap: 16px;
}

.controls__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-muted);
  min-width: 64px;
  flex-shrink: 0;
}

.controls__pills {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.pill-btn {
  padding: 5px 14px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  color: var(--text-muted);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 999px;
  cursor: pointer;
  transition: all 180ms ease;
}

.pill-btn:hover {
  color: var(--text);
  border-color: var(--border-light);
}

.pill-btn--active {
  background: var(--amber);
  color: #0c0c0f;
  border-color: var(--amber);
}

.controls__slider {
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
}

.controls__value {
  font-family: 'DM Mono', 'SF Mono', monospace;
  font-size: 13px;
  color: var(--amber);
  min-width: 40px;
}

.range-input {
  -webkit-appearance: none;
  appearance: none;
  flex: 1;
  max-width: 200px;
  height: 4px;
  background: var(--border);
  border-radius: 2px;
  outline: none;
}

.range-input::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: 16px;
  height: 16px;
  background: var(--amber);
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid var(--surface);
  box-shadow: 0 0 8px rgba(255, 176, 32, 0.3);
}

.range-input::-moz-range-thumb {
  width: 16px;
  height: 16px;
  background: var(--amber);
  border-radius: 50%;
  cursor: pointer;
  border: 2px solid var(--surface);
}

/* =========================================================
   05 · UNDER THE HOOD — blueprint aesthetic
   ========================================================= */
.showcase--blueprint {
  background:
    linear-gradient(rgba(0, 212, 255, 0.02) 1px, transparent 1px),
    linear-gradient(90deg, rgba(0, 212, 255, 0.02) 1px, transparent 1px),
    var(--surface);
  background-size: 20px 20px, 20px 20px, 100%;
}

.file-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  font-family: var(--font-body);
  font-size: 14px;
  font-weight: 600;
  color: var(--cyan);
  background: var(--cyan-dim);
  border: 1px solid rgba(0, 212, 255, 0.2);
  border-radius: 8px;
  cursor: pointer;
  transition: all 200ms ease;
  margin-bottom: 16px;
}

.file-btn:hover {
  background: rgba(0, 212, 255, 0.2);
  border-color: rgba(0, 212, 255, 0.35);
}

.blueprint__controls {
  margin: 12px 0;
}

.code-block {
  margin-top: 12px;
  border: 1px solid var(--border);
  border-radius: 8px;
  overflow: hidden;
}

.code-block__header {
  padding: 6px 12px;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--text-muted);
  background: var(--surface-2);
  border-bottom: 1px solid var(--border);
}

.code-block pre {
  padding: 12px;
  font-family: 'DM Mono', 'SF Mono', monospace;
  font-size: 12px;
  line-height: 1.5;
  color: var(--text-dim);
  overflow-x: auto;
  background: var(--surface);
}

/* =========================================================
   06 · THEME GALLERY
   ========================================================= */
.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

.theme-card {
  border: 1px solid var(--border);
  border-radius: 12px;
  overflow: hidden;
  transition: transform 250ms ease, box-shadow 250ms ease;
}

.theme-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 32px rgba(0, 0, 0, 0.3), 0 0 0 1px var(--card-accent, var(--border));
}

.theme-card__accent {
  height: 3px;
  background: var(--card-accent);
}

.theme-card__name {
  padding: 12px 14px 8px;
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  color: var(--text);
  background: var(--surface-2);
}

.theme-card__body {
  background: var(--surface);
}

/* =========================================================
   07 · STANDALONE PARTS — bento grid
   ========================================================= */
.bento {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.bento__item {
  padding: 20px;
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 12px;
}

.bento__item--url {
  grid-column: 1 / -1;
}

.bento__label {
  font-family: var(--font-display);
  font-size: 14px;
  font-weight: 600;
  color: var(--text-dim);
  margin-bottom: 12px;
}

/* Rainbow dropzone */
.rainbow-drop {
  position: relative;
  border-radius: 12px;
  padding: 2px;
  background: conic-gradient(
    from 0deg,
    #ff0080, #ff8c00, #40e0d0, #7b68ee, #ff0080
  );
  cursor: pointer;
  animation: rainbowSpin 4s linear infinite;
}

.rainbow-drop--active {
  animation-duration: 1s;
}

@keyframes rainbowSpin {
  to { filter: hue-rotate(360deg); }
}

.rainbow-drop__inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 28px 16px;
  background: var(--surface-2);
  border-radius: 10px;
  color: var(--text-dim);
  font-size: 13px;
  transition: background 200ms ease;
}

.rainbow-drop:hover .rainbow-drop__inner {
  background: var(--surface-3);
}

.bento__files {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-top: 10px;
}

/* Toolbar wrap */
.bento__toolbar-wrap {
  border-radius: 8px;
  overflow: hidden;
}

.bento__log {
  display: flex;
  flex-direction: column;
  gap: 2px;
  margin-top: 10px;
}

.bento__log-entry {
  font-family: 'DM Mono', 'SF Mono', monospace;
  font-size: 11px;
  color: var(--text-muted);
  padding: 2px 0;
}

/* URL input */
.url-row {
  margin-bottom: 12px;
}

.url-input {
  width: 100%;
  padding: 10px 14px;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  outline: none;
  transition: border-color 200ms ease, box-shadow 200ms ease;
}

.url-input::placeholder {
  color: var(--text-muted);
}

.url-input:focus {
  border-color: var(--emerald);
  box-shadow: 0 0 0 3px rgba(16, 224, 128, 0.1);
}

/* =========================================================
   08 · PROFILE EDITOR — settings card
   ========================================================= */
.profile-editor {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
}

.profile-editor__grid {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: 28px;
  padding: 28px;
}

.profile-editor__avatar-col {
  display: flex;
  flex-direction: column;
  align-items: center;
  min-width: 0;
  overflow: hidden;
}

.profile-editor__drop {
  width: 120px;
  height: 120px;
  border: 2px dashed var(--border-light);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  color: var(--text-muted);
  font-size: 12px;
  cursor: pointer;
  transition: all 250ms ease;
}

.profile-editor__drop:hover {
  border-color: var(--cyan);
  color: var(--cyan);
}

.profile-editor__drop--active {
  border-color: var(--cyan);
  background: rgba(6, 182, 212, 0.06);
  color: var(--cyan);
}

.profile-editor__avatar-done {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
}

.profile-editor__avatar-img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 3px solid var(--border);
}

.profile-editor__change-link {
  background: none;
  border: none;
  color: var(--cyan);
  font-family: var(--font-body);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.profile-editor__change-link:hover {
  color: #00b8db;
}

.profile-editor__form-col {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.profile-editor__field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.profile-editor__label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-dim);
}

.profile-editor__input {
  width: 100%;
  padding: 10px 14px;
  font-family: var(--font-body);
  font-size: 14px;
  color: var(--text);
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 8px;
  outline: none;
  transition: border-color 200ms ease, box-shadow 200ms ease;
}

.profile-editor__input:focus {
  border-color: var(--cyan);
  box-shadow: 0 0 0 3px rgba(6, 182, 212, 0.1);
}

.profile-editor__textarea {
  resize: vertical;
  min-height: 60px;
}

.profile-editor__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 28px;
  border-top: 1px solid var(--border);
}

/* =========================================================
   09 · POST COMPOSER — blog/social card
   ========================================================= */
.post-composer {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
}

.post-composer__cover-area {
  border-bottom: 1px solid var(--border);
}

.post-composer__drop {
  aspect-ratio: 16 / 9;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--text-muted);
  cursor: pointer;
  transition: all 250ms ease;
  background: var(--surface);
}

.post-composer__drop:hover {
  color: var(--magenta);
  background: rgba(255, 45, 138, 0.03);
}

.post-composer__drop--active {
  color: var(--magenta);
  background: rgba(255, 45, 138, 0.06);
}

.post-composer__drop span {
  font-size: 14px;
  font-weight: 500;
}

.post-composer__drop-hint {
  font-size: 12px !important;
  font-weight: 400 !important;
  color: var(--text-muted) !important;
}

.post-composer__cover-done {
  position: relative;
}

.post-composer__cover-img {
  display: block;
  width: 100%;
  aspect-ratio: 16 / 9;
  object-fit: cover;
}

.post-composer__remove {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: none;
  background: rgba(12, 12, 15, 0.7);
  color: #fff;
  font-size: 18px;
  line-height: 1;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  backdrop-filter: blur(8px);
  transition: all 150ms ease;
}

.post-composer__remove:hover {
  background: rgba(255, 45, 138, 0.8);
}

.post-composer__body {
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.post-composer__title-input {
  font-family: var(--font-display);
  font-size: 22px;
  font-weight: 700;
  color: var(--text);
  background: none;
  border: none;
  outline: none;
  padding: 0;
  width: 100%;
}

.post-composer__title-input::placeholder {
  color: var(--text-muted);
}

.post-composer__body-input {
  font-family: var(--font-body);
  font-size: 15px;
  color: var(--text);
  background: none;
  border: none;
  outline: none;
  resize: vertical;
  padding: 0;
  width: 100%;
  line-height: 1.6;
}

.post-composer__body-input::placeholder {
  color: var(--text-muted);
}

.post-composer__tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  margin-top: 4px;
}

.post-composer__tag {
  padding: 4px 12px;
  font-size: 12px;
  font-weight: 500;
  color: var(--magenta);
  background: var(--magenta-dim);
  border-radius: 999px;
}

.post-composer__actions {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
}

/* =========================================================
   10 · PRODUCT GALLERY — e-commerce card
   ========================================================= */
.product-gallery {
  background: var(--surface-2);
  border: 1px solid var(--border);
  border-radius: 14px;
  overflow: hidden;
}

.product-gallery__images {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px;
}

.product-gallery__slot {
  position: relative;
  aspect-ratio: 1;
  background: var(--surface);
  border: 1px solid var(--border);
  border-radius: 10px;
  overflow: hidden;
  cursor: pointer;
  transition: border-color 200ms ease;
}

.product-gallery__slot:hover {
  border-color: var(--border-light);
}

.product-gallery__slot--hero {
  width: 100%;
  aspect-ratio: 1;
}

.product-gallery__thumbs {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.product-gallery__slot--thumb {
  aspect-ratio: 1;
}

.product-gallery__slot-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.product-gallery__placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  height: 100%;
  color: var(--text-muted);
  font-size: 12px;
}

.product-gallery__overlay {
  position: absolute;
  inset: 0;
  background: rgba(12, 12, 15, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  opacity: 0;
  transition: opacity 200ms ease;
}

.product-gallery__slot:hover .product-gallery__overlay {
  opacity: 1;
}

.product-gallery__overlay-btn {
  padding: 6px 14px;
  font-family: var(--font-body);
  font-size: 12px;
  font-weight: 600;
  border: 1px solid rgba(255, 255, 255, 0.3);
  border-radius: 6px;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  cursor: pointer;
  backdrop-filter: blur(4px);
  transition: all 150ms ease;
}

.product-gallery__overlay-btn:hover {
  background: rgba(255, 255, 255, 0.2);
}

.product-gallery__overlay-btn--danger:hover {
  background: rgba(255, 80, 80, 0.6);
  border-color: rgba(255, 80, 80, 0.6);
}

.product-gallery__cropper {
  padding: 16px;
  border-top: 1px solid var(--border);
  border-bottom: 1px solid var(--border);
}

.product-gallery__cropper-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding: 12px 0;
}

.product-gallery__info {
  padding: 24px;
}

.product-gallery__name {
  font-family: var(--font-display);
  font-size: 20px;
  font-weight: 700;
  color: var(--text);
}

.product-gallery__price {
  font-family: var(--font-display);
  font-size: 24px;
  font-weight: 700;
  color: var(--emerald);
  margin-top: 6px;
}

.product-gallery__desc-text {
  font-size: 14px;
  color: var(--text-dim);
  line-height: 1.6;
  margin-top: 12px;
}

.product-gallery__cta {
  margin-top: 20px;
  width: 100%;
}

/* =========================================================
   FOOTER
   ========================================================= */
.footer {
  text-align: center;
  padding: 40px 0 0;
  color: var(--text-muted);
  font-size: 13px;
}

.footer strong {
  color: var(--text-dim);
}

/* =========================================================
   RESPONSIVE
   ========================================================= */
@media (max-width: 768px) {
  .app {
    padding: 0 12px 60px;
  }

  .hero { min-height: 260px; }
  .hero__title { font-size: 3rem; }

  .nav {
    gap: 3px;
    padding: 8px 10px;
    margin: 0 -12px 24px;
    overflow-x: auto;
    justify-content: flex-start;
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .nav::-webkit-scrollbar { display: none; }
  .nav__pill {
    padding: 5px 10px;
    font-size: 12px;
  }

  .showcase {
    padding: 20px;
    margin-bottom: 32px;
  }

  .showcase__header {
    flex-wrap: wrap;
    gap: 8px;
  }

  .showcase__toggle {
    margin-left: 0;
  }

  .theme-grid {
    grid-template-columns: 1fr;
  }

  .bento {
    grid-template-columns: 1fr;
  }

  .bento__item--url {
    grid-column: 1;
  }

  .controls__row {
    flex-direction: column;
    align-items: flex-start;
    gap: 6px;
  }

  .controls__label {
    min-width: auto;
  }

  .avatar__drop {
    padding: 28px 20px;
  }

  .profile-editor__grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .profile-editor__avatar-col {
    justify-self: center;
  }

  .profile-editor__actions {
    padding: 16px 20px;
  }

  .post-composer__body {
    padding: 16px;
  }

  .post-composer__title-input {
    font-size: 18px;
  }

  .post-composer__actions {
    padding: 12px 16px;
  }
}
</style>
