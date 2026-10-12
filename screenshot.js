const puppeteer = require('puppeteer');

const delay = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  await page.goto('http://localhost:7823/index.html', {
    waitUntil: 'networkidle0',
    timeout: 15000
  });

  // Wait 2.5 seconds for wave engine to advance and crest with foam
  await delay(2500);

  await page.screenshot({ path: 'screenshot_schedule.png', fullPage: false });
  console.log('OK screenshot_schedule.png');

  // Switch to finance tab
  await page.click('#tab-btn-finance');
  await delay(800);

  await page.screenshot({ path: 'screenshot_finance.png', fullPage: false });
  console.log('OK screenshot_finance.png');

  await browser.close();
  console.log('Done.');
})().catch(e => { console.error(e); process.exit(1); });
