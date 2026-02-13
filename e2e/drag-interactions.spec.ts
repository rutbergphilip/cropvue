import { test, expect } from '@playwright/test'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

async function loadImageInSection(page: import('@playwright/test').Page, sectionId: string) {
  // Navigate to the section
  await page.goto(`/#${sectionId}`)

  // Find the dropzone in the section and click it to open file dialog
  const section = page.locator(`#${sectionId}`)

  // Use the file chooser approach: click dropzone and set file
  const [fileChooser] = await Promise.all([
    page.waitForEvent('filechooser'),
    section.locator('.cropvue__dropzone, .custom-dropzone, .avatar-dropzone').first().click(),
  ])
  await fileChooser.setFiles(path.join(__dirname, 'fixtures', 'test-image.png'))

  // Wait for editor to appear
  await expect(section.locator('.cropvue-editor')).toBeVisible({ timeout: 5000 })
}

test.describe('Drag interactions', () => {
  test('dragging on editor background pans the image', async ({ page }) => {
    await page.goto('/')
    await loadImageInSection(page, 'simple')

    const editor = page.locator('#simple .cropvue-editor__viewport')

    // Get the initial transform state text (may not be visible in default CropVue,
    // so we read the image transform style instead)
    const imgBefore = await page.locator('#simple .cropvue-editor__image').getAttribute('style')

    // Perform a drag: mouse down, move, mouse up
    const box = await editor.boundingBox()
    if (!box) throw new Error('Editor not visible')

    const startX = box.x + box.width / 2
    const startY = box.y + box.height / 2

    await page.mouse.move(startX, startY)
    await page.mouse.down()
    await page.mouse.move(startX + 50, startY + 30, { steps: 5 })
    await page.mouse.up()

    // Check that the image transform style changed (translate values should differ)
    const imgAfter = await page.locator('#simple .cropvue-editor__image').getAttribute('style')
    expect(imgAfter).not.toBe(imgBefore)
  })

  test('dragging a corner handle resizes the crop box', async ({ page }) => {
    await page.goto('/')

    // Use composable section which shows crop state in a pre element
    const section = page.locator('#composable')
    const fileInput = section.locator('input[type="file"]')
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-image.png'))
    await page.waitForTimeout(200)
    await expect(section.locator('.cropvue-editor')).toBeVisible({ timeout: 5000 })

    // Scroll the editor into view so mouse coordinates are reachable
    await section.locator('.cropvue-editor').scrollIntoViewIfNeeded()
    await page.waitForTimeout(100)

    // Read initial crop state
    const cropStateBefore = await section.locator('pre').nth(1).textContent()

    // Get the crop area bounding box to find the SE corner
    const cropArea = section.locator('.cropvue-editor__crop-area')
    const cropBox = await cropArea.boundingBox()
    if (!cropBox) throw new Error('Crop area not visible')

    // Drag the SE corner INWARD (crop is already at max bounds = image size)
    const hx = cropBox.x + cropBox.width
    const hy = cropBox.y + cropBox.height

    await page.mouse.move(hx, hy)
    await page.mouse.down()
    await page.mouse.move(hx - 30, hy - 30, { steps: 5 })
    await page.mouse.up()

    await page.waitForTimeout(200)

    // Crop state should have changed
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

    // Scroll up to zoom in
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.mouse.wheel(0, -300)

    // Wait for update
    await page.waitForTimeout(100)

    const imgAfter = await page.locator('#simple .cropvue-editor__image').getAttribute('style')
    expect(imgAfter).not.toBe(imgBefore)
  })

  test('arrow keys pan the image in composable section', async ({ page }) => {
    await page.goto('/')

    // Use Section 5 (composable) which shows transform state
    const section = page.locator('#composable')
    const fileInput = section.locator('input[type="file"]')
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-image.png'))
    await page.waitForTimeout(200)

    // Wait for editor
    await expect(section.locator('.cropvue-editor')).toBeVisible({ timeout: 5000 })

    // Focus the viewport
    const viewport = section.locator('.cropvue-editor__viewport')
    await viewport.focus()

    // Read initial transform state from pre display
    const stateBefore = await section.locator('pre').first().textContent()
    expect(stateBefore).toContain('"x": 0')

    // Press arrow key multiple times
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('ArrowRight')
    }

    // Verify x changed in displayed state
    const stateAfter = await section.locator('pre').first().textContent()
    expect(stateAfter).not.toContain('"x": 0')
  })
})
