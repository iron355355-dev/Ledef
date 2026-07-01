const { chromium } = require('playwright');
const cron = require('node-cron');
const http = require('http');
const fs = require('fs');
const { execSync } = require('child_process');

// === АВТОМАТИЧЕСКАЯ УСТАНОВКА БРАУЗЕРОВ ===
console.log('📦 Проверка и установка браузеров Playwright...');
try {
  execSync('npx playwright install chromium', { stdio: 'inherit' });
  console.log('✅ Браузеры успешно установлены');
} catch (error) {
  console.error('❌ Ошибка установки браузеров:', error.message);
}

// === ВАШИ URL ИЗ TASKER (В ТОЧНОСТИ ПО ПОРЯДКУ) ===
const urls = [
  'https://ledeffect.ru/',
  'https://stimarket.ru/spares/transmissiya/mostyi',
  'https://ledeffect.ru/projects/Interior/karcher/',
  'https://ledeffect.ru/projects/medical/',
  'https://ledeffect.ru/video/company/',
  'https://ledeffect.ru/projects/sport/kipr/',
  'https://ledeffect.ru/projects/street',
  'https://ledeffect.ru/projects/medical/',
  'https://ledeffect.ru/include/licenses_detail.php',
  'https://ledeffect.ru/projects/street/kamaz/',
  'https://ledeffect.ru/projects/medical/',
  'https://ledeffect.ru/projects/commercial/',
  'https://ledeffect.ru/projects/sport/',
  'https://ledeffect.ru/projects/street/',
  'https://ledeffect.ru/video',
  'https://ledeffect.ru/company/online-applications/',
  'https://ledeffect.ru/company/online-applications/',
  'https://ledeffect.ru/projects/interior/',
  'https://ledeffect.ru/company/faq/',
  'https://ledeffect.ru/video/pro/',
  'https://ledeffect.ru/prices/',
  'https://ledeffect.ru/where-to-buy/ufo/',
  'https://ledeffect.ru/downloads/catalogs/',
  'https://ledeffect.ru/projects/sport/vysotnyy-gorod/',
  'http://orange.ru/hlp-reacto.html?bef9c92eb1a2ec42c3f6c59ae5ef7f0b=69e3f32947c1a59fc4c7e501b4b63354',
  'http://orange.ru/hlp-reacto4.html?bef9c92eb1a2ec42c3f6c59ae5ef7f0b=da65d6a583e8ee4332fad55a8dd4e343',
  'https://ledeffect.ru/projects/street/khord/',
  'https://buyprodam.ru/1a/test.php',
  'http://orange.ru/hlp-reacto4.html?bef9c92eb1a2ec42c3f6c59ae5ef7f0b=da65d6a583e8ee4332fad55a8dd4e343',
  'http://orange.ru/hlp-reacto.html?bef9c92eb1a2ec42c3f6c59ae5ef7f0b=69e3f32947c1a59fc4c7e501b4b63354',
  'http://orange.ru/hlp-reacto.html?bef9c92eb1a2ec42c3f6c59ae5ef7f0b=ae8d4af8ca1f2872a46fd604b794c045'
];

