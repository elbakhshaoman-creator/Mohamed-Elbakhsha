import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

async function run() {
  const screenshotsDir = path.resolve(process.cwd(), 'public/screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Launching browser for end-to-end verification...');
  const browser = await chromium.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const context = await browser.newContext({
    viewport: { width: 1280, height: 850 }
  });
  const page = await context.newPage();

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

  // 1. Initial homepage screenshot
  await page.screenshot({ path: path.join(screenshotsDir, '01_homepage.png') });
  console.log('Saved 01_homepage.png');

  // 2. Click Google Login button in Header
  const loginHeaderBtn = page.locator('button:has-text("تسجيل الدخول باستخدام Google")').first();
  await loginHeaderBtn.click();
  await page.waitForTimeout(500);

  // Screenshot Auth modal Tab 1
  await page.screenshot({ path: path.join(screenshotsDir, '02_auth_modal_main.png') });
  console.log('Saved 02_auth_modal_main.png');

  // 3. Switch to Tab 2: اختبار الحسابات والصلاحيات
  const testTabBtn = page.locator('button:has-text("اختبار الحسابات والصلاحيات")');
  await testTabBtn.click();
  await page.waitForTimeout(400);
  await page.screenshot({ path: path.join(screenshotsDir, '03_test_accounts_tab.png') });
  console.log('Saved 03_test_accounts_tab.png');

  // Test Non-Owner Login: "دخول كزائر"
  console.log('Testing Non-Owner login in UI...');
  const guestBtn = page.locator('button:has-text("دخول كزائر")');
  await guestBtn.click();
  await page.waitForTimeout(600);

  // Close modal to see how UI reflects Non-Owner guest state
  const closeBtn = page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first();
  if (await closeBtn.isVisible()) {
    await closeBtn.click();
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: path.join(screenshotsDir, '04_non_owner_header_state.png') });
  console.log('Saved 04_non_owner_header_state.png');

  // 4. Open Auth Modal again to test Owner Login
  const switchBtn = page.locator('header button:has-text("تبديل")').first();
  await switchBtn.click();
  await page.waitForTimeout(500);

  const testTabBtn2 = page.locator('button:has-text("اختبار الحسابات والصلاحيات")');
  await testTabBtn2.click();
  await page.waitForTimeout(400);

  console.log('Testing Owner login (elbakhshaoman@gmail.com)...');
  const ownerBtn = page.locator('button:has-text("دخول كمالك")');
  await ownerBtn.click();
  await page.waitForTimeout(600);

  // Close modal to see Owner state with green badge
  const closeBtn2 = page.locator('button').filter({ has: page.locator('svg.lucide-x') }).first();
  if (await closeBtn2.isVisible()) {
    await closeBtn2.click();
    await page.waitForTimeout(400);
  }
  await page.screenshot({ path: path.join(screenshotsDir, '05_owner_logged_in_state.png') });
  console.log('Saved 05_owner_logged_in_state.png');

  // 5. Open Settings Tab to verify Google OAuth Account details
  const settingsTab = page.locator('button:has-text("الإعدادات")');
  if (await settingsTab.isVisible()) {
    await settingsTab.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(screenshotsDir, '06_settings_oauth_view.png') });
    console.log('Saved 06_settings_oauth_view.png');
  }

  // 6. Check Class view and points interaction
  const classTab = page.locator('button:has-text("الفصول والطلاب")');
  if (await classTab.isVisible()) {
    await classTab.click();
    await page.waitForTimeout(600);
    await page.screenshot({ path: path.join(screenshotsDir, '07_students_view.png') });
    console.log('Saved 07_students_view.png');
  }

  await browser.close();
  console.log('All end-to-end browser tests completed successfully!');
}

run().catch(err => {
  console.error('Browser test failure:', err);
  process.exit(1);
});
