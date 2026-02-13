import { test, expect } from '@playwright/test'

test.describe('Dropzone', () => {
  test('dropzone is visible', async ({ page }) => {
    await page.goto('/')
    const dropzone = page.locator('.custom-dropzone')
    await expect(dropzone).toBeVisible()
    await expect(dropzone).toContainText('Drop an image here or click to browse')
  })

  test('dropzone has correct styling', async ({ page }) => {
    await page.goto('/')
    const dropzone = page.locator('.custom-dropzone')
    const border = await dropzone.evaluate((el) =>
      window.getComputedStyle(el).borderStyle
    )
    expect(border).toBe('dashed')
  })
})
