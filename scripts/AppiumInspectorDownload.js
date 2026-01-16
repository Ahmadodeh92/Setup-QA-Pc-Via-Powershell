// ======================================
// AppiumInspectorDownload.js (Fixed)
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
const arch = process.argv[3] || (process.arch === 'x64' ? '64-bit' : '32-bit');

(async () => {
    console.log(`${colors.yellow}[INFO]${colors.reset} Download folder: ${downloadFolder}`);
    console.log(`${colors.yellow}[INFO]${colors.reset} Detected architecture: ${arch}`);
    
    if (!fs.existsSync(downloadFolder)) {
        fs.mkdirSync(downloadFolder, { recursive: true });
    }

    console.log(`${colors.yellow}[INFO]${colors.reset} Checking for latest Appium Inspector version...`);
    
    // Get version from Appium official website (optional - Appium doesn't have a direct download page like Git)
    let appiumWebsiteVersion = null;
    let appiumWebsiteUrl = null;
    
    try {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        // Try the Appium Inspector releases page directly
        await page.goto('https://github.com/appium/appium-inspector/releases', { 
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        
        await page.waitForLoadState('networkidle');
        
        // Look for the latest Windows release
        const links = await page.$$eval('a', (anchors, targetArch) => {
            return anchors.map(a => ({
                href: a.href,
                text: a.textContent,
                innerHTML: a.innerHTML
            })).filter(link => {
                const href = link.href.toLowerCase();
                const text = link.text.toLowerCase();
                return (href.includes('.exe') || text.includes('.exe')) &&
                       (targetArch === '64-bit' ? 
                        (href.includes('64') || href.includes('x64') || text.includes('64')) : 
                        (href.includes('32') || href.includes('x86') || text.includes('32'))) &&
                       (href.includes('appium-inspector') || text.includes('appium inspector'));
            });
        }, arch);
        
        if (links.length > 0) {
            appiumWebsiteUrl = links[0].href;
            if (!appiumWebsiteUrl.startsWith('http')) {
                appiumWebsiteUrl = 'https://github.com' + appiumWebsiteUrl;
            }
            
            // Try to extract version from URL or text
            const versionMatch = appiumWebsiteUrl.match(/releases\/download\/v?(\d+\.\d+\.\d+)/) || 
                               links[0].text.match(/v?(\d+\.\d+\.\d+)/);
            appiumWebsiteVersion = versionMatch ? versionMatch[1] : null;
        }
        
        await browser.close();
        
        if (appiumWebsiteVersion) {
            console.log(`${colors.green}[INFO]${colors.reset} GitHub Releases page version: v${appiumWebsiteVersion}`);
        }
    } catch (error) {
        console.log(`${colors.yellow}[WARNING]${colors.reset} Could not get version from GitHub releases page: ${error.message}`);
    }
    
    // Get version from GitHub API (more reliable)
    let gitHubVersion = null;
    let gitHubUrl = null;
    
    try {
        gitHubVersion = await new Promise((resolve, reject) => {
            https.get('https://api.github.com/repos/appium/appium-inspector/releases/latest', {
                headers: { 'User-Agent': 'Node.js' }
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        const version = json.tag_name.replace(/^v/, '');
                        
                        // Find Windows installer in assets
                        const assets = json.assets || [];
                        
                        // Look for Windows installer (Appium Inspector uses different naming)
                        const winAsset = assets.find(a => {
                            const name = a.name.toLowerCase();
                            return (name.includes('windows') || name.includes('.exe')) &&
                                   (arch === '64-bit' ? 
                                    (name.includes('64') || name.includes('x64')) : 
                                    (name.includes('32') || name.includes('x86'))) &&
                                   name.includes('appium');
                        });
                        
                        // If no specific Windows asset, try any .exe
                        if (!winAsset) {
                            const exeAsset = assets.find(a => a.name.toLowerCase().endsWith('.exe'));
                            if (exeAsset) {
                                gitHubUrl = exeAsset.browser_download_url;
                            }
                        } else {
                            gitHubUrl = winAsset.browser_download_url;
                        }
                        
                        // If still no URL, use direct download pattern
                        if (!gitHubUrl) {
                            // Try the direct download URL pattern
                            gitHubUrl = `https://github.com/appium/appium-inspector/releases/download/v${version}/Appium-Inspector-windows-${arch === '64-bit' ? 'x64' : 'x86'}.exe`;
                        }
                        
                        resolve(version);
                    } catch (err) {
                        reject(err);
                    }
                });
            }).on('error', reject);
        });
        
        console.log(`${colors.green}[INFO]${colors.reset} GitHub API version: v${gitHubVersion}`);
    } catch (error) {
        console.log(`${colors.yellow}[WARNING]${colors.reset} Could not get version from GitHub API: ${error.message}`);
    }
    
    // Compare versions and select source
    let downloadUrl = null;
    let downloadSource = '';
    let selectedVersion = '';
    
    function compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const num1 = parts1[i] || 0;
            const num2 = parts2[i] || 0;
            if (num1 > num2) return 1;
            if (num1 < num2) return -1;
        }
        return 0;
    }
    
    // Prioritize GitHub API (more reliable for Appium Inspector)
    if (gitHubVersion) {
        downloadSource = 'GitHub';
        selectedVersion = gitHubVersion;
        
        if (gitHubUrl) {
            downloadUrl = gitHubUrl;
        } else {
            // Fallback to direct URL pattern
            downloadUrl = `https://github.com/appium/appium-inspector/releases/latest/download/Appium-Inspector-windows-${arch === '64-bit' ? 'x64' : 'x86'}.exe`;
        }
    } else if (appiumWebsiteVersion) {
        downloadUrl = appiumWebsiteUrl;
        downloadSource = 'GitHub Releases Page';
        selectedVersion = appiumWebsiteVersion;
    } else {
        // Ultimate fallback - direct to latest Windows download
        downloadUrl = `https://github.com/appium/appium-inspector/releases/latest/download/Appium-Inspector-windows-${arch === '64-bit' ? 'x64' : 'x86'}.exe`;
        downloadSource = 'Direct GitHub';
        selectedVersion = 'latest';
        console.log(`${colors.yellow}[WARNING]${colors.reset} Could not determine version, downloading latest...`);
    }
    
    console.log(`${colors.cyan}[SELECTED]${colors.reset} Using ${downloadSource} (v${selectedVersion})`);
    console.log(`${colors.yellow}[INFO]${colors.reset} Download URL: ${downloadUrl}`);
    
    // Determine filename
    let fileName = `Appium-Inspector-${arch}-${selectedVersion}.exe`;
    try {
        const urlObj = new URL(downloadUrl);
        const urlFileName = path.basename(urlObj.pathname);
        if (urlFileName && urlFileName.includes('.exe')) {
            fileName = urlFileName;
        }
    } catch (e) {
        // URL parsing failed, use default filename
    }
    
    const filePath = path.join(downloadFolder, fileName);
    
    console.log(`${colors.yellow}[INFO]${colors.reset} Downloading: ${fileName}`);
    
    // Always use percentage for GitHub URLs
    const isGitHubUrl = downloadUrl.includes('github.com') || downloadUrl.includes('githubusercontent.com');
    
    if (isGitHubUrl) {
        console.log(`${colors.yellow}[INFO]${colors.reset} Using progress tracking...`);
        await downloadWithPercentage(downloadUrl, filePath);
    } else {
        console.log(`${colors.yellow}[INFO]${colors.reset} Using direct download...`);
        await downloadWithSpinner(downloadUrl, filePath);
    }
    
    console.log(`${colors.green}[SUCCESS]${colors.reset} Appium Inspector downloaded to: ${filePath}`);
    
    // IMPORTANT: This tells the batch file that download is complete
    console.log(`\n${colors.magenta}[DOWNLOAD_COMPLETE]${colors.reset}`);
    console.log(`${colors.magenta}[FILE_PATH]${colors.reset} ${filePath}`);
    
    // Exit with success code
    process.exit(0);
})();