// === ФУНКЦИЯ ОТКРЫТИЯ СТРАНИЦ ===
async function openPages() {
  console.log(`🔄 [${new Date().toLocaleString('ru-RU')}] Запуск открытия ${urls.length} страниц`);
  
  let browser;
  try {
    browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
  } catch (error) {
    console.error('❌ Ошибка запуска браузера:', error.message);
    console.log('🔄 Пробую установить браузеры заново...');
    try {
      execSync('npx playwright install chromium', { stdio: 'inherit' });
      browser = await chromium.launch({ 
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
    } catch (retryError) {
      console.error('❌ Повторная ошибка:', retryError.message);
      return;
    }
  }
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
    viewport: { width: 1920, height: 1080 }
  });
  
  let successCount = 0;
  let screenshotTaken = false;
  const startTime = Date.now();
  
  for (let i = 0; i < urls.length; i++) {
    const page = await context.newPage();
    try {
      console.log(`📄 [${i+1}/${urls.length}] Открываю: ${urls[i]}`);
      
      const response = await page.goto(urls[i], { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      
      // === ПРОВЕРКА ВЫПОЛНЕНИЯ JAVASCRIPT ===
      const jsExecuted = await page.evaluate(() => {
        return {
          title: document.title,
          scripts: document.scripts.length,
          readyState: document.readyState,
          url: window.location.href,
          bodyLength: document.body ? document.body.textContent.length : 0
        };
      });
      
      console.log(`📊 [${i+1}/${urls.length}] Статус: ${response.status()}, JS выполнен`);
      console.log(`   📌 title: "${jsExecuted.title}"`);
      console.log(`   📌 скриптов: ${jsExecuted.scripts}, состояние: ${jsExecuted.readyState}`);
      console.log(`   📌 длина body: ${jsExecuted.bodyLength} символов`);
      
      // === ТЕСТОВЫЙ СКРИНШОТ В ПЕРВЫЕ 5 МИНУТ ===
      const elapsedMinutes = (Date.now() - startTime) / 60000;
      if (i === 0 && !screenshotTaken && elapsedMinutes <= 5) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const filename = `/tmp/test-screenshot-${timestamp}.png`;
        await page.screenshot({ path: filename, fullPage: true });
        console.log(`📸 [${i+1}/${urls.length}] ТЕСТОВЫЙ СКРИНШОТ СОХРАНЁН: ${filename}`);
        console.log(`🔗 Ссылка на сайт: ${urls[i]}`);
        console.log(`⏱️ Время с запуска: ${Math.round(elapsedMinutes)} мин ${Math.round((Date.now() - startTime) % 60000 / 1000)} сек`);
        screenshotTaken = true;
      } else if (i === 0 && !screenshotTaken && elapsedMinutes > 5) {
        console.log(`⏳ [${i+1}/${urls.length}] Тестовый скриншот пропущен (прошло ${Math.round(elapsedMinutes)} мин, нужно ≤ 5 мин)`);
      }
      
      await page.waitForTimeout(2000);
      successCount++;
      console.log(`✅ [${i+1}/${urls.length}] Успешно: ${urls[i]}`);
      
    } catch (error) {
      console.error(`❌ [${i+1}/${urls.length}] Ошибка: ${urls[i]} - ${error.message}`);
    } finally {
      await page.close();
    }
  }
  
  await browser.close();
  console.log(`✅ [${new Date().toLocaleString('ru-RU')}] Завершено: ${successCount}/${urls.length} страниц`);
  console.log(`📊 Общее время выполнения: ${Math.round((Date.now() - startTime) / 1000)} сек`);
}

// === КОНВЕРТЕР МОСКОВСКОГО ВРЕМЕНИ В UTC ===
const scheduleInMoscow = (cronTime, callback) => {
  try {
    const [minute, hour, day, month, dayOfWeek] = cronTime.split(' ');
    let utcHour = hour;
    if (hour !== '*') {
      utcHour = (parseInt(hour) - 3 + 24) % 24;
    }
    const utcCron = `${minute} ${utcHour} ${day} ${month} ${dayOfWeek}`;
    
    cron.schedule(utcCron, callback, { timezone: "UTC" });
    console.log(`⏰ Запланировано на ${hour}:${minute} МСК (${utcHour}:${minute} UTC)`);
    return true;
  } catch (error) {
    console.error(`❌ Ошибка в расписании: ${error.message}`);
    return false;
  }
};

// === РАСПИСАНИЕ ===
console.log('🔄 Регистрация расписания...');

// Основное расписание: каждый день в 00:00 МСК
scheduleInMoscow('0 0 * * *', openPages);

// === ТЕСТОВЫЙ ЗАПУСК ЧЕРЕЗ 30 СЕКУНД ПОСЛЕ СТАРТА ===
console.log('⏳ Запланирован тестовый запуск через 30 секунд...');
setTimeout(() => {
  console.log('🧪 ТЕСТОВЫЙ ЗАПУСК (немедленный)');
  openPages();
}, 30000);

console.log('🚀 Сервер запущен! Ожидание расписания...');
console.log(`📊 Всего URL в списке: ${urls.length}`);
console.log('⏰ Расписание: каждый день в 00:00 по Москве');

// === HTTP-СЕРВЕР ДЛЯ RENDER (ЧТОБЫ НЕ ЗАСЫПАЛ) ===
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('OK');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌐 HTTP-сервер запущен на порту ${PORT}`);
});