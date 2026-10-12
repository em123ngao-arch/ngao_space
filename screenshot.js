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

  // Clear legacy local storage key to ensure 100% clean state
  await desktopPage.evaluate(() => {
    localStorage.removeItem('NGAOS_STATE_V1');
    if (window.StorageManager) window.StorageManager.getState();
  });
  await desktopPage.reload({ waitUntil: 'networkidle0' });

  // Wait for ocean waves, seagulls, and crabs to animate
  await delay(2500);
  await desktopPage.screenshot({ path: 'screenshot_schedule.png', fullPage: false });
  console.log('✓ screenshot_schedule.png (Desktop Schedule - Clean Slate)');

  // Switch to finance tab
  await desktopPage.click('#tab-btn-finance');
  await delay(600);

  // Add 2 real transactions to demonstrate daily bars and week metrics
  await desktopPage.type('#trans-desc', 'Ăn trưa & Cafe sáng');
  await desktopPage.type('#trans-amount', '55000');
  await desktopPage.click('#btn-add-trans');
  await delay(400);

  // Deposit 2,000,000 into Big Savings Goal
  await desktopPage.click('.btn-deposit[data-amount="1000000"]');
  await delay(200);
  await desktopPage.click('.btn-deposit[data-amount="1000000"]');
  await delay(500);

  await desktopPage.screenshot({ path: 'screenshot_finance.png', fullPage: false });
  console.log('✓ screenshot_finance.png (Desktop Finance - Week & Day Breakdown + Big Goal)');
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
