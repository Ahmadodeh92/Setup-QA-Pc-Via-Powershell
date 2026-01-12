// ======================================
// VsCodeDownload.js - Playwright downloader with progress
// ======================================

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ---------- Args from PowerShell ----------
const downloadFolder =
  process.argv[2] ||
  path.join(os.homedir(), 'Downloads', 'QA Tools');

if (!fs.existsSync(downloadFolder)) {
  fs.mkdirSync(downloadFolder, { recursive: true });
}

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ acceptDownloads: true });
  const page = await context.newPage();

  console.log(`[INFO] Opening VS Code download page...`);
  await page.goto('https://code.visualstudio.com/');

  await page.waitForSelector('#download-buttons-win');

  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: /Download for Windows/i }).click();
  const download = await downloadPromise;

  const filePath = path.join(downloadFolder, download.suggestedFilename());

  // ---- Save with progress (total unknown) ----
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

  console.log(`\n[SUCCESS] VS Code downloaded to: ${filePath}`);

  await browser.close();
})();
