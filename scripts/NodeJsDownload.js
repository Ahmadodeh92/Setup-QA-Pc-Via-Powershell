// ======================================
// NodeJsDownload.js (Enhanced with Progress & Fallback)
// ======================================

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');
const https = require('https');
const { URL } = require('url');

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
const arch = process.argv[3] || '64-bit';

if (!fs.existsSync(downloadFolder)) {
    fs.mkdirSync(downloadFolder, { recursive: true });
}

(async () => {
    console.log(`\n${colors.cyan}══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.magenta}              NODE.JS DOWNLOADER                         ${colors.reset}`);
    console.log(`${colors.cyan}══════════════════════════════════════════════════════════${colors.reset}\n`);
    
    console.log(`${colors.yellow}[SYSTEM INFO]${colors.reset}`);
    console.log(`${colors.green}• Download folder:${colors.reset} ${downloadFolder}`);
    console.log(`${colors.green}• Architecture:${colors.reset} ${arch}`);
    console.log(`${colors.green}• Operating System:${colors.reset} ${os.platform()} ${os.arch()}\n`);
    
    console.log(`${colors.magenta}[NODE.JS INFORMATION]${colors.reset}`);
    console.log(`${colors.cyan}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║${colors.reset} ${colors.yellow}NODE.JS${colors.reset} - JavaScript Runtime Environment           ${colors.cyan}║${colors.reset}`);
    console.log(`${colors.cyan}╠══════════════════════════════════════════════════════════╣${colors.reset}`);
    console.log(`${colors.cyan}║${colors.reset} ${colors.green}• Purpose:${colors.reset} Run JavaScript server-side              ${colors.cyan}║${colors.reset}`);
    console.log(`${colors.cyan}║${colors.reset} ${colors.green}• For:${colors.reset} Backend development, npm package manager    ${colors.cyan}║${colors.reset}`);
    console.log(`${colors.cyan}║${colors.reset} ${colors.green}• Includes:${colors.reset} Node.js runtime + npm                 ${colors.cyan}║${colors.reset}`);
    console.log(`${colors.cyan}║${colors.reset} ${colors.green}• Package Manager:${colors.reset} npm (Node Package Manager)     ${colors.cyan}║${colors.reset}`);
    console.log(`${colors.cyan}║${colors.reset} ${colors.green}• Installation:${colors.reset} Windows MSI installer              ${colors.cyan}║${colors.reset}`);
    console.log(`${colors.cyan}║${colors.reset} ${colors.green}• License:${colors.reset} MIT License                           ${colors.cyan}║${colors.reset}`);
    console.log(`${colors.cyan}║${colors.reset} ${colors.green}• Recommended:${colors.reset} For JavaScript/TypeScript dev      ${colors.cyan}║${colors.reset}`);
    console.log(`${colors.cyan}║${colors.reset} ${colors.green}• Size:${colors.reset} ~25-30 MB                                ${colors.cyan}║${colors.reset}`);
    console.log(`${colors.cyan}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);
    
    console.log(`${colors.yellow}[TARGET VERSIONS AVAILABLE]${colors.reset}`);
    console.log(`${colors.green}1.${colors.reset} Node.js LTS (Long Term Support) - Recommended for most users`);
    console.log(`${colors.green}2.${colors.reset} Node.js Current - Latest features (less stable)\n`);
    
    console.log(`${colors.yellow}[DOWNLOAD STRATEGY]${colors.reset}`);
    console.log(`${colors.cyan}•${colors.reset} Method 1: Direct from nodejs.org (Official MSI installer)`);
    console.log(`${colors.cyan}•${colors.reset} Method 2: GitHub releases (fallback)`);
    console.log(`${colors.cyan}•${colors.reset} Method 3: Manual fallback with instructions\n`);
    
    console.log(`${colors.magenta}[TARGET]${colors.reset} Downloading Node.js...\n`);
    
    let downloadSuccess = false;
    let filePath = '';
    let fileName = '';
    let downloadSource = '';
    let nodeVersion = '';
    let downloadMethod = '';
    
    // METHOD 1: Direct from nodejs.org
    try {
        console.log(`${colors.yellow}[METHOD 1]${colors.reset} Getting Node.js from nodejs.org...`);
        
        const browser = await chromium.launch({ 
            headless: true,
            timeout: 30000
        });
        
        const context = await browser.newContext({
            acceptDownloads: true,
            viewport: { width: 1280, height: 800 },
            userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        });
        
        const page = await context.newPage();
        
        console.log(`${colors.yellow}[INFO]${colors.reset} Opening Node.js download page...`);
        await page.goto('https://nodejs.org/en/download/prebuilt-binaries', { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
        
        // Wait for page to load
        await page.waitForSelector('body', { timeout: 10000 });
        
        console.log(`${colors.green}[INFO]${colors.reset} Page loaded successfully`);
        
        // Get Node.js version from page
        const pageText = await page.textContent('body');
        const versionMatch = pageText.match(/Node\.js v(\d+\.\d+\.\d+)/i) || 
                            pageText.match(/Current version: v?(\d+\.\d+\.\d+)/i);
        
        if (versionMatch) {
            nodeVersion = versionMatch[1];
            console.log(`${colors.green}[INFO]${colors.reset} Found Node.js version: ${nodeVersion}`);
        }
        
        // Look for Windows MSI download
        const archText = arch === '64-bit' ? 'x64' : 'x86';
        const downloadSelectors = [
            `a[href*="windows-${archText}.msi"]`,
            `a[href*="node-v"][href*="windows-${archText}.msi"]`,
            `a:has-text("Windows Installer (.msi)")`,
            `a[href$=".msi"]:visible`
        ];
        
        let downloadBtn = null;
        
        for (const selector of downloadSelectors) {
            try {
                const btn = page.locator(selector).first();
                await btn.waitFor({ state: 'visible', timeout: 5000 });
                downloadBtn = btn;
                console.log(`${colors.green}[INFO]${colors.reset} Found download button with selector: ${selector}`);
                break;
            } catch (e) {
                continue;
            }
        }
        
        if (!downloadBtn) {
            // Try to find any MSI link
            const allLinks = await page.$$eval('a', links => 
                links.map(link => ({
                    href: link.href,
                    text: link.textContent.trim()
                })).filter(link => 
                    link.href.includes('.msi') && 
                    (link.text.includes('Windows') || link.text.includes('MSI') || link.text.includes('Installer'))
                )
            );
            
            if (allLinks.length > 0) {
                const msiLink = allLinks[0];
                console.log(`${colors.green}[INFO]${colors.reset} Found MSI link: ${msiLink.text}`);
                
                // Click the link
                const downloadPromise = page.waitForEvent('download');
                await page.evaluate((href) => {
                    const link = document.querySelector(`a[href="${href}"]`);
                    if (link) link.click();
                }, msiLink.href);
                
                const download = await downloadPromise;
                fileName = download.suggestedFilename();
                filePath = path.join(downloadFolder, fileName);
                
                console.log(`${colors.green}[INFO]${colors.reset} Node.js installer: ${fileName}`);
                
                // Download with progress counter
                await downloadWithCounter(download, filePath);
                
                await browser.close();
                
                console.log(`${colors.green}[SUCCESS]${colors.reset} Node.js downloaded to: ${filePath}`);
                downloadSuccess = true;
                downloadSource = 'nodejs.org';
                downloadMethod = 'Direct MSI download';
                
            } else {
                throw new Error('No MSI download links found');
            }
        } else {
            // Click the download button
            const downloadPromise = page.waitForEvent('download');
            await downloadBtn.click();
            const download = await downloadPromise;
            
            fileName = download.suggestedFilename();
            filePath = path.join(downloadFolder, fileName);
            
            console.log(`${colors.green}[INFO]${colors.reset} Node.js installer: ${fileName}`);
            
            // Download with progress counter
            await downloadWithCounter(download, filePath);
            
            await browser.close();
            
            console.log(`${colors.green}[SUCCESS]${colors.reset} Node.js downloaded to: ${filePath}`);
            downloadSuccess = true;
            downloadSource = 'nodejs.org';
            downloadMethod = 'Button click from nodejs.org';
        }
        
    } catch (error) {
        console.log(`${colors.red}[ERROR]${colors.reset} nodejs.org download failed: ${error.message}`);
    }
    
    // METHOD 2: GitHub fallback
    if (!downloadSuccess) {
        console.log(`\n${colors.yellow}[METHOD 2]${colors.reset} Trying GitHub fallback...`);
        
        try {
            const archText = arch === '64-bit' ? 'x64' : 'x86';
            
            // Get latest Node.js LTS version from GitHub
            const githubUrl = `https://github.com/nodejs/node/releases/download/latest-v20.x/node-v20.11.0-win-${archText}.msi`;
            
            console.log(`${colors.green}[INFO]${colors.reset} Using Node.js 20 LTS (GitHub fallback)`);
            
            fileName = `node-v20.11.0-win-${archText}.msi`;
            filePath = path.join(downloadFolder, fileName);
            
            // Clean existing file
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            
            console.log(`${colors.yellow}[INFO]${colors.reset} Downloading: ${fileName}`);
            console.log(`${colors.yellow}[INFO]${colors.reset} From: ${githubUrl}`);
            
            await downloadWithPercentage(githubUrl, filePath);
            
            console.log(`${colors.green}[SUCCESS]${colors.reset} Node.js downloaded to: ${filePath}`);
            downloadSuccess = true;
            downloadSource = 'GitHub (Node.js 20 LTS)';
            downloadMethod = 'Direct GitHub download';
            nodeVersion = '20.11.0';
            
        } catch (error) {
            console.log(`${colors.red}[ERROR]${colors.reset} GitHub download failed: ${error.message}`);
        }
    }
    
    // METHOD 3: Manual fallback
    if (!downloadSuccess) {
        console.log(`\n${colors.yellow}[METHOD 3]${colors.reset} Manual download required`);
        
        console.log(`${colors.red}[ERROR]${colors.reset} Automatic download failed`);
        console.log(`${colors.yellow}[INFO]${colors.reset} Please download Node.js manually:`);
        console.log(`${colors.cyan}1.${colors.reset} Go to: https://nodejs.org/en/download/prebuilt-binaries`);
        console.log(`${colors.cyan}2.${colors.reset} Click "Windows Installer (.msi)" for ${arch}`);
        console.log(`${colors.cyan}3.${colors.reset} Or visit: https://nodejs.org/en/download/`);
        console.log(`${colors.cyan}4.${colors.reset} Save the file to: ${downloadFolder}`);
        
        process.exit(1);
    }
    
    // Show results
    await showResults(filePath, fileName, nodeVersion, arch, downloadSource, downloadMethod);
    
    process.exit(0);
})();

