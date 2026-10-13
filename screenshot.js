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

  // 1. Screenshot Desktop Header with Cloud Sync status pill
  await desktopPage.screenshot({ path: 'screenshot_cloud_header.png', fullPage: false });
  console.log('✓ screenshot_cloud_header.png (Desktop Header với nút Cloud Sync)');

  // 2. Click Cloud Sync button -> Opens Cloud Sync Modal
  await desktopPage.click('#btn-cloud-status');
  await delay(500);
  await desktopPage.screenshot({ path: 'screenshot_cloud_modal.png', fullPage: false });
  console.log('✓ screenshot_cloud_modal.png (Modal Cài Đặt Đồng Bộ Đám Mây Firebase)');
  await desktopPage.click('#btn-close-modal-cloud');
  await delay(300);

  // 3. Open Auth Modal & test modern PIN pad
  await desktopPage.click('#btn-switch-user');
  await delay(400);
  await desktopPage.click('.auth-user-card[data-user-id="bao"]');
  await delay(400);
  await desktopPage.click('.keypad-btn[data-key="1"]');
  await delay(100);
  await desktopPage.click('.keypad-btn[data-key="2"]');
  await delay(100);
  await desktopPage.click('.keypad-btn[data-key="3"]');
  await delay(100);
  await desktopPage.click('.keypad-btn[data-key="4"]');
  await delay(600);

  await desktopPage.close();

  // 4. Mobile Viewport (390 x 844)
  console.log('--- Capturing Mobile Responsive Viewports ---');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:7823/index.html', { waitUntil: 'networkidle0', timeout: 15000 });
  await delay(1500);

  await mobilePage.click('#btn-cloud-status');
  await delay(500);
  await mobilePage.screenshot({ path: 'screenshot_mobile_cloud_modal.png', fullPage: false });
  console.log('✓ screenshot_mobile_cloud_modal.png (Mobile Cloud Modal)');

  await mobilePage.close();
  await browser.close();
  console.log('All verification screenshots captured successfully!');
})().catch(e => { console.error(e); process.exit(1); });
