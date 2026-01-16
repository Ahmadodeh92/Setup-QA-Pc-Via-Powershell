// ======================================
// JavaDownload.js (Enhanced with Progress & Fallback)
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
if (!fs.existsSync(downloadFolder)) fs.mkdirSync(downloadFolder, { recursive: true });

(async () => {
    console.log(`${colors.yellow}[INFO]${colors.reset} Download folder: ${downloadFolder}`);
    
    // Try the original java.com method first
    console.log(`${colors.yellow}[INFO]${colors.reset} Getting Java from java.com...`);
    
    let downloadSuccess = false;
    let filePath = '';
    let fileName = '';
    
    // METHOD 1: Original java.com download
    try {
        const browser = await chromium.launch({ headless: true });
        const page = await (await browser.newContext({ acceptDownloads: true })).newPage();

        console.log(`${colors.yellow}[INFO]${colors.reset} Opening Java download page...`);
        await page.goto('https://www.java.com/en/download/', { waitUntil: 'domcontentloaded' });

        const downloadBtn = page.getByRole('link', { name: /Download Java/i }).first();
        const downloadPromise = page.waitForEvent('download');
        await downloadBtn.click();
        const download = await downloadPromise;

        fileName = download.suggestedFilename();
        filePath = path.join(downloadFolder, fileName);
        
        console.log(`${colors.green}[INFO]${colors.reset} Java installer: ${fileName}`);
        
        // Download with progress counter
        await downloadWithCounter(download, filePath);
        
        console.log(`${colors.green}[SUCCESS]${colors.reset} Java downloaded to: ${filePath}`);
        await browser.close();
        
        downloadSuccess = true;
        
    } catch (error) {
        console.log(`${colors.yellow}[WARNING]${colors.reset} Java.com download failed: ${error.message}`);
        console.log(`${colors.yellow}[INFO]${colors.reset} Trying alternative source...`);
    }
    
    // METHOD 2: If java.com fails, try GitHub fallback
    if (!downloadSuccess) {
        console.log(`${colors.yellow}[INFO]${colors.reset} Checking GitHub for Java...`);
        
        try {
            // Try to get latest Java version from GitHub releases
            const arch = '64-bit'; // Assuming 64-bit for fallback
            const archSuffix = arch === '64-bit' ? 'x64' : 'x86';
            
            // Use a known working GitHub release URL
            const githubUrl = `https://github.com/AdoptOpenJDK/openjdk8-binaries/releases/download/jdk8u312-b07/OpenJDK8U-jre_${archSuffix}_windows_hotspot_8u312b07.zip`;
            
            console.log(`${colors.green}[INFO]${colors.reset} Using GitHub fallback: OpenJDK 8`);
            console.log(`${colors.yellow}[INFO]${colors.reset} Download URL: ${githubUrl}`);
            
            // Extract filename from URL
            const urlObj = new URL(githubUrl);
            fileName = path.basename(urlObj.pathname);
            filePath = path.join(downloadFolder, fileName);
            
            // Clean up existing file
            if (fs.existsSync(filePath)) { 
                console.log(`${colors.yellow}[INFO]${colors.reset} Removing existing file: ${fileName}`);
                fs.unlinkSync(filePath); 
            }
            
            console.log(`${colors.yellow}[INFO]${colors.reset} Downloading: ${fileName}`);
            
            // Download with percentage progress
            await downloadWithPercentage(githubUrl, filePath);
            
            console.log(`${colors.green}[SUCCESS]${colors.reset} Java (OpenJDK) downloaded to: ${filePath}`);
            downloadSuccess = true;
            
        } catch (githubError) {
            console.log(`${colors.red}[ERROR]${colors.reset} GitHub download failed: ${githubError.message}`);
        }
    }
    
    // METHOD 3: Ultimate fallback
    if (!downloadSuccess) {
        console.log(`${colors.red}[ERROR]${colors.reset} All download methods failed`);
        console.log(`${colors.yellow}[INFO]${colors.reset} Please download Java manually from: https://www.java.com/en/download/`);
        process.exit(1);
    }
    
    // --- SHOW FILE INFO ---
    console.log(`\n${colors.cyan}[FILE INFO]${colors.reset}`);
    
    try {
        const stats = fs.statSync(filePath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`${colors.green}[SIZE]${colors.reset} ${fileSizeMB} MB`);
    } catch (e) {
        // Ignore stat error
    }
    
    const fileType = fileName.endsWith('.exe') ? 'Application (.exe)' : 
                    fileName.endsWith('.zip') ? 'Archive (.zip)' : 'Installer';
    
    console.log(`${colors.green}[TYPE]${colors.reset} ${fileType}`);
    console.log(`${colors.green}[DESCRIPTION]${colors.reset} ${fileName.includes('jre') ? 'Java Runtime (JRE)' : 'Java Development Kit (JDK)'}`);
    console.log(`${colors.green}[SOURCE]${colors.reset} ${downloadSuccess ? 'java.com (Official Oracle)' : 'GitHub (OpenJDK)'}`);
    
    // --- SHOW INSTALLATION INSTRUCTIONS ---
    console.log(`\n${colors.magenta}[INSTALLATION INSTRUCTIONS]${colors.reset}`);
    
    if (fileName.endsWith('.exe')) {
        console.log(`${colors.cyan}1.${colors.reset} Double-click: ${filePath}`);
        console.log(`${colors.cyan}2.${colors.reset} Follow the installation wizard`);
        console.log(`${colors.cyan}3.${colors.reset} Restart computer if prompted`);
        console.log(`${colors.yellow}[NOTE]${colors.reset} This is the official Java installer from Oracle`);
    } else if (fileName.endsWith('.zip')) {
        console.log(`${colors.cyan}1.${colors.reset} Extract ZIP to: ${downloadFolder}\\Java`);
        console.log(`${colors.cyan}2.${colors.reset} Set JAVA_HOME environment variable to extracted folder`);
        console.log(`${colors.cyan}3.${colors.reset} Add %JAVA_HOME%\\bin to PATH`);
        console.log(`${colors.yellow}[NOTE]${colors.reset} This is a portable Java - no installation needed`);
    }
    
    // --- COMPLETION MARKERS ---
    console.log(`\n${colors.magenta}[DOWNLOAD_COMPLETE]${colors.reset}`);
    console.log(`${colors.magenta}[FILE_PATH]${colors.reset} ${filePath}`);
    console.log(`${colors.magenta}[FILE_NAME]${colors.reset} ${fileName}`);
    console.log(`${colors.magenta}[FILE_TYPE]${colors.reset} ${fileType.split(' ')[0]}`);
    console.log(`${colors.magenta}[SOURCE]${colors.reset} ${downloadSuccess ? 'Oracle' : 'OpenJDK'}`);
    
    process.exit(0);
})();