// Download function with byte counter (for Playwright downloads)
async function downloadWithCounter(download, outputPath) {
    return new Promise((resolve, reject) => {
        let downloadedBytes = 0;
        
        const spinnerFrames = ['/', '-', '\\', '|'];
        const spinnerColors = [colors.red, colors.blue, colors.yellow, colors.green];
        let step = 0;
        
        const progressInterval = setInterval(() => {
            const char = spinnerFrames[step % spinnerFrames.length];
            const color = spinnerColors[step % spinnerColors.length];
            
            const downloadedMB = (downloadedBytes / (1024 * 1024)).toFixed(2);
            process.stdout.write(`\r${colors.cyan}[Downloading]${colors.reset} ${color}${char}${colors.reset} | ${colors.yellow}${downloadedMB} MB${colors.reset}`);
            step++;
        }, 100);
        
        const writeStream = fs.createWriteStream(outputPath);
        
        download.createReadStream().then(readStream => {
            readStream.on('data', (chunk) => {
                downloadedBytes += chunk.length;
            });
            
            readStream.pipe(writeStream);
            
            writeStream.on('finish', () => {
                clearInterval(progressInterval);
                process.stdout.write(`\r${' '.repeat(80)}\r`);
                console.log(`${colors.green}[Complete]${colors.reset} ${colors.green}✓${colors.reset} | ${colors.yellow}Download finished${colors.reset}`);
                resolve();
            });
            
            writeStream.on('error', reject);
        }).catch(reject);
    });
}

