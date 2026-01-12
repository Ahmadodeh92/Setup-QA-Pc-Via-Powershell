// ======================================
// NodeJsDownload.js - Playwright + API-style download with progress
// ======================================

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');
const fetch = require('node-fetch');

// ---------- Args from PowerShell ----------
const downloadFolder =
  process.argv[2] ||
  path.join(os.homedir(), 'Downloads', 'QA Tools');

if (!fs.existsSync(downloadFolder)) fs.mkdirSync(downloadFolder, { recursive: true });

(async () => {
  console.log(`[INFO] Download folder: ${downloadFolder}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log('[INFO] Opening Node.js download page...');
  await page.goto('https://nodejs.org/en/download/', { waitUntil: 'domcontentloaded' });

  // --- Find Windows x64 LTS download button ---
  const button = await page.locator('a:has-text("Windows Installer")').first();
  const downloadUrl = await button.getAttribute('href');

  if (!downloadUrl) {
    console.error('[ERROR] Could not find Windows x64 MSI installer URL');
    await browser.close();
    return;
  }

  const fileName = path.basename(downloadUrl);
  const filePath = path.join(downloadFolder, fileName);

  console.log(`[INFO] Downloading: ${fileName}`);

  // --- Download with progress bar ---
  const downloadRes = await fetch(downloadUrl);
  const totalBytes = parseInt(downloadRes.headers.get('content-length'), 10);
  let downloadedBytes = 0;

  const fileStream = fs.createWriteStream(filePath);
  downloadRes.body.on('data', chunk => {
    downloadedBytes += chunk.length;
    const downloadedMB = (downloadedBytes / 1024 / 1024).toFixed(2);
    const totalMB = (totalBytes / 1024 / 1024).toFixed(2);
    process.stdout.write(`\r[DOWNLOAD] ${downloadedMB}MB / ${totalMB}MB`);
  });

  await new Promise((resolve, reject) => {
    downloadRes.body.pipe(fileStream);
    downloadRes.body.on('error', reject);
    fileStream.on('finish', resolve);
  });

  console.log(`\n[SUCCESS] Node.js downloaded to: ${filePath}`);
  await browser.close();
})();
