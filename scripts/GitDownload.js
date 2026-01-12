// ======================================
// GitDownload.js - Playwright automation
// ======================================

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

// --- Read arguments from PowerShell ---
const downloadFolder = process.argv[2] || path.join(require('os').homedir(), 'Downloads', 'QA Tools');
const arch = process.argv[3] || (process.arch === 'x64' ? '64-bit' : '32-bit');

(async () => {
    console.log(`[INFO] Download folder: ${downloadFolder}`);
    console.log(`[INFO] Detected architecture: ${arch}`);

    // --- Ensure folder exists ---
    if (!fs.existsSync(downloadFolder)) fs.mkdirSync(downloadFolder, { recursive: true });

    // --- Launch browser ---
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();

    console.log(`[INFO] Opening Git SCM website...`);
    await page.goto('https://git-scm.com/');

    // --- Wait for page to load Masthead text to ensure site is ready ---
    await page.waitForSelector('#masthead');

    // --- Click "Install for Windows" ---
    const installLink = page.getByRole('link', { name: 'Install for Windows' });
    await installLink.click();

    // --- Wait for Install page ---
    await page.waitForSelector('h1');

    // --- Click Windows tab ---
    const windowsTab = page.getByRole('tab', { name: 'Windows' });
    await windowsTab.click();

    // --- Wait for download link ---
    const downloadLink = page.getByRole('link', { name: 'Click here to download' });

    // --- Trigger download ---
    const downloadPromise = page.waitForEvent('download');
    await downloadLink.click();
    const download = await downloadPromise;

    // --- Save downloaded file to QA Tools folder ---
    const fileName = download.suggestedFilename();
    const filePath = path.join(downloadFolder, fileName);
    await download.saveAs(filePath);

    console.log(`[SUCCESS] Git installer downloaded to: ${filePath}`);

    await browser.close();
})();
