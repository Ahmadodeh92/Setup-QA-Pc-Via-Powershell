// // ======================================
// // AndroidStudioDownload.js - Playwright downloader (fixed strict mode)
// // ======================================

// const { chromium } = require('playwright');
// const fs = require('fs');
// const path = require('path');
// const os = require('os');

// // ---------- Args from PowerShell ----------
// const downloadFolder = process.argv[2] || path.join(os.homedir(), 'Downloads', 'QA Tools');

// if (!fs.existsSync(downloadFolder)) fs.mkdirSync(downloadFolder, { recursive: true });

// (async () => {
//     console.log(`[INFO] Download folder: ${downloadFolder}`);

//     const browser = await chromium.launch({ headless: true });
//     const context = await browser.newContext({ acceptDownloads: true });
//     const page = await context.newPage();

//     console.log(`[INFO] Opening Android Studio download page...`);
//     await page.goto('https://developer.android.com/studio');

//     // --- Wait for page content to ensure page loaded ---
//     await page.waitForSelector('#android-studio');

//     // --- Click main download button ---
//     const mainDownloadButton = page.getByRole('button', { name: /Download Android Studio/i });
//     await mainDownloadButton.click();

//     // --- Accept license checkbox if present ---
//     const licenseCheckbox = page.getByRole('checkbox', { name: /I have read and agree/i });
//     if (await licenseCheckbox.count() > 0) {
//         await licenseCheckbox.check();
//         console.log("[INFO] License agreement checked");
//     }

//     // --- Select the exact installer link by ID for Windows EXE ---
//     // This is the official download button for Windows installer
//     const downloadLink = page.locator('#agree-button__studio_win_notools_exe_download');

//     // --- Wait for download event and trigger download ---
//     const [download] = await Promise.all([
//         page.waitForEvent('download'),
//         downloadLink.click()
//     ]);

//     // --- Save the downloaded file into QA Tools folder ---
//     const filePath = path.join(downloadFolder, download.suggestedFilename());
//     await download.saveAs(filePath);

//     console.log(`[SUCCESS] Android Studio downloaded to: ${filePath}`);

//     await browser.close();
// })();


// ======================================
// AndroidStudioDownload.js - Playwright downloader with progress
// ======================================

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ---------- Args from PowerShell ----------
const downloadFolder = process.argv[2] || path.join(os.homedir(), 'Downloads', 'QA Tools');

if (!fs.existsSync(downloadFolder)) fs.mkdirSync(downloadFolder, { recursive: true });

(async () => {
    console.log(`[INFO] Download folder: ${downloadFolder}`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();

    console.log(`[INFO] Opening Android Studio download page...`);
    await page.goto('https://developer.android.com/studio');

    // --- Wait for page content to ensure page loaded ---
    await page.waitForSelector('#android-studio');

    // --- Click main download button ---
    const mainDownloadButton = page.getByRole('button', { name: /Download Android Studio/i });
    await mainDownloadButton.click();

    // --- Accept license checkbox if present ---
    const licenseCheckbox = page.getByRole('checkbox', { name: /I have read and agree/i });
    if (await licenseCheckbox.count() > 0) {
        await licenseCheckbox.check();
        console.log("[INFO] License agreement checked");
    }

    // --- Select the exact installer link by ID for Windows EXE ---
    const downloadLink = page.locator('#agree-button__studio_win_notools_exe_download');

    // --- Wait for download event and track progress ---
    const [download] = await Promise.all([
        page.waitForEvent('download'),
        downloadLink.click()
    ]);

    const filePath = path.join(downloadFolder, download.suggestedFilename());

    // --- Stream download to file with progress ---
    const downloadStream = await download.createReadStream();
    const fileStream = fs.createWriteStream(filePath);

    let downloadedBytes = 0;
    const totalBytes = download.totalBytes() || 0; // fallback if totalBytes is unknown

    downloadStream.on('data', chunk => {
        downloadedBytes += chunk.length;
        if (totalBytes) {
            const percent = ((downloadedBytes / totalBytes) * 100).toFixed(2);
            process.stdout.write(`\r[DOWNLOAD] ${ (downloadedBytes / 1024 / 1024).toFixed(2) } MB of ${(totalBytes / 1024 / 1024).toFixed(2)} MB (${percent}%)`);
        } else {
            process.stdout.write(`\r[DOWNLOAD] ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB downloaded`);
        }
    });

    downloadStream.pipe(fileStream);

    await new Promise(resolve => fileStream.on('finish', resolve));

    console.log(`\n[SUCCESS] Android Studio downloaded to: ${filePath}`);

    await browser.close();
})();
