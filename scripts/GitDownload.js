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

    console.log(`${colors.yellow}[INFO]${colors.reset} Checking for latest Git version...`);
    
    // Get version from Git SCM website
    let gitSCMVersion = null;
    let gitSCMUrl = null;
    
    try {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();
        
        await page.goto('https://git-scm.com/download/win', { 
            waitUntil: 'domcontentloaded',
            timeout: 30000
        });
        
        await page.waitForLoadState('networkidle');
        
        const links = await page.$$eval('a', (anchors, targetArch) => {
            return anchors.map(a => ({
                href: a.href,
                text: a.textContent
            })).filter(link => 
                link.href.includes('.exe') && 
                (targetArch === '64-bit' ? 
                    (link.href.includes('64-bit') || link.text.includes('64')) : 
                    (link.href.includes('32-bit') || link.text.includes('32')))
            );
        }, arch);
        
        if (links.length > 0) {
            gitSCMUrl = links[0].href;
            const match = gitSCMUrl.match(/(\d+\.\d+\.\d+)/);
            gitSCMVersion = match ? match[1] : null;
        }
        
        await browser.close();
        
        if (gitSCMVersion) {
            console.log(`${colors.green}[INFO]${colors.reset} Git SCM version: v${gitSCMVersion}`);
        }
    } catch (error) {
        console.log(`${colors.yellow}[WARNING]${colors.reset} Could not get version from Git SCM: ${error.message}`);
    }
    
    // Get version from GitHub API
    let gitHubVersion = null;
    let gitHubUrl = `https://github.com/git-for-windows/git/releases/latest/download/Git-${arch}.exe`;
    
    try {
        gitHubVersion = await new Promise((resolve, reject) => {
            https.get('https://api.github.com/repos/git-for-windows/git/releases/latest', {
                headers: { 'User-Agent': 'Node.js' }
            }, (res) => {
                let data = '';
                res.on('data', (chunk) => data += chunk);
                res.on('end', () => {
                    try {
                        const json = JSON.parse(data);
                        const version = json.tag_name.replace(/^v/, '').split('.windows')[0];
                        resolve(version);
                    } catch (err) {
                        reject(err);
                    }
                });
            }).on('error', reject);
        });
        
        console.log(`${colors.green}[INFO]${colors.reset} GitHub version: v${gitHubVersion}`);
    } catch (error) {
        console.log(`${colors.yellow}[WARNING]${colors.reset} Could not get version from GitHub: ${error.message}`);
    }
    
    // Compare versions
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
    
    if (gitSCMVersion && gitHubVersion) {
        const comparison = compareVersions(gitSCMVersion, gitHubVersion);
        if (comparison >= 0) {
            // Git SCM has same or newer version
            downloadUrl = gitSCMUrl;
            downloadSource = 'Git SCM';
            selectedVersion = gitSCMVersion;
        } else {
            // GitHub has newer version
            downloadUrl = gitHubUrl;
            downloadSource = 'GitHub';
            selectedVersion = gitHubVersion;
        }
    } else if (gitSCMVersion) {
        downloadUrl = gitSCMUrl;
        downloadSource = 'Git SCM';
        selectedVersion = gitSCMVersion;
    } else if (gitHubVersion) {
        downloadUrl = gitHubUrl;
        downloadSource = 'GitHub';
        selectedVersion = gitHubVersion;
    } else {
        console.log(`${colors.red}[ERROR]${colors.reset} Could not find any download source`);
        process.exit(1);
    }
    
    console.log(`${colors.cyan}[SELECTED]${colors.reset} Using ${downloadSource} (v${selectedVersion})`);
    
    // Determine filename
    const urlObj = new URL(downloadUrl);
    const fileName = path.basename(urlObj.pathname) || `Git-${arch}-${selectedVersion}.exe`;
    const filePath = path.join(downloadFolder, fileName);
    
    console.log(`${colors.yellow}[INFO]${colors.reset} Downloading: ${fileName}`);
    
    // Check if URL is from GitHub
    const isGitHubUrl = downloadUrl.includes('github.com') || downloadUrl.includes('githubusercontent.com');
    
    if (isGitHubUrl) {
        // GitHub URLs need percentage download (they redirect)
        console.log(`${colors.yellow}[INFO]${colors.reset} Detected GitHub URL, using progress tracking...`);
        await downloadWithPercentage(downloadUrl, filePath);
    } else {
        // Direct URLs (if any) can use simple download
        console.log(`${colors.yellow}[INFO]${colors.reset} Using direct download...`);
        await downloadWithSpinner(downloadUrl, filePath);
    }
    
    console.log(`${colors.green}[SUCCESS]${colors.reset} Git installer downloaded to: ${filePath}`);
    
    // IMPORTANT: This tells the batch file that download is complete
    // The batch file will then show the installation menu
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
                totalBytes = 50000000; // 50MB estimate
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