// Function for direct links - shows spinner only
async function downloadWithSpinner(url, outputPath) {
    console.log(`${colors.yellow}[INFO]${colors.reset} Using direct download (no progress available)...`);
    
    const spinnerFrames = ['/', '-', '\\', '|'];
    const spinnerColors = [colors.red, colors.blue, colors.yellow, colors.green];
    let step = 0;
    
    const spinnerInterval = setInterval(() => {
        const char = spinnerFrames[step % spinnerFrames.length];
        const color = spinnerColors[step % spinnerColors.length];
        process.stdout.write(`\r${colors.cyan}[Downloading]${colors.reset} ${color}${char}${colors.reset}`);
        step++;
    }, 100);
    
    try {
        // Use simple https download for any direct link
        await new Promise((resolve, reject) => {
            const fileStream = fs.createWriteStream(outputPath);
            https.get(url, (response) => {
                response.pipe(fileStream);
                fileStream.on('finish', () => {
                    clearInterval(spinnerInterval);
                    process.stdout.write(`\r${' '.repeat(60)}\r`);
                    console.log(`${colors.green}[COMPLETE]${colors.reset} Download finished!`);
                    resolve();
                });
                fileStream.on('error', reject);
            }).on('error', reject);
        });
    } catch (error) {
        clearInterval(spinnerInterval);
        throw error;
    }
}

