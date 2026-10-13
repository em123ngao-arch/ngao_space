const puppeteer = require('puppeteer');

const delay = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  console.log('--- 1. Desktop: Load Preset & Study Progress ---');
  const desktopPage = await browser.newPage();
  await desktopPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await desktopPage.goto('http://localhost:7823/index.html', { waitUntil: 'networkidle0', timeout: 15000 });

  // Clear state for fresh demo
  await desktopPage.evaluate(() => localStorage.clear());
  await desktopPage.reload({ waitUntil: 'networkidle0' });
  await delay(1000);

  // Click Preset "Ngày Tự Học & Đề Án"
  await desktopPage.click('.preset-chip[data-preset="self-study"]');
  await delay(400);

  // Complete first 2 tasks in morning
  const cb1 = await desktopPage.$('.task-checkbox-btn');
  if (cb1) {
    await cb1.click();
    await delay(300);
  }
  const cb2 = await desktopPage.$('.task-item-card:not(.completed) .task-checkbox-btn');
  if (cb2) {
    await cb2.click();
    await delay(300);
  }

  // Switch to Bảo (Người đồng hành)
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
  await delay(1000); // Wait for modal to fully close

  // Open Floating Chat Drawer
  await desktopPage.click('#btn-floating-chat');
  await delay(600);

  // Send Quick Nudge "Uống nước"
  await desktopPage.click('.btn-quick-nudge[data-nudge="water"]');
  await delay(500);

  // Type custom chat message & send
  await desktopPage.type('#chat-input-text', 'Em bé học chăm chỉ nhưng nhớ uống nước ấm nhé!');
  await delay(200);
  await desktopPage.click('#btn-chat-send');
  await delay(600);

  // Take screenshot: Desktop Chat Drawer with Live Study Monitor & Nudge
  await desktopPage.screenshot({ path: 'screenshot_chat_desktop.png', fullPage: false });
  console.log('✓ screenshot_chat_desktop.png (Desktop Chat Drawer & Giám sát tiến độ học tập của Ngân)');

  await desktopPage.close();

  // 2. Perspective of Ngân (Chủ nhân không gian)
  console.log('--- 2. Ngân Perspective: Receive Nudge & Reply ---');
  const nganPage = await browser.newPage();
  await nganPage.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });
  await nganPage.goto('http://localhost:7823/index.html', { waitUntil: 'networkidle0', timeout: 15000 });
  await delay(600);

  // Switch back to Ngân
  await nganPage.click('#btn-switch-user');
  await delay(400);
  await nganPage.click('.auth-user-card[data-user-id="ngan"]');
  await delay(400);
  await nganPage.click('.keypad-btn[data-key="5"]');
  await delay(100);
  await nganPage.click('.keypad-btn[data-key="6"]');
  await delay(100);
  await nganPage.click('.keypad-btn[data-key="7"]');
  await delay(100);
  await nganPage.click('.keypad-btn[data-key="8"]');
  await delay(1000);

  // Open Chat from Ngân perspective
  await nganPage.click('#btn-floating-chat');
  await delay(600);
  await nganPage.type('#chat-input-text', 'Dạ anh yêu, em vừa uống nước rồi nè! Đang chuẩn bị làm bài tiếp theo.');
  await delay(200);
  await nganPage.click('#btn-chat-send');
  await delay(600);

  await nganPage.screenshot({ path: 'screenshot_chat_ngan_view.png', fullPage: false });
  console.log('✓ screenshot_chat_ngan_view.png (Góc nhìn của Ngân khi nhận lời nhắc & trả lời)');
  await nganPage.close();

  // 3. Mobile Viewport (390 x 844)
  console.log('--- 3. Mobile Responsive Chat ---');
  const mobilePage = await browser.newPage();
  await mobilePage.setViewport({ width: 390, height: 844, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
  await mobilePage.goto('http://localhost:7823/index.html', { waitUntil: 'networkidle0', timeout: 15000 });
  await delay(1000);

  // Open Chat on Mobile
  await mobilePage.click('#btn-floating-chat');
  await delay(600);
  await mobilePage.screenshot({ path: 'screenshot_chat_mobile.png', fullPage: false });
  console.log('✓ screenshot_chat_mobile.png (Mobile Responsive Chat Drawer)');

  await mobilePage.close();
  await browser.close();
  console.log('All verification screenshots captured successfully!');
})().catch(e => { console.error(e); process.exit(1); });
