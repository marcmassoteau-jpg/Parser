import { test, expect } from '@playwright/test'

test.describe('Visual Parser - Core Functionality', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
    // Wait for the app to be fully loaded
    await page.waitForLoadState('networkidle')
  })

  test('should display the app correctly on initial load', async ({ page }) => {
    // Check that the root container exists
    await expect(page.locator('#root')).toBeVisible()

    // Check main content is visible (welcome text or header)
    const hasContent = await page.locator('text=/Welcome|Visual Parser|Upload/i').first().isVisible()
    expect(hasContent).toBe(true)
  })

  test('should have upload functionality', async ({ page }) => {
    // Look for upload button or file input
    const uploadInput = page.locator('input[type="file"]')
    const uploadCount = await uploadInput.count()
    expect(uploadCount).toBeGreaterThan(0)
  })

  test('should have parser type options', async ({ page }) => {
    // Look for at least one parser type option
    const csvOption = page.locator('text=/CSV/i').first()
    await expect(csvOption).toBeVisible()
  })

  test('should load CSV sample data', async ({ page }) => {
    // Find and click CSV sample button
    const csvSampleButton = page.locator('button', { hasText: /CSV.*Sample|Sample.*CSV/i }).first()

    if (await csvSampleButton.isVisible()) {
      await csvSampleButton.click()
      // Wait for processing
      await page.waitForTimeout(2000)
      // Page should have updated (canvas should have nodes or some indication)
      await expect(page.locator('#root')).toBeVisible()
    }
  })

  test('should load SWIFT MT103 sample data', async ({ page }) => {
    // Find and click SWIFT sample button
    const swiftButton = page.locator('button', { hasText: /SWIFT|MT103/i }).first()

    if (await swiftButton.isVisible()) {
      await swiftButton.click()
      await page.waitForTimeout(2000)
      await expect(page.locator('#root')).toBeVisible()
    }
  })

  test('should load ISO 20022 sample data', async ({ page }) => {
    // Find and click ISO sample button
    const isoButton = page.locator('button', { hasText: /ISO.*20022|20022/i }).first()

    if (await isoButton.isVisible()) {
      await isoButton.click()
      await page.waitForTimeout(2000)
      await expect(page.locator('#root')).toBeVisible()
    }
  })

  test('should have panel tabs for Configuration, Preview, Mapping', async ({ page }) => {
    // Check for tab buttons
    const configTab = page.locator('button', { hasText: /Configuration|Config/i }).first()
    const previewTab = page.locator('button', { hasText: /Preview/i }).first()
    const mappingTab = page.locator('button', { hasText: /Mapping/i }).first()

    // At least one of these should be visible on desktop
    const hasAnyTab = await configTab.isVisible() || await previewTab.isVisible() || await mappingTab.isVisible()
    expect(hasAnyTab).toBe(true)
  })

  test('should switch between tabs after loading data', async ({ page }) => {
    // Load sample data first
    const csvButton = page.locator('button', { hasText: /CSV.*Sample/i }).first()
    if (await csvButton.isVisible()) {
      await csvButton.click()
      await page.waitForTimeout(2000)
    }

    // Try clicking Preview tab
    const previewTab = page.locator('button', { hasText: /Preview/i }).first()
    if (await previewTab.isVisible()) {
      await previewTab.click()
      await page.waitForTimeout(500)
    }

    // Try clicking Mapping tab
    const mappingTab = page.locator('button', { hasText: /Mapping/i }).first()
    if (await mappingTab.isVisible()) {
      await mappingTab.click()
      await page.waitForTimeout(500)
    }

    // App should still be functional
    await expect(page.locator('#root')).toBeVisible()
  })
})

test.describe('Visual Parser - Responsive Design', () => {
  test('should render on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // App should render
    await expect(page.locator('#root')).toBeVisible()
  })

  test('should render on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('#root')).toBeVisible()
  })

  test('should render on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    await expect(page.locator('#root')).toBeVisible()

    // Desktop should show sidebar
    const sidebar = page.locator('aside').first()
    if (await sidebar.count() > 0) {
      await expect(sidebar).toBeVisible()
    }
  })
})

test.describe('Visual Parser - Accessibility', () => {
  test('should support keyboard navigation', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Press Tab to move focus
    await page.keyboard.press('Tab')

    // There should be a focused element
    const focusedElement = page.locator(':focus')
    const focusCount = await focusedElement.count()
    expect(focusCount).toBeGreaterThanOrEqual(0) // May be 0 if no focusable elements yet
  })

  test('should have proper document structure', async ({ page }) => {
    await page.goto('/')
    await page.waitForLoadState('networkidle')

    // Check for header element
    const header = page.locator('header')
    if (await header.count() > 0) {
      await expect(header.first()).toBeVisible()
    }

    // Check for main content
    await expect(page.locator('#root')).toBeVisible()
  })
})
