// // ======================================
// // JavaDownload.js
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
//   await page.goto('https://www.java.com/en/download/');

//   // ======================================
//   // STEP 2: ASSERT PAGE (SAFETY CHECK)
//   // ======================================
//   await page.waitForSelector('h1');
//   const h1Text = await page.locator('h1').textContent();
//   if (!h1Text.includes('Download Java')) {
//     throw new Error('Not on Java download page');
//   }

//   // ======================================
//   // STEP 3: TRIGGER DOWNLOAD
//   // ======================================
//   const downloadPromise = page.waitForEvent('download');
//   await page.getByRole('link', { name: 'Download Java for Desktops' }).click();
//   const download = await downloadPromise;

//   // ======================================
//   // STEP 4: SAVE FILE
//   // ======================================
//   const filePath = path.join(
//     downloadFolder,
//     download.suggestedFilename()
//   );

//   await download.saveAs(filePath);
//   console.log(`[SUCCESS] Java downloaded to: ${filePath}`);

//   await browser.close();
// })();

// ======================================
// JavaDownload.js - Playwright downloader with progress
// ======================================

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ---------- Args from PowerShell ----------
const downloadFolder =
  process.argv[2] ||
  path.join(os.homedir(), 'Downloads', 'QA Tools');

// ---------- Ensure download folder ----------
if (!fs.existsSync(downloadFolder)) {
  fs.mkdirSync(downloadFolder, { recursive: true });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  console.log(`[INFO] Opening Java download page...`);
  await page.goto('https://www.java.com/en/download/');

  await page.waitForSelector('h1');
  const h1Text = await page.locator('h1').textContent();
  if (!h1Text.includes('Download Java')) {
    throw new Error('Not on Java download page');
  }

  console.log(`[INFO] Starting download of Java installer...`);
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('link', { name: 'Download Java for Desktops' }).click();
  const download = await downloadPromise;

  const filePath = path.join(downloadFolder, download.suggestedFilename());

  // ---- Save with progress ----
  const readStream = await download.createReadStream();
  const writeStream = fs.createWriteStream(filePath);

  let downloadedBytes = 0;
  readStream.on('data', chunk => {
    downloadedBytes += chunk.length;
    const downloadedMB = (downloadedBytes / 1024 / 1024).toFixed(2);
    process.stdout.write(`\r[DOWNLOAD] ${downloadedMB} MB of ?? MB`);
  });

  await new Promise((resolve, reject) => {
    readStream.pipe(writeStream);
    readStream.on('error', reject);
    writeStream.on('finish', resolve);
  });

  console.log(`\n[SUCCESS] Java downloaded to: ${filePath}`);

  await browser.close();
})();