// Download function with percentage (for direct URL downloads)
async function downloadWithPercentage(url, outputPath) {
    return new Promise((resolve, reject) => {
        console.log(`${colors.green}[INFO]${colors.reset} Starting download from: ${url}`);
        
        let downloadedBytes = 0;
        let totalBytes = 0;
        let percent = "0.00";
        
        const spinnerFrames = ['/', '-', '\\', '|'];
        const spinnerColors = [colors.red, colors.blue, colors.yellow, colors.green];
        let step = 0;
        let progressInterval = null;
        
        function followRedirects(url, callback, redirectCount = 0) {
            if (redirectCount > 5) {
                callback(new Error('Too many redirects'));
                return;
            }
            
            try {
                const urlObj = new URL(url);
                const options = {
                    headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                    },
                    timeout: 30000
                };
                
                const req = https.get(urlObj, options, (response) => {
                    if ([301, 302, 307, 308].includes(response.statusCode)) {
                        const redirectUrl = response.headers.location;
                        if (redirectUrl) {
                            const resolvedUrl = new URL(redirectUrl, urlObj.origin);
                            console.log(`${colors.yellow}[INFO]${colors.reset} Redirect to: ${resolvedUrl.href}`);
                            followRedirects(resolvedUrl.href, callback, redirectCount + 1);
                        } else {
                            callback(new Error('Redirect with no location'));
                        }
                        response.destroy();
                    } else if (response.statusCode === 200) {
                        callback(null, response);
                    } else {
                        callback(new Error(`HTTP ${response.statusCode}`));
                    }
                });
                
                req.on('error', callback);
                req.on('timeout', () => {
                    req.destroy();
                    callback(new Error('Request timeout'));
                });
                
            } catch (error) {
                callback(error);
            }
        }
        
        // Start download
        followRedirects(url, (error, response) => {
            if (error) {
                reject(error);
                return;
            }
            
            totalBytes = parseInt(response.headers['content-length'], 10) || 30000000;
            const fileSizeMB = (totalBytes / (1024 * 1024)).toFixed(2);
            console.log(`${colors.yellow}[INFO]${colors.reset} File size: ${fileSizeMB} MB`);
            
            progressInterval = setInterval(() => {
                const char = spinnerFrames[step % spinnerFrames.length];
                const color = spinnerColors[step % spinnerColors.length];
                process.stdout.write(`\r${colors.cyan}[Downloading]${colors.reset} ${color}${char}${colors.reset} | ${colors.yellow}${percent}%${colors.reset}`);
                step++;
            }, 100);
            
            const fileStream = fs.createWriteStream(outputPath);
            
            response.on('data', (chunk) => {
                downloadedBytes += chunk.length;
                let calcPercent = ((downloadedBytes / totalBytes) * 100).toFixed(2);
                percent = Math.min(calcPercent, 100);
                fileStream.write(chunk);
            });
            
            response.on('end', () => {
                fileStream.end();
                clearInterval(progressInterval);
                process.stdout.write(`\r${' '.repeat(80)}\r`);
                console.log(`${colors.green}[Complete]${colors.reset} ${colors.green}✓${colors.reset} | ${colors.yellow}100.00%${colors.reset}`);
                resolve();
            });
            
            response.on('error', reject);
            fileStream.on('error', reject);
        });
        
        setTimeout(() => {
            if (progressInterval) clearInterval(progressInterval);
            reject(new Error('Download timeout'));
        }, 300000);
    });
}

