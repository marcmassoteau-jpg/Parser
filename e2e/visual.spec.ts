import { test, expect } from '@playwright/test'

test.describe('Visual Parser - Desktop', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display empty state on initial load', async ({ page }) => {
    await expect(page.getByText('Welcome to Visual Parser')).toBeVisible()
    await expect(page.getByText('Upload a file or try a sample')).toBeVisible()
  })

  test('should show header with logo and upload button', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'Visual Parser' })).toBeVisible()
    await expect(page.getByText('Upload')).toBeVisible()
  })

  test('should display sidebar with parser type options', async ({ page }) => {
    await expect(page.getByText('Parser Type')).toBeVisible()
    await expect(page.getByRole('button', { name: /CSV/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Fixed Width/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /SWIFT FIN/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /ISO 20022/i })).toBeVisible()
    await expect(page.getByRole('button', { name: /Custom/i })).toBeVisible()
  })

  test('should load CSV sample and display parsed data', async ({ page }) => {
    await page.getByRole('button', { name: 'CSV Sample' }).click()

    // Wait for parsing to complete
    await expect(page.getByText('Source Data')).toBeVisible({ timeout: 5000 })
    await expect(page.getByText('Headers')).toBeVisible()
    await expect(page.getByText('Output')).toBeVisible()
  })

  test('should load SWIFT MT103 sample', async ({ page }) => {
    await page.getByRole('button', { name: 'SWIFT MT103' }).click()

    await expect(page.getByText('Source Data')).toBeVisible({ timeout: 5000 })
  })

  test('should load ISO 20022 sample', async ({ page }) => {
    await page.getByRole('button', { name: 'ISO 20022' }).click()

    await expect(page.getByText('Source Data')).toBeVisible({ timeout: 5000 })
  })

  test('should switch between Configuration, Preview, and Mapping tabs', async ({ page }) => {
    // Load sample data first
    await page.getByRole('button', { name: 'CSV Sample' }).click()
    await expect(page.getByText('Source Data')).toBeVisible({ timeout: 5000 })

    // Check Configuration tab is active by default
    await expect(page.getByRole('button', { name: 'Configuration' })).toBeVisible()

    // Switch to Preview tab
    await page.getByRole('button', { name: 'Preview' }).click()
    await expect(page.getByText('Total Records')).toBeVisible()

    // Switch to Mapping tab
    await page.getByRole('button', { name: 'Mapping' }).click()
    await expect(page.getByText('Field Mappings')).toBeVisible()
  })

  test('should show help dialog', async ({ page }) => {
    await page.getByTitle('Help').click()
    await expect(page.getByText('Getting Started')).toBeVisible()
    await expect(page.getByText('Upload a file')).toBeVisible()
  })

  test('should switch parser type from sidebar', async ({ page }) => {
    // Click on Fixed Width parser type
    await page.getByRole('button', { name: /Fixed Width/i }).click()

    // Verify the format badge updates
    await expect(page.getByText('fixed-width')).toBeVisible()
  })

  test('should take screenshot of empty state', async ({ page }) => {
    await expect(page).toHaveScreenshot('empty-state.png', {
      maxDiffPixels: 100,
    })
  })

  test('should take screenshot with CSV data loaded', async ({ page }) => {
    await page.getByRole('button', { name: 'CSV Sample' }).click()
    await expect(page.getByText('Source Data')).toBeVisible({ timeout: 5000 })

    // Wait for animations to complete
    await page.waitForTimeout(500)

    await expect(page).toHaveScreenshot('csv-loaded.png', {
      maxDiffPixels: 100,
    })
  })
})

test.describe('Visual Parser - Mobile', () => {
  test.use({ viewport: { width: 375, height: 667 } })

  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should display mobile-friendly layout', async ({ page }) => {
    // Should show hamburger menu on mobile
    await expect(page.locator('button').filter({ has: page.locator('svg') }).first()).toBeVisible()
  })

  test('should open sidebar on menu click', async ({ page }) => {
    // Click hamburger menu
    await page.locator('button').filter({ has: page.locator('svg') }).first().click()

    // Sidebar should be visible
    await expect(page.getByText('Parser Settings')).toBeVisible()
  })

  test('should show bottom navigation on mobile', async ({ page }) => {
    // Load some data first
    await page.getByRole('button', { name: 'CSV Sample' }).click()
    await page.waitForTimeout(1000)

    // Bottom nav should have Panel button
    await expect(page.getByRole('button', { name: /Panel|Close/i })).toBeVisible()
  })

  test('should take mobile screenshot', async ({ page }) => {
    await expect(page).toHaveScreenshot('mobile-empty-state.png', {
      maxDiffPixels: 100,
    })
  })
})

test.describe('Visual Parser - Tablet', () => {
  test.use({ viewport: { width: 768, height: 1024 } })

  test('should display tablet layout', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('Welcome to Visual Parser')).toBeVisible()
  })
})

test.describe('Visual Parser - Accessibility', () => {
  test('should have proper focus management', async ({ page }) => {
    await page.goto('/')

    // Tab through the interface
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')

    // Check that focus is visible
    const focusedElement = page.locator(':focus')
    await expect(focusedElement).toBeVisible()
  })

  test('should have accessible button labels', async ({ page }) => {
    await page.goto('/')

    // Check that buttons have accessible names
    const uploadButton = page.getByRole('button', { name: /upload/i })
    await expect(uploadButton).toBeVisible()
  })
})
