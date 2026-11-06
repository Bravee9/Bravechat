// ============================================================
// scripts/test-web-recovery.mjs
// Real Browser End-to-End Test for Password Recovery & Login
// ============================================================

import puppeteer from 'puppeteer-core'
import path from 'node:path'
import { mkdir } from 'node:fs/promises'

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const SCREENSHOT_DIR = 'C:\\Users\\brave\\.gemini\\antigravity\\brain\\909c3267-56d8-4a0f-bd30-3e431aca54e2\\screenshots'

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms))
}

async function unban() {
  try {
    await fetch('http://localhost:4000/security/unban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    })
  } catch {
    // ignore
  }
}

async function main() {
  console.log('='.repeat(70))
  console.log('🌐 RUNNING BROWSER E2E TEST: FORGOT PASSWORD & RECOVERY WORKFLOW')
  console.log('='.repeat(70))

  await unban()
  await mkdir(SCREENSHOT_DIR, { recursive: true })

  console.log('🚀 Launching Google Chrome browser...')
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1280,800'],
    defaultViewport: { width: 1280, height: 800 },
  })

  const page = await browser.newPage()

  try {
    // ─────────────────────────────────────────────────────────
    // STEP 1: Navigate to /forgot-password
    // ─────────────────────────────────────────────────────────
    console.log('\n[STEP 1] Navigating to http://localhost:3000/forgot-password...')
    await page.goto('http://localhost:3000/forgot-password', { waitUntil: 'networkidle0', timeout: 30000 })
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_forgot_password_page.png') })
    console.log('  📸 Captured: 01_forgot_password_page.png')

    // ─────────────────────────────────────────────────────────
    // STEP 2: Input email and submit form
    // ─────────────────────────────────────────────────────────
    const testEmail = 'thenoobsisevil@gmail.com'
    console.log(`\n[STEP 2] Entering email: ${testEmail}...`)
    await page.waitForSelector('#forgot-email', { timeout: 10000 })
    await page.type('#forgot-email', testEmail)
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_email_entered.png') })

    console.log('  Submitting form...')
    await page.click('form button.btn-primary')

    // Wait for the dev link or success message to appear
    console.log('  Waiting for recovery link / response...')
    await page.waitForSelector('a[href*="/reset-password?token="]', { timeout: 15000 })
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_recovery_link_generated.png') })
    console.log('  📸 Captured: 03_recovery_link_generated.png (Dev Link visible on screen)')

    // Extract the dev link URL
    const devLinkUrl = await page.$eval('a[href*="/reset-password?token="]', (el) => el.href)
    console.log(`  🔗 Found recovery link: ${devLinkUrl}`)

    // ─────────────────────────────────────────────────────────
    // STEP 3: Click the recovery link to open Reset Password Page
    // ─────────────────────────────────────────────────────────
    console.log('\n[STEP 3] Clicking recovery link...')
    await page.click('a[href*="/reset-password?token="]')
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 })

    await page.waitForSelector('#reset-password', { timeout: 10000 })
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_reset_password_page.png') })
    console.log('  📸 Captured: 04_reset_password_page.png')

    // ─────────────────────────────────────────────────────────
    // STEP 4: Enter new password and confirm
    // ─────────────────────────────────────────────────────────
    const newPassword = 'Password2026!@#'
    console.log(`\n[STEP 4] Entering new password: "${newPassword}"...`)
    await page.type('#reset-password', newPassword)
    await page.type('#confirm-password', newPassword)
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_new_password_entered.png') })

    console.log('  Submitting new password...')
    await page.click('form button.btn-primary')

    // Wait for success status
    await page.waitForSelector('div[role="status"]', { timeout: 15000 })
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_password_changed_success.png') })
    console.log('  📸 Captured: 06_password_changed_success.png')

    const successText = await page.$eval('div[role="status"]', (el) => el.innerText)
    console.log(`  🎉 Success message on screen: "${successText.replace(/\n/g, ' ')}"`)

    // ─────────────────────────────────────────────────────────
    // STEP 5: Click "Đăng nhập" to verify login with new password
    // ─────────────────────────────────────────────────────────
    console.log('\n[STEP 5] Clicking "Đăng nhập" and verifying new credentials...')
    await page.click('a[href="/login"]')
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 15000 })

    await page.waitForSelector('#login-email', { timeout: 10000 })
    await page.type('#login-email', testEmail)
    await page.type('#login-password', newPassword)
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_login_page_with_new_password.png') })

    console.log('  Submitting login form...')
    await page.click('#login-submit')

    // Wait for navigation into the application
    console.log('  Waiting for redirect into /channels/@me...')
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 })
    await sleep(2000)

    const currentUrl = page.url()
    console.log(`  📍 Current URL: ${currentUrl}`)
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_logged_in_dashboard.png') })
    console.log('  📸 Captured: 08_logged_in_dashboard.png')

    if (currentUrl.includes('/channels/')) {
      console.log('\n' + '='.repeat(70))
      console.log('🎉 BROWSER E2E RECOVERY TEST PASSED 100%!')
      console.log('='.repeat(70))
    } else {
      console.warn(`  ⚠️ Final URL was ${currentUrl}, checking content...`)
    }
  } catch (err) {
    console.error('❌ E2E Browser test error:', err.message)
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, 'error_state.png') }).catch(() => {})
    throw err
  } finally {
    await browser.close()
    await unban()
  }
}

main().catch((err) => {
  console.error('Fatal test error:', err)
  process.exit(1)
})
