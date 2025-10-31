#!/usr/bin/env node
/*
  Простая нагрузочная утилита без зависимостей.
  Имитация N виртуальных пользователей, отправляющих параллельно GET-запросы на указанный URL.

  Пример запуска:
    node test_ddos.js --url https://cdn.cake-school-fortune.ru/api/wheel/prizes --users 3000 --duration 60 --timeout 5000 --rampUp 10 --think 50-150

  Аргументы:
    --url        (string)  Целевая ссылка (обязательно)
    --users      (number)  Кол-во виртуальных пользователей (по умолчанию 2000)
    --duration   (number)  Длительность теста в секундах (по умолчанию 60)
    --timeout    (number)  Таймаут запроса мс (по умолчанию 5000)
    --rampUp     (number)  Рамп-ап в секундах (по умолчанию 10) — плавный старт
    --think      (string)  "min-max" задержка между запросами у пользователя в мс (по умолчанию 0-0)
    --headers    (string)  Заголовки в JSON (необязательно), например: '{"User-Agent":"LoadTest"}'
*/

const https = require('https');
const http = require('http');
const { URL } = require('url');

function parseArgs() {
  const args = process.argv.slice(2);
  const map = {};
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a.startsWith('--')) {
      const key = a.slice(2);
      const val = args[i + 1] && !args[i + 1].startsWith('--') ? args[++i] : 'true';
      map[key] = val;
    }
  }
  return map;
}

function parseThink(thinkStr) {
  if (!thinkStr) return { min: 0, max: 0 };
  const m = /^(\d+)-(\d+)$/.exec(thinkStr.trim());
  if (!m) return { min: 0, max: 0 };
  const min = parseInt(m[1], 10);
  const max = parseInt(m[2], 10);
  return { min: Math.max(0, Math.min(min, max)), max: Math.max(min, max) };
}

function sleep(ms) {
  return new Promise(res => setTimeout(res, ms));
}

function nowMs() {
  const [sec, ns] = process.hrtime();
  return sec * 1000 + Math.round(ns / 1e6);
}

function requestOnce(targetUrl, { timeoutMs, headers }) {
  return new Promise((resolve) => {
    const urlObj = new URL(targetUrl);
    const lib = urlObj.protocol === 'https:' ? https : http;
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + (urlObj.search || ''),
      method: 'GET',
      headers: headers || {},
    };

    const start = nowMs();
    let completed = false;

    const req = lib.request(options, (res) => {
      // Читаем тело, но игнорируем содержимое, чтобы не держать сокет
      res.on('data', () => {});
      res.on('end', () => {
        if (completed) return;
        completed = true;
        const latency = nowMs() - start;
        resolve({ ok: true, status: res.statusCode || 0, latencyMs: latency });
      });
    });

    req.on('error', () => {
      if (completed) return;
      completed = true;
      const latency = nowMs() - start;
      resolve({ ok: false, status: 0, latencyMs: latency, error: 'socket' });
    });

    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error('timeout'));
      if (completed) return;
      completed = true;
      const latency = nowMs() - start;
      resolve({ ok: false, status: 0, latencyMs: latency, error: 'timeout' });
    });

    req.end();
  });
}

function percentile(arr, p) {
  if (!arr.length) return 0;
  const sorted = [...arr].sort((a, b) => a - b);
  const idx = Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1);
  return sorted[idx];
}

function minMax(arr) {
  if (!arr.length) return { min: 0, max: 0 };
  let min = Infinity;
  let max = -Infinity;
  for (let i = 0; i < arr.length; i++) {
    const v = arr[i];
    if (v < min) min = v;
    if (v > max) max = v;
  }
  return { min, max };
}

async function virtualUserLoop(id, endAtMs, cfg, metrics) {
  // Рандомный разгон (равномерный) в течение rampUp
  if (cfg.rampUpMs > 0) {
    const slice = Math.floor(cfg.rampUpMs / Math.max(1, cfg.users));
    await sleep(id * slice);
  }

  while (nowMs() < endAtMs) {
    const result = await requestOnce(cfg.url, { timeoutMs: cfg.timeoutMs, headers: cfg.headers });
    // Запись метрик — без блокировок; риск гонок приемлем
    metrics.total++;
    metrics.statusCount[result.status] = (metrics.statusCount[result.status] || 0) + 1;
    metrics.latencies.push(result.latencyMs);
    if (result.ok && result.status >= 200 && result.status < 400) metrics.success++;
    else metrics.fail++;

    // Имитация "мышления" пользователя
    if (cfg.think.max > 0) {
      const pause = cfg.think.min + Math.floor(Math.random() * (cfg.think.max - cfg.think.min + 1));
      await sleep(pause);
    }
  }
}