// Download function with byte counter (for Playwright downloads)
async function downloadWithCounter(download, outputPath) {
    return new Promise((resolve, reject) => {
        let downloadedBytes = 0;
        let lastUpdate = Date.now();
        
        const spinnerFrames = ['/', '-', '\\', '|'];
        const spinnerColors = [colors.red, colors.blue, colors.yellow, colors.green];
        let step = 0;
        
        const progressInterval = setInterval(() => {
            const char = spinnerFrames[step % spinnerFrames.length];
            const color = spinnerColors[step % spinnerColors.length];
            
            // Convert bytes to MB
            const downloadedMB = (downloadedBytes / (1024 * 1024)).toFixed(2);
            
            process.stdout.write(`\r${colors.cyan}[Downloading]${colors.reset} ${color}${char}${colors.reset} | ${colors.yellow}${downloadedMB} MB${colors.reset}`);
            step++;
        }, 100);
        
        // Create write stream
        const writeStream = fs.createWriteStream(outputPath);
        
        // Handle the download stream
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
            
            writeStream.on('error', (error) => {
                clearInterval(progressInterval);
                reject(error);
            });
        }).catch(error => {
            clearInterval(progressInterval);
            reject(error);
        });
    });
}

// Download function with percentage (for GitHub/HTTP downloads)
async function downloadWithPercentage(url, outputPath) {
    return new Promise((resolve, reject) => {
        let downloadedBytes = 0;
        let totalBytes = 0;
        let percent = "0.00";
        
        const spinnerFrames = ['/', '-', '\\', '|'];
        const spinnerColors = [colors.red, colors.blue, colors.yellow, colors.green];
        let step = 0;
        let progressInterval = null;

        // Follow redirects
        function followRedirects(url, callback) {
            try {
                const urlObj = new URL(url);
                const req = https.get(urlObj, (response) => {
                    if ([301, 302, 307, 308].includes(response.statusCode)) {
                        const redirectUrl = response.headers.location;
                        if (redirectUrl) {
                            const resolvedUrl = new URL(redirectUrl, urlObj.origin);
                            followRedirects(resolvedUrl.href, callback);
                        } else {
                            callback(new Error('Redirect with no location'));
                        }
                        response.destroy();
                    } else {
                        callback(null, response);
                    }
                });
                req.on('error', callback);
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

            if (response.statusCode !== 200) {
                reject(new Error(`HTTP ${response.statusCode}`));
                return;
            }

            totalBytes = parseInt(response.headers['content-length'], 10);
            if (!totalBytes || totalBytes === 0) {
                totalBytes = 80000000; // 80MB estimate
            }
            
            const fileSizeMB = (totalBytes / (1024 * 1024)).toFixed(2);
            console.log(`${colors.yellow}[INFO]${colors.reset} File size: ${fileSizeMB} MB`);
            console.log(`${colors.yellow}[INFO]${colors.reset} Starting download...`);
            
            // Start progress display AFTER we have file info
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
            
            response.on('error', (err) => {
                clearInterval(progressInterval);
                fileStream.destroy();
                reject(err);
            });
            
            fileStream.on('error', reject);
        });

        // Timeout
        setTimeout(() => {
            if (progressInterval) clearInterval(progressInterval);
            reject(new Error('Download timeout'));
        }, 300000);
    });
}