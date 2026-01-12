// // ======================================
// // EclipseDownload.js - Headless Playwright Downloader
// // ======================================

// import { chromium } from 'playwright';
// import fs from 'fs';
// import path from 'path';
// import os from 'os';

// // ---------- Args from PowerShell ----------
// const downloadFolder =
//   process.argv[2] || path.join(os.homedir(), 'Downloads', 'QA Tools');

// // ---------- Ensure download folder ----------
// if (!fs.existsSync(downloadFolder)) {
//   fs.mkdirSync(downloadFolder, { recursive: true });
// }

// (async () => {
//   console.log(`[INFO] Download folder: ${downloadFolder}`);

//   const browser = await chromium.launch({ headless: true });
//   const context = await browser.newContext({ acceptDownloads: true });
//   const page = await context.newPage();

//   console.log('[INFO] Opening Eclipse website...');
//   await page.goto('https://www.eclipse.org/downloads/', { waitUntil: 'domcontentloaded' });

//   // ---- Click "Download" for Eclipse IDE for Java Developers ----
//   const ideLink = await page.getByRole('link', { name: /Eclipse IDE for Java Developers/i }).first();
//   await ideLink.scrollIntoViewIfNeeded();
//   await ideLink.click();

//   // ---- Wait for "Windows x86_64" link ----
//   const winLink = await page.getByRole('link', { name: /Windows x86_64/i }).first();
//   await winLink.scrollIntoViewIfNeeded();

//   console.log('[INFO] Found Windows x86_64 installer, starting download...');
//   const downloadPromise = page.waitForEvent('download');
//   await winLink.click();

//   const download = await downloadPromise;

//   // ---- Save file to download folder ----
//   const filePath = path.join(downloadFolder, download.suggestedFilename());
//   await download.saveAs(filePath);

//   console.log(`[SUCCESS] Eclipse IDE for Java Developers downloaded to: ${filePath}`);

//   await browser.close();
// })();

// ======================================
// EclipseDownload.js - Headless Playwright Downloader with Progress
// ======================================

import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import os from 'os';

// ---------- Args from PowerShell ----------
const downloadFolder =
  process.argv[2] || path.join(os.homedir(), 'Downloads', 'QA Tools');

// ---------- Ensure download folder ----------
if (!fs.existsSync(downloadFolder)) {
  fs.mkdirSync(downloadFolder, { recursive: true });
}

(async () => {
  console.log(`[INFO] Download folder: ${downloadFolder}`);

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  console.log('[INFO] Opening Eclipse website...');
  await page.goto('https://www.eclipse.org/downloads/', { waitUntil: 'domcontentloaded' });

  // ---- Click "Download" for Eclipse IDE for Java Developers ----
  const ideLink = await page.getByRole('link', { name: /Eclipse IDE for Java Developers/i }).first();
  await ideLink.scrollIntoViewIfNeeded();
  await ideLink.click();

  // ---- Wait for "Windows x86_64" link ----
  const winLink = await page.getByRole('link', { name: /Windows x86_64/i }).first();
  await winLink.scrollIntoViewIfNeeded();

  console.log('[INFO] Found Windows x86_64 installer, starting download...');

  // ---- Download with progress ----
  const downloadPromise = page.waitForEvent('download');
  await winLink.click();
  const download = await downloadPromise;

  // Get file size from headers (if available)
  const downloadUrl = download.url();
  const res = await page.request.get(downloadUrl, { headers: { 'User-Agent': 'QA-Tools-Downloader' } });
  const totalBytes = parseInt(res.headers()['content-length']) || 0;

  const filePath = path.join(downloadFolder, download.suggestedFilename());
  const fileStream = fs.createWriteStream(filePath);

  let downloadedBytes = 0;
  const reader = res.body;

  if (reader) {
    reader.on('data', chunk => {
      downloadedBytes += chunk.length;
      if (totalBytes) {
        const percent = ((downloadedBytes / totalBytes) * 100).toFixed(2);
        process.stdout.write(
          `\r[DOWNLOAD] ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB of ${(totalBytes / 1024 / 1024).toFixed(2)} MB (${percent}%)`
        );
      } else {
        process.stdout.write(`\r[DOWNLOAD] ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB downloaded`);
      }
    });

    await new Promise((resolve, reject) => {
      reader.pipe(fileStream);
      reader.on('error', reject);
      fileStream.on('finish', resolve);
    });
  } else {
    // fallback if stream not available
    await download.saveAs(filePath);
  }

  console.log(`\n[SUCCESS] Eclipse IDE for Java Developers downloaded to: ${filePath}`);

  await browser.close();
})();
