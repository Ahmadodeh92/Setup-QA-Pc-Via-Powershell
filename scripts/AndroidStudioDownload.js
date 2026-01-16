// ======================================
// AndroidStudioDownload.js
// ======================================

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');

// ANSI color codes
const colors = {
    reset: "\x1b[0m",
    red: "\x1b[31m",
    blue: "\x1b[34m",
    yellow: "\x1b[33m",
    green: "\x1b[32m",
    cyan: "\x1b[36m",
    magenta: "\x1b[35m"
};

const downloadFolder = process.argv[2] || path.join(os.homedir(), 'Downloads', 'QA Tools');

if (!fs.existsSync(downloadFolder)) fs.mkdirSync(downloadFolder, { recursive: true });

(async () => {
    console.log(`${colors.yellow}[INFO]${colors.reset} Download folder: ${downloadFolder}`);

    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({ acceptDownloads: true });
    const page = await context.newPage();

    console.log(`${colors.yellow}[INFO]${colors.reset} Opening Android Studio download page...`);
    await page.goto('https://developer.android.com/studio');

    await page.waitForSelector('#android-studio');

    const mainDownloadButton = page.getByRole('button', { name: /Download Android Studio/i });
    await mainDownloadButton.click();

    const licenseCheckbox = page.getByRole('checkbox', { name: /I have read and agree/i });
    if (await licenseCheckbox.count() > 0) {
        await licenseCheckbox.check();
        console.log(`${colors.yellow}[INFO]${colors.reset} License agreement checked`);
    }

    const downloadLink = page.locator('#agree-button__studio_win_notools_exe_download');

    const [download] = await Promise.all([
        page.waitForEvent('download'),
        downloadLink.click()
    ]);

    const filePath = path.join(downloadFolder, download.suggestedFilename());
    console.log(`${colors.yellow}[INFO]${colors.reset} Starting download: ${download.suggestedFilename()}`);

    // --- Progress Variables ---
    const spinnerFrames = ['/', '-', '\\', '|'];
    const spinnerColors = [colors.red, colors.blue, colors.yellow, colors.green];
    let step = 0;

    // --- The Animation Interval ---
    const progressInterval = setInterval(() => {
        const char = spinnerFrames[step % spinnerFrames.length];
        const color = spinnerColors[step % spinnerColors.length];
        process.stdout.write(`\r${colors.cyan}[Downloading]${colors.reset} ${color}${char}${colors.reset}`);
        step++;
    }, 100);

    // --- Download and Pipe Stream ---
    const downloadStream = await download.createReadStream();
    const fileStream = fs.createWriteStream(filePath);

    await new Promise((resolve, reject) => {
        downloadStream.pipe(fileStream);
        downloadStream.on('error', (err) => {
            clearInterval(progressInterval);
            reject(err);
        });
        fileStream.on('finish', resolve);
    });

    clearInterval(progressInterval);
    process.stdout.write(`\r${' '.repeat(80)}\r`); 

    console.log(`${colors.green}[SUCCESS]${colors.reset} Android Studio downloaded to: ${filePath}`);

    await browser.close();
})();