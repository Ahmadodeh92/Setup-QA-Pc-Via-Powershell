// // ======================================
// // PostmanDownload.js
// // Playwright headless downloader
// // ======================================

// const { chromium } = require('playwright');
// const fs = require('fs');
// const path = require('path');
// const os = require('os');

// // ---------- Args from PowerShell ----------
// const downloadFolder =
//   process.argv[2] ||
//   path.join(os.homedir(), 'Downloads', 'QA Tools');

// // ---------- Ensure download folder ----------
// if (!fs.existsSync(downloadFolder)) {
//   fs.mkdirSync(downloadFolder, { recursive: true });
// }

// (async () => {
//   const browser = await chromium.launch({ headless: true });
//   const context = await browser.newContext({ acceptDownloads: true });
//   const page = await context.newPage();

//   // ======================================
//   // STEP 1: OPEN TARGET WEBSITE
//   // ======================================
//   await page.goto('https://www.postman.com/downloads/');

//   // ======================================
//   // STEP 2: ASSERT PAGE (SAFETY CHECK)
//   // ======================================
//   await page.waitForSelector('h1');
//   const h1Text = await page.locator('h1').textContent();
//   if (!h1Text.includes('Download Postman')) {
//     throw new Error('Not on Postman download page');
//   }

//   // ======================================
//   // STEP 3: TRIGGER DOWNLOAD (Windows x64)
//   // ======================================
//   const downloadPromise = page.waitForEvent('download');
//   await page.locator('[data-test="download-the-app-windows-64"]').click();
//   const download = await downloadPromise;

//   // ======================================
//   // STEP 4: SAVE FILE
//   // ======================================
//   const filePath = path.join(
//     downloadFolder,
//     download.suggestedFilename()
//   );

//   await download.saveAs(filePath);
//   console.log(`[SUCCESS] Postman downloaded to: ${filePath}`);

//   await browser.close();
// })();


// ======================================
// PostmanDownload.js - Playwright downloader with progress
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

if (!fs.existsSync(downloadFolder)) {
  fs.mkdirSync(downloadFolder, { recursive: true });
}

(async () => {
  console.log(`[INFO] Download folder: ${downloadFolder}`);

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  console.log('[INFO] Opening Postman download page...');
  await page.goto('https://www.postman.com/downloads/', { waitUntil: 'domcontentloaded' });

  // --- Wait for download button ---
  const button = page.locator('[data-test="download-the-app-windows-64"]').first();
  const downloadUrl = await button.getAttribute('href');

  if (!downloadUrl) {
    console.error('[ERROR] Could not find Windows x64 download URL');
    await browser.close();
    return;
  }

  const fileName = path.basename(downloadUrl);
  const filePath = path.join(downloadFolder, fileName);

  console.log(`[INFO] Downloading: ${fileName}`);

  // --- Download via fetch with progress bar ---
  const res = await fetch(downloadUrl);
  const totalBytes = parseInt(res.headers.get('content-length'), 10);
  let downloadedBytes = 0;

  const fileStream = fs.createWriteStream(filePath);
  res.body.on('data', chunk => {
    downloadedBytes += chunk.length;
    const downloadedMB = (downloadedBytes / 1024 / 1024).toFixed(2);
    const totalMB = (totalBytes / 1024 / 1024).toFixed(2);
    process.stdout.write(`\r[DOWNLOAD] ${downloadedMB}MB / ${totalMB}MB`);
  });

  await new Promise((resolve, reject) => {
    res.body.pipe(fileStream);
    res.body.on('error', reject);
    fileStream.on('finish', resolve);
  });

  console.log(`\n[SUCCESS] Postman downloaded to: ${filePath}`);

  await browser.close();
})();
