import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const SCREENSHOT_DIR = 'C:\\Users\\brave\\.gemini\\antigravity\\brain\\6714fbed-d9c8-4567-985b-b7469f54ed11\\screenshots';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function run() {
  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--window-size=1440,900'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();

  // Suppress cookie banner by default
  await page.evaluateOnNewDocument(() => {
    try {
      localStorage.setItem('bravechat_cookie_consent_v1', 'granted');
    } catch {}
  });

  // Step 1: Unban IP
  try {
    await fetch('http://localhost:4000/security/unban', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{}'
    });
  } catch {}

  // Step 2: Go to /login
  console.log('1. Navigating to http://localhost:3000/login...');
  await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

  // Type credentials and submit
  console.log('2. Logging in with thenoobsisevil@gmail.com...');
  await page.waitForSelector('#login-email', { timeout: 10000 });
  await page.type('#login-email', 'thenoobsisevil@gmail.com');
  await page.type('#login-password', 'Password2026!@#');

  console.log('3. Submitting login form...');
  await Promise.all([
    page.click('#login-submit'),
    page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})
  ]);

  await sleep(2000);
  console.log('Current URL:', page.url());

  if (page.url().includes('/login')) {
    console.log('Attempting direct navigation after login...');
    await page.goto('http://localhost:3000/channels/@me', { waitUntil: 'networkidle2' });
    await sleep(1500);
  }

  console.log('Dashboard URL:', page.url());

  // Wait for sidebar/home rail to render
  await page.waitForSelector('[data-testid="home-rail-item"]', { timeout: 10000 }).catch(() => null);

  // Dismiss cookie banner by clicking "CHẤP NHẬN TẤT CẢ"
  try {
    const acceptBtn = await page.waitForSelector('#cookie-banner button', { timeout: 3000 });
    if (acceptBtn) {
      console.log('Dismissing cookie banner...');
      await acceptBtn.click();
      await sleep(600);
    }
  } catch {}

  // Capture 09: Dashboard with White Brand Icon
  await page.screenshot({ path: path.join(SCREENSHOT_DIR, '09_dashboard_with_white_brand_icon.png') });
  console.log('📸 Captured 09_dashboard_with_white_brand_icon.png');

  // Capture 10: Quick Profile Popover
  const popoverTrigger = await page.$('[data-testid="user-profile-popover-trigger"]');
  if (popoverTrigger) {
    await popoverTrigger.click();
    await sleep(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '10_quick_profile_popover.png') });
    console.log('📸 Captured 10_quick_profile_popover.png');
  }

  // Capture 11: Settings Center Modal (Account)
  const gearBtn = await page.$('[data-testid="user-settings-btn"]');
  if (gearBtn) {
    await gearBtn.click();
    await sleep(800);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '11_user_settings_modal_account.png') });
    console.log('📸 Captured 11_user_settings_modal_account.png');

    // Click Security Tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent?.includes('Mật Khẩu & Bảo Mật'));
      btn?.click();
    });
    await sleep(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '12_user_settings_modal_security_2fa.png') });
    console.log('📸 Captured 12_user_settings_modal_security_2fa.png');

    // Click Active Sessions Tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent?.includes('Thiết Bị Đã Đăng Nhập'));
      btn?.click();
    });
    await sleep(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '13_user_settings_modal_devices.png') });
    console.log('📸 Captured 13_user_settings_modal_devices.png');

    // Click Brave Nitro Tab
    await page.evaluate(() => {
      const btns = Array.from(document.querySelectorAll('button'));
      const btn = btns.find(b => b.textContent?.includes('Brave Nitro'));
      btn?.click();
    });
    await sleep(600);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '14_user_settings_modal_nitro.png') });
    console.log('📸 Captured 14_user_settings_modal_nitro.png');
  }

  await browser.close();
  console.log('UI Showcase complete!');
}

run().catch(err => {
  console.error('Showcase error:', err);
  process.exit(1);
});
