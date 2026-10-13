const puppeteer = require('puppeteer');

const delay = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  console.log('--- Capturing Desktop Viewports ---');
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await desktopPage.goto('http://localhost:7823/index.html', { waitUntil: 'networkidle0', timeout: 15000 });

  // Clear local storage to start clean
  await desktopPage.evaluate(() => {
    localStorage.clear();
  });
  await desktopPage.reload({ waitUntil: 'networkidle0' });
  await delay(1500);

  // 1. Open Auth Modal (Step 1: Choose User)
  await desktopPage.click('#btn-switch-user');
  await delay(500);
  await desktopPage.screenshot({ path: 'screenshot_auth_modal.png', fullPage: false });
  console.log('✓ screenshot_auth_modal.png (Step 1: Chọn tài khoản Bảo / Ngân)');

  // 2. Click user "Bảo" -> Opens Modern PIN Pad
  await desktopPage.click('.auth-user-card[data-user-id="bao"]');
  await delay(400);
  await desktopPage.screenshot({ path: 'screenshot_pin_pad.png', fullPage: false });
  console.log('✓ screenshot_pin_pad.png (Step 2: Bàn phím PIN pad hiện đại)');

  // 3. Click digits: 1, 2, 3
  await desktopPage.click('.keypad-btn[data-key="1"]');
  await delay(150);
  await desktopPage.click('.keypad-btn[data-key="2"]');
  await delay(150);
  await desktopPage.click('.keypad-btn[data-key="3"]');
  await delay(300);
  await desktopPage.screenshot({ path: 'screenshot_pin_entering.png', fullPage: false });
  console.log('✓ screenshot_pin_entering.png (Nhập 3 chấm đèn phát sáng)');

  // 4. Enter 4th digit: 4 (completes PIN 1234) -> auto verifies and switches to Bảo
  await desktopPage.click('.keypad-btn[data-key="4"]');
  await delay(800);
  await desktopPage.screenshot({ path: 'screenshot_user_switched.png', fullPage: false });
  console.log('✓ screenshot_user_switched.png (Đăng nhập thành công chuyển sang Bảo)');

  await desktopPage.close();

  // 5. Mobile Responsive Viewport (390 x 844)
  console.log('--- Capturing Mobile Responsive PIN Pad ---');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:7823/index.html', { waitUntil: 'networkidle0', timeout: 15000 });
  await delay(1200);

  await mobilePage.click('#btn-switch-user');
  await delay(400);
  await mobilePage.click('.auth-user-card[data-user-id="ngan"]');
  await delay(400);
  await mobilePage.click('.keypad-btn[data-key="5"]');
  await delay(150);
  await mobilePage.click('.keypad-btn[data-key="6"]');
  await delay(300);
  await mobilePage.screenshot({ path: 'screenshot_mobile_pin_pad.png', fullPage: false });
  console.log('✓ screenshot_mobile_pin_pad.png (Mobile PIN Pad cho Ngân)');

  await mobilePage.close();
  await browser.close();
  console.log('All modern PIN screenshots captured successfully!');
})().catch(e => { console.error(e); process.exit(1); });
