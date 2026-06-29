const { chromium } = require('playwright');
const cron = require('node-cron');
const http = require('http');

// ВАШИ URL
const urls = [
  'https://ledeffect.ru/projects/medical/',
  'https://ledeffect.ru/projects/Interior/karcher/',
  'https://ledeffect.ru/',
  'https://ledeffect.ru/video/company/',
  'https://ledeffect.ru/projects/sport/kipr/',
  'https://ledeffect.ru/projects/street',
  'https://ledeffect.ru/include/licenses_detail.php',
  'https://ledeffect.ru/projects/street/kamaz/',
  'https://ledeffect.ru/projects/commercial/',
  'https://ledeffect.ru/projects/sport/',
  'https://ledeffect.ru/projects/street/',
  'https://ledeffect.ru/company/online-applications/',
  'https://ledeffect.ru/projects/interior/',
  'https://ledeffect.ru/company/faq/',
  'https://ledeffect.ru/video/pro/',
  'https://ledeffect.ru/prices/',
  'https://ledeffect.ru/where-to-buy/ufo/',
  'https://ledeffect.ru/downloads/catalogs/',
  'https://ledeffect.ru/projects/sport/vysotnyy-gorod/',
  'https://ledeffect.ru/projects/street/khord/',
  'https://buyprodam.ru/1a/test.php'
];

// Дополняем до 30
const fullUrls = [...urls];
while (fullUrls.length < 30) {
  fullUrls.push(urls[fullUrls.length % urls.length]);
}

async function openPages() {
  console.log(`🔄 [${new Date().toLocaleTimeString('ru-RU')}] Запуск открытия 30 страниц`);
  
  const browser = await chromium.launch({ 
    headless: true,
    args: ['--no-sandbox']
  });
  
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });
  
  let successCount = 0;
  
  for (let i = 0; i < fullUrls.length; i++) {
    const page = await context.newPage();
    try {
      console.log(`📄 [${i+1}/30] Открываю: ${fullUrls[i]}`);
      await page.goto(fullUrls[i], { 
        waitUntil: 'networkidle',
        timeout: 30000 
      });
      await page.waitForTimeout(2000);
      successCount++;
      console.log(`✅ [${i+1}/30] Успешно: ${fullUrls[i]}`);
    } catch (error) {
      console.error(`❌ [${i+1}/30] Ошибка: ${fullUrls[i]} - ${error.message}`);
    } finally {
      await page.close();
    }
  }
  
  await browser.close();
  console.log(`✅ [${new Date().toLocaleTimeString('ru-RU')}] Завершено: ${successCount}/${fullUrls.length} страниц`);
}

// РАСПИСАНИЕ
const scheduleInMoscow = (cronTime, callback) => {
  const [minute, hour, day, month, dayOfWeek] = cronTime.split(' ');
  const utcHour = (parseInt(hour) - 3 + 24) % 24;
  const utcCron = `${minute} ${utcHour} ${day} ${month} ${dayOfWeek}`;
  
  cron.schedule(utcCron, callback, { timezone: "UTC" });
  console.log(`⏰ Запланировано на ${hour}:${minute} МСК (${utcHour}:${minute} UTC)`);
};

scheduleInMoscow('0 12 * * *', openPages);
scheduleInMoscow('0 16 * * *', openPages);
scheduleInMoscow('0 20 * * *', openPages);

console.log('🚀 Сервер запущен! Ожидание расписания...');
console.log(`📊 Всего URL в списке: ${fullUrls.length}`);

// === HTTP-СЕРВЕР ДЛЯ RENDER ===
const server = http.createServer((req, res) => {
  res.writeHead(200);
  res.end('OK');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`🌐 HTTP-сервер запущен на порту ${PORT}`);
});