// ======================================
// VsCodeDownload.js
// ======================================

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

const colors = { reset: "\x1b[0m", red: "\x1b[31m", blue: "\x1b[34m", yellow: "\x1b[33m", green: "\x1b[32m", cyan: "\x1b[36m" };
const downloadFolder = process.argv[2] || path.join(os.homedir(), 'Downloads', 'QA Tools');
if (!fs.existsSync(downloadFolder)) fs.mkdirSync(downloadFolder, { recursive: true });

(async () => {
    const browser = await chromium.launch({ headless: true });
    const page = await (await browser.newContext({ acceptDownloads: true })).newPage();

    console.log(`${colors.yellow}[INFO]${colors.reset} Opening VS Code download page...`);
    await page.goto('https://code.visualstudio.com/', { waitUntil: 'domcontentloaded' });

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Download for Windows/i }).click();
    const download = await downloadPromise;

    const filePath = path.join(downloadFolder, download.suggestedFilename());
    const readStream = await download.createReadStream();
    const fileStream = fs.createWriteStream(filePath);

    const spinnerFrames = ['/', '-', '\\', '|'], spinnerColors = [colors.red, colors.blue, colors.yellow, colors.green];
    let step = 0;
    const progressInterval = setInterval(() => {
        process.stdout.write(`\r${colors.cyan}[Downloading]${colors.reset} ${spinnerColors[step % 4]}${spinnerFrames[step % 4]}${colors.reset}`);
        step++;
    }, 100);

    await new Promise((resolve) => {
        readStream.pipe(fileStream);
        fileStream.on('finish', resolve);
    });

    clearInterval(progressInterval);
    process.stdout.write(`\r${' '.repeat(80)}\r`); 
    console.log(`${colors.green}[SUCCESS]${colors.reset} VS Code downloaded to: ${filePath}`);
    await browser.close();
})();