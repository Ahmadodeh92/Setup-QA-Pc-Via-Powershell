// ======================================
// JDK-Download.js (Simplified - Oracle JDK Only)
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
    console.log(`${colors.yellow}[INFO]${colors.reset} Download folder: ${downloadFolder}`);
    console.log(`${colors.green}[INFO]${colors.reset} Target architecture: ${arch}`);
    
    console.log(`\n${colors.magenta}[JAVA DEVELOPMENT KIT (JDK) INFO]${colors.reset}`);
    console.log(`${colors.cyan}╔══════════════════════════════════════════════════════════╗${colors.reset}`);
    console.log(`${colors.cyan}║${colors.reset} ${colors.yellow}JAVA DEVELOPMENT KIT${colors.reset} - For Java developers         ${colors.cyan}║${colors.reset}`);
    console.log(`${colors.cyan}║${colors.reset} ${colors.green}• Includes:${colors.reset} Java compiler (javac), tools, JRE     ${colors.cyan}║${colors.reset}`);
    console.log(`${colors.cyan}║${colors.reset} ${colors.green}• For:${colors.reset} Developing Java applications              ${colors.cyan}║${colors.reset}`);
    console.log(`${colors.cyan}║${colors.reset} ${colors.green}• Size:${colors.reset} ~150-200 MB                             ${colors.cyan}║${colors.reset}`);
    console.log(`${colors.cyan}╚══════════════════════════════════════════════════════════╝${colors.reset}\n`);
    
    console.log(`${colors.magenta}[TARGET]${colors.reset} Downloading JDK (Java Development Kit)...\n`);
    
    let downloadSuccess = false;
    let filePath = '';
    let fileName = '';
    let downloadSource = '';
    let javaVersion = '';
    
    // METHOD 1: Try Oracle JDK downloads page
    try {
        console.log(`${colors.yellow}[METHOD 1]${colors.reset} Getting JDK from Oracle...`);
        
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
        
        // Try JDK 17 archive page (most stable)
        console.log(`${colors.yellow}[INFO]${colors.reset} Opening JDK download page...`);
        await page.goto('https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html', { 
            waitUntil: 'domcontentloaded',
            timeout: 30000 
        });
        
        // Wait for page to load
        await page.waitForSelector('body', { timeout: 10000 });
        
        console.log(`${colors.green}[INFO]${colors.reset} Page loaded successfully`);
        
        // Look for Windows download
        const archText = arch === '64-bit' ? 'x64' : 'i586';
        
        // Try to find download link
        const downloadSelectors = [
            `a[href*="windows-${archText}"]`,
            `a[href*="jdk-17"][href*="windows"]`,
            `a:has-text("Windows ${arch === '64-bit' ? 'x64' : 'x86'}")`,
            `a[href$=".exe"]:visible`
        ];
        
        let downloadUrl = '';
        
        for (const selector of downloadSelectors) {
            try {
                const link = page.locator(selector).first();
                await link.waitFor({ state: 'visible', timeout: 5000 });
                const href = await link.getAttribute('href');
                
                if (href && href.includes('.exe')) {
                    downloadUrl = href.startsWith('http') ? href : new URL(href, page.url()).href;
                    console.log(`${colors.green}[INFO]${colors.reset} Found download link`);
                    break;
                }
            } catch (e) {
                continue;
            }
        }
        
        // If no link found, search in page content
        if (!downloadUrl) {
            const pageContent = await page.content();
            const urlRegex = /https?:\/\/[^\s"']+\.exe[^\s"']*/gi;
            const exeUrls = pageContent.match(urlRegex) || [];
            
            const windowsExe = exeUrls.find(url => 
                url.includes('windows') && 
                url.includes('jdk')
            );
            
            if (windowsExe) {
                downloadUrl = windowsExe;
                console.log(`${colors.green}[INFO]${colors.reset} Found .exe URL in page`);
            }
        }
        
        if (downloadUrl) {
            await browser.close();
            
            // Extract filename
            try {
                const urlObj = new URL(downloadUrl);
                fileName = path.basename(urlObj.pathname);
            } catch (e) {
                fileName = `jdk-17-windows-${archText}.exe`;
            }
            
            filePath = path.join(downloadFolder, fileName);
            
            // Clean existing file
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            
            console.log(`${colors.yellow}[INFO]${colors.reset} Downloading: ${fileName}`);
            console.log(`${colors.yellow}[INFO]${colors.reset} From: ${downloadUrl}`);
            
            await downloadWithPercentage(downloadUrl, filePath);
            
            console.log(`${colors.green}[SUCCESS]${colors.reset} JDK downloaded to: ${filePath}`);
            downloadSuccess = true;
            downloadSource = 'Oracle JDK 17';
            javaVersion = '17';
        } else {
            await browser.close();
            throw new Error('No download link found');
        }
        
    } catch (error) {
        console.log(`${colors.red}[ERROR]${colors.reset} Oracle JDK download failed: ${error.message}`);
    }
    
    // METHOD 2: Fallback to different version
    if (!downloadSuccess) {
        console.log(`\n${colors.yellow}[METHOD 2]${colors.reset} Trying JDK 11 archive...`);
        
        try {
            const archText = arch === '64-bit' ? 'x64' : 'i586';
            
            // Use a known direct download URL pattern for JDK 11
            const jdk11Url = `https://download.oracle.com/otn/java/jdk/11.0.21+9/1e6c4d61d0e54e9db90256c2b4b11936/jdk-11.0.21_windows-${archText}_bin.exe`;
            
            fileName = `jdk-11.0.21-windows-${archText}.exe`;
            filePath = path.join(downloadFolder, fileName);
            
            console.log(`${colors.green}[INFO]${colors.reset} Using JDK 11 (LTS Release)`);
            
            // Clean existing file
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
            
            console.log(`${colors.yellow}[INFO]${colors.reset} Downloading: ${fileName}`);
            
            await downloadWithPercentage(jdk11Url, filePath);
            
            console.log(`${colors.green}[SUCCESS]${colors.reset} JDK 11 downloaded to: ${filePath}`);
            downloadSuccess = true;
            downloadSource = 'Oracle JDK 11';
            javaVersion = '11';
            
        } catch (error) {
            console.log(`${colors.red}[ERROR]${colors.reset} JDK 11 download failed: ${error.message}`);
        }
    }
    
    // METHOD 3: Manual fallback
    if (!downloadSuccess) {
        console.log(`\n${colors.yellow}[METHOD 3]${colors.reset} Manual download required`);
        
        console.log(`${colors.red}[ERROR]${colors.reset} Automatic download failed`);
        console.log(`${colors.yellow}[INFO]${colors.reset} Please download JDK manually:`);
        console.log(`${colors.cyan}1.${colors.reset} Go to: https://www.oracle.com/java/technologies/javase/jdk17-archive-downloads.html`);
        console.log(`${colors.cyan}2.${colors.reset} Accept the license agreement`);
        console.log(`${colors.cyan}3.${colors.reset} Download Windows ${arch} .exe installer`);
        console.log(`${colors.cyan}4.${colors.reset} Save the file to: ${downloadFolder}`);
        
        process.exit(1);
    }
    
    // Show results
    await showResults(filePath, fileName, javaVersion, arch, downloadSource, true);
    
    process.exit(0);
})();

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
            
            totalBytes = parseInt(response.headers['content-length'], 10) || 200000000;
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
async function showResults(filePath, fileName, version, arch, source, isJDK = true) {
    console.log(`\n${colors.cyan}[FILE INFO]${colors.reset}`);
    
    try {
        const stats = fs.statSync(filePath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`${colors.green}[SIZE]${colors.reset} ${fileSizeMB} MB`);
    } catch (e) {
        // Ignore stat error
    }
    
    const fileType = fileName.endsWith('.exe') ? 'Application (.exe)' : 
                    fileName.endsWith('.msi') ? 'Windows Installer (.msi)' : 'Installer';
    
    console.log(`${colors.green}[TYPE]${colors.reset} ${fileType}`);
    console.log(`${colors.green}[DESCRIPTION]${colors.reset} Java Development Kit (JDK)`);
    console.log(`${colors.green}[VERSION]${colors.reset} ${version}`);
    console.log(`${colors.green}[SOURCE]${colors.reset} ${source}`);
    console.log(`${colors.green}[ARCHITECTURE]${colors.reset} ${arch}`);
    
    
    // Verification commands
    console.log(`\n${colors.yellow}[VERIFICATION COMMANDS]${colors.reset}`);
    console.log(`${colors.green}javac -version${colors.reset} - Check Java compiler (JDK)`);
    console.log(`${colors.green}java -version${colors.reset} - Check Java runtime`);
    
    // Completion markers
    console.log(`\n${colors.magenta}[DOWNLOAD_COMPLETE]${colors.reset}`);
    console.log(`${colors.magenta}[FILE_PATH]${colors.reset} ${filePath}`);
    console.log(`${colors.magenta}[FILE_NAME]${colors.reset} ${fileName}`);
    console.log(`${colors.magenta}[FILE_TYPE]${colors.reset} ${fileType.split(' ')[0]}`);
    console.log(`${colors.magenta}[JAVA_TYPE]${colors.reset} JDK`);
    console.log(`${colors.magenta}[JAVA_VERSION]${colors.reset} ${version}`);
    console.log(`${colors.magenta}[ARCHITECTURE]${colors.reset} ${arch}`);
    console.log(`${colors.magenta}[SOURCE]${colors.reset} ${source}`);
    console.log(`${colors.yellow}[NOTE]${colors.reset} Want JDK 21 (Latest LTS)? PleaseVisit:`);
    console.log(`${colors.cyan}${colors.underline}https://www.oracle.com/middleeast/java/technologies/downloads/#java21${colors.reset}`);
    console.log(`${colors.yellow}[NOTE]${colors.reset} Oracle requires free account creation for JDK 21+ downloads\n`);
}