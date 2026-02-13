import { test, expect } from '@playwright/test'
import path from 'path'

test.describe('Basic crop flow', () => {
  test('loads playground page', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('h1')).toContainText('CropVue Playground')
  })

  test('shows dropzone on load', async ({ page }) => {
    await page.goto('/')
    await expect(page.locator('.custom-dropzone')).toBeVisible()
  })

  test('advanced: loads file and shows controls', async ({ page }) => {
    await page.goto('/')

    // Open advanced section
    await page.getByText('Show Advanced').click()

    // Upload a test image via file input
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-image.png'))

    // Wait for image to load and controls to appear
    await expect(page.getByText('Rotate Left')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Scale:')).toBeVisible()
  })

  test('advanced: transform controls work', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Show Advanced').click()

    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles(path.join(__dirname, 'fixtures', 'test-image.png'))
    await expect(page.getByText('Rotate Left')).toBeVisible({ timeout: 5000 })

    // Rotate right
    await page.getByText('Rotate Right').click()
    await expect(page.getByText('Rotation: 90')).toBeVisible()

    // Zoom in
    await page.getByText('Zoom In').click()
    // Scale should be > 1
    const scaleText = await page.getByText(/Scale:/).textContent()
    expect(scaleText).toContain('1.1')

    // Reset
    await page.getByText('Reset').click()
    await expect(page.getByText('Rotation: 0')).toBeVisible()
  })
})
