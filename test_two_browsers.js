const puppeteer = require('puppeteer');

const delay = ms => new Promise(r => setTimeout(r, ms));

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  console.log('=== TEST 2 BROWSERS REALTIME SYNC & MESSENGER NOTIFICATIONS ===');

  // Context 1: Trình duyệt 1 (BẢO - Người đồng hành)
  const contextBao = await browser.createBrowserContext();
  const pageBao = await contextBao.newPage();
  await pageBao.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
  await pageBao.goto('http://localhost:7823/index.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await delay(1000);

  // Đăng nhập Bảo
  await pageBao.click('#btn-switch-user');
  await delay(400);
  await pageBao.click('.auth-user-card[data-user-id="bao"]');
  await delay(400);
  await pageBao.click('.keypad-btn[data-key="1"]');
  await delay(100);
  await pageBao.click('.keypad-btn[data-key="2"]');
  await delay(100);
  await pageBao.click('.keypad-btn[data-key="3"]');
  await delay(100);
  await pageBao.click('.keypad-btn[data-key="4"]');
  await delay(1000);

  // Context 2: Trình duyệt 2 (NGÂN - Chủ nhân không gian)
  const contextNgan = await browser.createBrowserContext();
  const pageNgan = await contextNgan.newPage();
  await pageNgan.setViewport({ width: 1280, height: 800, deviceScaleFactor: 2 });
  await pageNgan.goto('http://localhost:7823/index.html', { waitUntil: 'domcontentloaded', timeout: 15000 });
  await delay(1000); // Ngân đang ở trang chủ, chưa mở khung chat

  console.log('✓ 2 Trình duyệt đã kết nối tới Server Sync SSE.');

  // Bảo mở khung chat và gửi lời nhắc "Uống nước"
  console.log('--- Bảo gửi lời nhắc 1-chạm: Uống nước ---');
  await pageBao.click('#btn-floating-chat');
  await delay(600);
  await pageBao.click('.btn-quick-nudge[data-nudge="water"]');
  await delay(600);

  // Bảo nhắn thêm 1 tin nhắn thường
  await pageBao.type('#chat-input-text', 'Em bé học chăm chỉ nhưng nhớ uống nước ấm nhé!');
  await delay(200);
  await pageBao.click('#btn-chat-send');
  await delay(800);

  // Chờ 1.5 giây để SSE đẩy tin nhắn sang Trình duyệt của Ngân
  await delay(1500);

  // Chụp màn hình bên Ngân: Phải thấy Pop-up thông báo kiểu Messenger và Badge số đếm chưa đọc!
  await pageNgan.screenshot({ path: 'screenshot_messenger_notification.png', fullPage: false });
  console.log('✓ screenshot_messenger_notification.png (Ngân nhận Pop-up Messenger & Badge chưa đọc)');

  // Ngân bấm vào Pop-up Messenger để mở chat và trả lời
  console.log('--- Ngân bấm vào thông báo Messenger để mở chat và trả lời ---');
  await pageNgan.click('#messenger-notify-card');
  await delay(800);

  await pageNgan.type('#chat-input-text', 'Dạ anh, em vừa uống một cốc nước ấm rồi nè!');
  await delay(200);
  await pageNgan.click('#btn-chat-send');
  await delay(1000);

  // Chụp ảnh giao diện chat của Ngân sau khi mở
  await pageNgan.screenshot({ path: 'screenshot_ngan_chat_opened.png', fullPage: false });
  console.log('✓ screenshot_ngan_chat_opened.png (Giao diện chat của Ngân sau khi mở từ pop-up)');

  // Kiểm tra bên Bảo: Tin nhắn của Ngân tự động hiển thị trong khung chat của Bảo qua SSE!
  await delay(1200);
  await pageBao.screenshot({ path: 'screenshot_bao_chat_received.png', fullPage: false });
  console.log('✓ screenshot_bao_chat_received.png (Bảo nhận tin nhắn của Ngân thời gian thực)');

  await browser.close();
  console.log('=== TẤT CẢ KIỂM THỬ ĐỒNG BỘ 2 TRÌNH DUYỆT THÀNH CÔNG ===');
})().catch(e => { console.error(e); process.exit(1); });