// Function for GitHub links - shows percentage
async function downloadWithPercentage(url, outputPath) {
    console.log(`${colors.yellow}[INFO]${colors.reset} Downloading with progress tracking...`);
    
    return new Promise((resolve, reject) => {
        let downloadedBytes = 0;
        let totalBytes = 0;
        let percent = "0.00";
        
        const spinnerFrames = ['/', '-', '\\', '|'];
        const spinnerColors = [colors.red, colors.blue, colors.yellow, colors.green];
        let step = 0;
        let progressInterval = null;

        // Start progress display
        progressInterval = setInterval(() => {
            const char = spinnerFrames[step % spinnerFrames.length];
            const color = spinnerColors[step % spinnerColors.length];
            process.stdout.write(`\r${colors.cyan}[Downloading]${colors.reset} ${color}${char}${colors.reset} | ${colors.yellow}${percent}%${colors.reset}`);
            step++;
        }, 100);

        // Follow redirects
        function followRedirects(url, callback) {
            const req = https.get(url, (response) => {
                if ([301, 302, 307, 308].includes(response.statusCode)) {
                    const redirectUrl = response.headers.location;
                    if (redirectUrl) {
                        // Don't show redirect message to avoid cluttering display
                        followRedirects(redirectUrl, callback);
                    } else {
                        callback(new Error('Redirect with no location'));
                    }
                    response.destroy();
                } else {
                    callback(null, response);
                }
            });
            req.on('error', callback);
        }

        // Start download
        followRedirects(url, (error, response) => {
            if (error) {
                clearInterval(progressInterval);
                reject(error);
                return;
            }

            if (response.statusCode !== 200) {
                clearInterval(progressInterval);
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }

            totalBytes = parseInt(response.headers['content-length'], 10);
            if (!totalBytes || totalBytes === 0) {
                totalBytes = 150000000; // 150MB estimate for Appium Inspector
                console.log(`\n${colors.yellow}[INFO]${colors.reset} File size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB (estimated)`);
            } else {
                console.log(`\n${colors.yellow}[INFO]${colors.reset} File size: ${(totalBytes / (1024 * 1024)).toFixed(2)} MB`);
            }

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
                // Clear the line completely and show completion
                process.stdout.write(`\r${' '.repeat(80)}\r`);
                console.log(`${colors.green}[Complete]${colors.reset} ${colors.green}✓${colors.reset} | ${colors.yellow}100.00%${colors.reset}`);
                resolve();
            });
            
            response.on('error', (err) => {
                clearInterval(progressInterval);
                fileStream.destroy();
                reject(err);
            });
            
            fileStream.on('error', reject);
        });

        // Timeout
        setTimeout(() => {
            clearInterval(progressInterval);
            reject(new Error('Download timeout'));
        }, 300000);
    });
}