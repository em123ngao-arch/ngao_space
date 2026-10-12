const puppeteer = require('puppeteer');

const delay = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  // 1. DESKTOP VIEWPORT (1440 x 900)
  console.log('--- Capturing Desktop Viewports ---');
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await desktopPage.goto('http://localhost:7823/index.html', { waitUntil: 'networkidle0', timeout: 15000 });

  // Clear local storage to start clean
  await desktopPage.evaluate(() => {
    localStorage.clear();
  });
  await desktopPage.reload({ waitUntil: 'networkidle0' });

  // Wait for ocean waves, seagulls, crabs
  await delay(2500);
  await desktopPage.screenshot({ path: 'screenshot_schedule.png', fullPage: false });
  console.log('✓ screenshot_schedule.png (Desktop Schedule)');

  // Open Auth Modal to capture 2-user auth modal
  await desktopPage.click('#btn-switch-user');
  await delay(600);
  await desktopPage.screenshot({ path: 'screenshot_auth_modal.png', fullPage: false });
  console.log('✓ screenshot_auth_modal.png (2-User Switch Dialog)');
  await desktopPage.click('#btn-close-modal-auth');
  await delay(400);

  // Switch to finance tab
  await desktopPage.click('#tab-btn-finance');
  await delay(600);

  // Deposit 1,000,000 into Big Savings Goal to demonstrate CRUD update
  await desktopPage.click('.btn-deposit[data-amount="1000000"]');
  await delay(600);

  await desktopPage.screenshot({ path: 'screenshot_finance.png', fullPage: false });
  console.log('✓ screenshot_finance.png (Desktop Finance - Big Goals CRUD & Weekly Comparison)');
  await desktopPage.close();

  // 2. MOBILE RESPONSIVE VIEWPORT (iPhone 14/15: 390 x 844)
  console.log('--- Capturing Mobile Responsive Viewports ---');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:7823/index.html', { waitUntil: 'networkidle0', timeout: 15000 });

  await delay(2000);
  await mobilePage.screenshot({ path: 'screenshot_mobile_schedule.png', fullPage: false });
  console.log('✓ screenshot_mobile_schedule.png (Mobile Schedule)');

  await mobilePage.click('#tab-btn-finance');
  await delay(800);
  await mobilePage.screenshot({ path: 'screenshot_mobile_finance.png', fullPage: false });
  console.log('✓ screenshot_mobile_finance.png (Mobile Finance)');
  await mobilePage.close();

  await browser.close();
  console.log('All screenshots captured successfully!');
})().catch(e => { console.error(e); process.exit(1); });