async function main() {
  const args = parseArgs();
  const url = args.url || 'https://cdn.cake-school-fortune.ru/api/wheel/prizes';
  const users = parseInt(args.users || '2000', 10);
  const durationSec = parseInt(args.duration || '60', 10);
  const timeoutMs = parseInt(args.timeout || '5000', 10);
  const rampUpSec = parseInt(args.rampUp || '10', 10);
  const think = parseThink(args.think || '0-0');
  let headers = {};
  if (args.headers) {
    try { headers = JSON.parse(args.headers); } catch {}
  }

  if (!url) {
    console.error('Ошибка: --url обязателен');
    process.exit(1);
  }

  const cfg = {
    url,
    users,
    durationMs: durationSec * 1000,
    timeoutMs,
    rampUpMs: rampUpSec * 1000,
    think,
    headers,
  };

  console.log('Начало нагрузочного теста');
  console.log('URL:', cfg.url);
  console.log('Вирт. пользователи:', cfg.users);
  console.log('Длительность (сек):', durationSec);
  console.log('Таймаут (мс):', cfg.timeoutMs);
  console.log('Рамп-ап (сек):', rampUpSec);
  console.log('Think time (мс):', `${cfg.think.min}-${cfg.think.max}`);

  const startMs = nowMs();
  const endAtMs = startMs + cfg.durationMs;

  const metrics = {
    total: 0,
    success: 0,
    fail: 0,
    latencies: [],
    statusCount: {},
    rpsBySecond: new Map(),
  };

  // Тик каждую секунду — оценка RPS
  const rpsTimer = setInterval(() => {
    const sec = Math.floor((nowMs() - startMs) / 1000);
    const lastTotal = metrics.total;
    const prev = metrics.rpsBySecond.get(sec) || { total: 0 };
    metrics.rpsBySecond.set(sec, { total: lastTotal - (prev.totalAccum || 0), totalAccum: lastTotal });
  }, 1000);

  // Запускаем VU
  const workers = [];
  for (let i = 0; i < users; i++) {
    workers.push(virtualUserLoop(i, endAtMs, cfg, metrics));
  }

  // Периодический лог прогресса
  const progressTimer = setInterval(() => {
    const elapsedSec = Math.floor((nowMs() - startMs) / 1000);
    const remainSec = Math.max(0, durationSec - elapsedSec);
    console.log(`[t+${elapsedSec}s] total=${metrics.total} ok=${metrics.success} fail=${metrics.fail} remain=${remainSec}s`);
  }, 5000);

  await Promise.all(workers);
  clearInterval(progressTimer);
  clearInterval(rpsTimer);

  // Подсчёт метрик
  const durationMs = nowMs() - startMs;
  const lat = metrics.latencies;
  const { min, max } = minMax(lat);
  const avg = lat.length ? Math.round(lat.reduce((a, b) => a + b, 0) / lat.length) : 0;
  const p50 = Math.round(percentile(lat, 50));
  const p90 = Math.round(percentile(lat, 90));
  const p95 = Math.round(percentile(lat, 95));
  const p99 = Math.round(percentile(lat, 99));
  const overallRps = durationMs > 0 ? (metrics.total * 1000) / durationMs : 0;

  console.log('\n===== Результаты нагрузочного теста =====');
  console.log('URL:', cfg.url);
  console.log('Пользователи:', users);
  console.log('Длительность (с):', (durationMs / 1000).toFixed(1));
  console.log('Всего запросов:', metrics.total);
  console.log('Успешные:', metrics.success);
  console.log('Ошибки:', metrics.fail);
  console.log('RPS (средний):', overallRps.toFixed(2));
  console.log('Задержка (мс): min', min, 'avg', avg, 'p50', p50, 'p90', p90, 'p95', p95, 'p99', p99, 'max', max);
  console.log('Статусы:');
  Object.keys(metrics.statusCount).sort((a, b) => Number(a) - Number(b)).forEach(s => {
    console.log(`  ${s}: ${metrics.statusCount[s]}`);
  });

  // Краткий вывод CSV совместимого блока (опционально)
  // console.log('\nsecond,total');
  // [...metrics.rpsBySecond.entries()].sort((a,b)=>a[0]-b[0]).forEach(([sec, { total }])=>{
  //   console.log(`${sec},${total}`);
  // });
}

main().catch((e) => {
  console.error('Ошибка исполнения теста:', e);
  process.exit(1);
});


