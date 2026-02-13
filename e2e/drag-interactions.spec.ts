import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function loadImageInSection(page: import('@playwright/test').Page, sectionId: string) {
  await page.goto(`/#${sectionId}`)
  const section = page.locator(`#${sectionId}`)

  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    section.locator('.cropvue__dropzone, .custom-dropzone, .avatar-dropzone').first().click(),
  ])
  await fileChooser.setFiles(path.join(__dirname, 'fixtures', 'test-image.png'))
  await expect(section.locator('.cropvue-editor')).toBeVisible({ timeout: 5000 })
}

test.describe('Drag interactions', () => {
  test('dragging on editor background pans the image', async ({ page }) => {
    await page.goto('/')
    await loadImageInSection(page, 'simple')

    const editor = page.locator('#simple .cropvue-editor__viewport')

    const imgBefore = await page.locator('#simple .cropvue-editor__image').getAttribute('style')

    const box = await editor.boundingBox()
    if (!box) throw new Error('Editor not visible')

    // Start outside the crop box to trigger pan (not crop-move)
    const startX = box.x + 10
    const startY = box.y + 10

    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX + 50, startY + 30, { steps: 5 })
    await page.mouse.up()

    const imgAfter = await page.locator('#simple .cropvue-editor__image').getAttribute('style')
    expect(imgAfter).not.toBe(imgBefore)
  })

  test('dragging a corner handle resizes the crop box', async ({ page }) => {
    await page.goto('/')

    const section = page.locator('#composable')
    const fileInput = section.locator('input[type="file"]')
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-image.png'))
    await page.waitForTimeout(200)
    await expect(section.locator('.cropvue-editor')).toBeVisible({ timeout: 5000 })

    await section.locator('.cropvue-editor').scrollIntoViewIfNeeded()
    await page.waitForTimeout(100)

    const cropStateBefore = await section.locator('pre').nth(1).textContent()

    const cropArea = section.locator('.cropvue-editor__crop-area')
    const cropBox = await cropArea.boundingBox()
    if (!cropBox) throw new Error('Crop area not visible')

    // Drag SE corner inward
    const hx = cropBox.x + cropBox.width
    const hy = cropBox.y + cropBox.height

    await page.mouse.move(hx, hy)
    await page.mouse.down()
    await page.mouse.move(hx - 30, hy - 30, { steps: 5 })
    await page.mouse.up()

    await page.waitForTimeout(200)

    const cropStateAfter = await section.locator('pre').nth(1).textContent()
    expect(cropStateAfter).not.toBe(cropStateBefore)
  })

  test('mouse wheel zooms in/out', async ({ page }) => {
    await page.goto('/')
    await loadImageInSection(page, 'simple')

    const editor = page.locator('#simple .cropvue-editor__viewport')
    const imgBefore = await page.locator('#simple .cropvue-editor__image').getAttribute('style')

    const box = await editor.boundingBox()
    if (!box) throw new Error('Editor not visible')

    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.wheel(0, -300)
    await page.waitForTimeout(100)

    const imgAfter = await page.locator('#simple .cropvue-editor__image').getAttribute('style')
    expect(imgAfter).not.toBe(imgBefore)
  })

  test('arrow keys pan the image in composable section', async ({ page }) => {
    await page.goto('/')

    const section = page.locator('#composable')
    const fileInput = section.locator('input[type="file"]')
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-image.png'))
    await page.waitForTimeout(200)
    await expect(section.locator('.cropvue-editor')).toBeVisible({ timeout: 5000 })

    const viewport = section.locator('.cropvue-editor__viewport')
    await viewport.focus()

    const stateBefore = await section.locator('pre').first().textContent()
    expect(stateBefore).toContain('"x": 0')

    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowRight')
    }

    const stateAfter = await section.locator('pre').first().textContent()
    expect(stateAfter).not.toContain('"x": 0')
  })
})