// Function to show results
async function showResults(filePath, fileName, version, arch, source, method) {
    console.log(`\n${colors.cyan}══════════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.magenta}                 DOWNLOAD COMPLETE                       ${colors.reset}`);
    console.log(`${colors.cyan}══════════════════════════════════════════════════════════${colors.reset}\n`);
    
    console.log(`${colors.yellow}[FILE INFORMATION]${colors.reset}`);
    
    try {
        const stats = fs.statSync(filePath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`${colors.green}• Size:${colors.reset} ${fileSizeMB} MB`);
    } catch (e) {}
    
    const fileType = fileName.endsWith('.msi') ? 'Windows Installer (.msi)' :
                    fileName.endsWith('.exe') ? 'Windows Executable (.exe)' :
                    'Installation Package';
    
    console.log(`${colors.green}• File:${colors.reset} ${fileName}`);
    console.log(`${colors.green}• Type:${colors.reset} ${fileType}`);
    console.log(`${colors.green}• Location:${colors.reset} ${filePath}`);
    console.log(`${colors.green}• Description:${colors.reset} Node.js Runtime + npm`);
    console.log(`${colors.green}• Version:${colors.reset} ${version || 'Latest'}`);
    console.log(`${colors.green}• Source:${colors.reset} ${source}`);
    console.log(`${colors.green}• Method:${colors.reset} ${method}`);
    console.log(`${colors.green}• Architecture:${colors.reset} ${arch}\n`);
    
    console.log(`${colors.magenta}[INSTALLATION INSTRUCTIONS]${colors.reset}`);
    console.log(`${colors.cyan}1.${colors.reset} Double-click the file: ${filePath}`);
    console.log(`${colors.cyan}2.${colors.reset} Follow the installation wizard (recommend default settings)`);
    console.log(`${colors.cyan}3.${colors.reset} Restart your computer if prompted`);
    console.log(`${colors.cyan}4.${colors.reset} Verify installation by opening Command Prompt:`);
    console.log(`   ${colors.green}node --version${colors.reset} - Check Node.js version`);
    console.log(`   ${colors.green}npm --version${colors.reset} - Check npm version\n`);
    
    console.log(`${colors.yellow}[POST-INSTALLATION VERIFICATION]${colors.reset}`);
    console.log(`${colors.green}node --version${colors.reset} - Should show: v${version || 'x.x.x'}`);
    console.log(`${colors.green}npm --version${colors.reset} - Should show npm version`);
    console.log(`${colors.green}npx --version${colors.reset} - Should show npx version\n`);
    
    console.log(`${colors.magenta}[DOWNLOAD SUMMARY]${colors.reset}`);
    console.log(`${colors.magenta}[FILE_PATH]${colors.reset} ${filePath}`);
    console.log(`${colors.magenta}[FILE_NAME]${colors.reset} ${fileName}`);
    console.log(`${colors.magenta}[FILE_TYPE]${colors.reset} ${fileType.split(' ')[0]}`);
    console.log(`${colors.magenta}[SOFTWARE]${colors.reset} Node.js`);
    console.log(`${colors.magenta}[VERSION]${colors.reset} ${version || 'Latest'}`);
    console.log(`${colors.magenta}[ARCHITECTURE]${colors.reset} ${arch}`);
    console.log(`${colors.magenta}[SOURCE]${colors.reset} ${source}`);
    console.log(`${colors.magenta}[METHOD]${colors.reset} ${method}`);
}