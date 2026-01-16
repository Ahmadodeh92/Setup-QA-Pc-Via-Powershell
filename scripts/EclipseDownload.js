// // ======================================
// // EclipseDownload.js - FIXED for Eclipse Website Terminology
// // ======================================

// const { chromium } = require('playwright');
// const fs = require('fs');
// const path = require('path');
// const os = require('os');
// const unzipper = require('unzipper');
// const https = require('https');
// const { URL } = require('url');

// // ANSI color codes
// const colors = {
//     reset: "\x1b[0m",
//     red: "\x1b[31m",
//     blue: "\x1b[34m",
//     yellow: "\x1b[33m",
//     green: "\x1b[32m",
//     cyan: "\x1b[36m",
//     magenta: "\x1b[35m"
// };

// const downloadFolder = process.argv[2] || path.join(os.homedir(), 'Downloads', 'QA Tools');

// // Convert PowerShell architecture to Eclipse terminology
// let psArch = process.argv[3] || '64-bit';
// let eclipseArch = psArch === '64-bit' ? 'x86_64' : 'x86';

// console.log(`${colors.cyan}[ARCH TRANSLATION]${colors.reset} PowerShell: ${psArch} → Eclipse: ${eclipseArch}`);

// (async () => {
//     console.log(`${colors.yellow}[INFO]${colors.reset} Download folder: ${downloadFolder}`);
//     console.log(`${colors.green}[INFO]${colors.reset} Target architecture: ${eclipseArch} (Windows ${eclipseArch})`);
    
//     if (!fs.existsSync(downloadFolder)) {
//         fs.mkdirSync(downloadFolder, { recursive: true });
//     }

//     console.log(`${colors.yellow}[INFO]${colors.reset} Finding latest Eclipse IDE for Windows (${eclipseArch})...`);
    
//     let eclipseUrl = null;
//     let eclipseVersion = '2024-12'; // Default fallback
//     let downloadSource = 'Eclipse Direct Download';
    
//     try {
//         const browser = await chromium.launch({ headless: true });
//         const page = await browser.newPage();

//         console.log(`${colors.yellow}[INFO]${colors.reset} Navigating to Eclipse downloads...`);
        
//         // Go to Eclipse packages page (more reliable for specific downloads)
//         await page.goto('https://www.eclipse.org/downloads/packages/', { 
//             waitUntil: 'networkidle',
//             timeout: 30000 
//         });

//         // Get version from page
//         const pageText = await page.textContent('body');
//         const versionMatch = pageText.match(/Eclipse IDE (\d{4}-\d{2})/) || 
//                             pageText.match(/(\d{4}-\d{2})\s+Release/) ||
//                             pageText.match(/Release\s+(\d{4}-\d{2})/);
        
//         if (versionMatch) {
//             eclipseVersion = versionMatch[1];
//             console.log(`${colors.green}[INFO]${colors.reset} Latest Eclipse version: ${eclipseVersion}`);
//         }
        
//         // Now click the correct architecture link
//         console.log(`${colors.yellow}[INFO]${colors.reset} Selecting ${eclipseArch} architecture...`);
        
//         // Find and click the architecture link
//         const archLink = page.locator(`text=${eclipseArch}`).first();
//         await archLink.waitFor({ state: 'visible', timeout: 10000 });
//         await archLink.click();
        
//         // Wait for page to update
//         await page.waitForLoadState('networkidle');
        
//         // Find the direct download link for Windows ZIP
//         console.log(`${colors.yellow}[INFO]${colors.reset} Looking for Windows download link...`);
        
//         // Get all download links
//         const downloadLinks = await page.$$eval('a[href*=".zip"]', (links, targetArch) => {
//             return links
//                 .map(link => ({
//                     href: link.href,
//                     text: link.textContent.trim(),
//                     innerHTML: link.innerHTML
//                 }))
//                 .filter(link => {
//                     // Filter for Windows downloads matching our architecture
//                     const href = link.href.toLowerCase();
//                     const text = link.text.toLowerCase();
                    
//                     // Must be a zip file
//                     if (!href.endsWith('.zip')) return false;
                    
//                     // Must contain architecture indicator
//                     if (!href.includes(targetArch.toLowerCase()) && 
//                         !text.includes(targetArch.toLowerCase())) {
//                         return false;
//                     }
                    
//                     // Must be for Windows (not mac, linux, etc.)
//                     if (href.includes('mac') || href.includes('linux') || 
//                         href.includes('gtk') || href.includes('cocoa')) {
//                         return false;
//                     }
                    
//                     return true;
//                 });
//         }, eclipseArch);
        
//         if (downloadLinks.length > 0) {
//             eclipseUrl = downloadLinks[0].href;
//             console.log(`${colors.green}[INFO]${colors.reset} Found direct download: ${downloadLinks[0].text}`);
//         } else {
//             // Fallback: construct URL directly
//             eclipseUrl = `https://www.eclipse.org/downloads/download.php?file=/technology/epp/downloads/release/${eclipseVersion}/R/eclipse-java-${eclipseVersion}-R-win32-${eclipseArch}.zip&mirror_id=1`;
//             console.log(`${colors.yellow}[INFO]${colors.reset} Using constructed URL`);
//         }
        
//         await browser.close();
        
//     } catch (error) {
//         console.log(`${colors.yellow}[WARNING]${colors.reset} Website navigation failed: ${error.message}`);
//         // Construct direct URL as fallback
//         eclipseUrl = `https://www.eclipse.org/downloads/download.php?file=/technology/epp/downloads/release/${eclipseVersion}/R/eclipse-java-${eclipseVersion}-R-win32-${eclipseArch}.zip&mirror_id=1`;
//         downloadSource = 'Fallback URL';
//     }
    
//     console.log(`${colors.cyan}[SELECTED]${colors.reset} ${downloadSource}: Eclipse ${eclipseVersion} for Windows ${eclipseArch}`);
//     console.log(`${colors.yellow}[INFO]${colors.reset} Download URL: ${eclipseUrl}`);
    
//     // Validate URL
//     try {
//         new URL(eclipseUrl);
//         console.log(`${colors.green}[INFO]${colors.reset} URL is valid`);
//     } catch (error) {
//         console.log(`${colors.red}[ERROR]${colors.reset} Invalid URL: ${error.message}`);
//         process.exit(1);
//     }
    
//     // Determine filename
//     let fileName = `eclipse-java-${eclipseVersion}-win32-${eclipseArch}.zip`;
//     try {
//         const urlObj = new URL(eclipseUrl);
//         const pathname = urlObj.pathname;
//         const lastSegment = pathname.split('/').pop();
//         if (lastSegment && lastSegment.endsWith('.zip')) {
//             fileName = lastSegment;
//         }
//     } catch (e) {
//         // Use default filename
//     }
    
//     const filePath = path.join(downloadFolder, fileName);
    
//     // Clean up existing file
//     if (fs.existsSync(filePath)) { 
//         console.log(`${colors.yellow}[INFO]${colors.reset} Removing existing file: ${fileName}`);
//         fs.unlinkSync(filePath); 
//     }
    
//     console.log(`${colors.yellow}[INFO]${colors.reset} Downloading: ${fileName}`);
    
//     // Download with progress tracking
//     console.log(`${colors.yellow}[INFO]${colors.reset} Starting download with progress tracking...`);
//     await downloadWithPercentage(eclipseUrl, filePath);
    
//     console.log(`${colors.green}[SUCCESS]${colors.reset} Eclipse IDE downloaded to: ${filePath}`);
    
//     // --- UNZIP ---
//     console.log(`${colors.yellow}[INFO]${colors.reset} Starting extraction...`);
//     const extractPath = path.join(downloadFolder, 'Eclipse_IDE');
//     if (!fs.existsSync(extractPath)) fs.mkdirSync(extractPath, { recursive: true });
    
//     // Show extraction spinner
//     const spinnerFrames = ['/', '-', '\\', '|'];
//     const spinnerColors = [colors.red, colors.blue, colors.yellow, colors.green];
//     let step = 0;
    
//     const progressInterval = setInterval(() => {
//         const char = spinnerFrames[step % spinnerFrames.length];
//         const color = spinnerColors[step % spinnerColors.length];
//         process.stdout.write(`\r${colors.cyan}[Extracting]${colors.reset} ${color}${char}${colors.reset}`);
//         step++;
//     }, 100);
    
//     try {
//         const readStream = fs.createReadStream(filePath).pipe(unzipper.Parse()).on('entry', entry => {
//             const fullPath = path.join(extractPath, entry.path);
//             if (entry.type === 'Directory') {
//                 if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
//                 entry.autodrain();
//             } else {
//                 const pDir = path.dirname(fullPath);
//                 if (!fs.existsSync(pDir)) fs.mkdirSync(pDir, { recursive: true });
//                 entry.pipe(fs.createWriteStream(fullPath));
//             }
//         });

//         await new Promise((resolve) => readStream.on('finish', resolve));
        
//         clearInterval(progressInterval);
//         process.stdout.write(`\r${' '.repeat(80)}\r`);
//         console.log(`${colors.green}[SUCCESS]${colors.reset} Eclipse extracted to: ${extractPath}`);
        
//         // Check if extraction worked
//         const eclipseExe = path.join(extractPath, 'eclipse', 'eclipse.exe');
//         if (fs.existsSync(eclipseExe)) {
//             console.log(`${colors.green}[VERIFIED]${colors.reset} Eclipse executable found: eclipse.exe`);
//         } else {
//             // Check alternative structure
//             const files = fs.readdirSync(extractPath);
//             const eclipseDir = files.find(f => f.toLowerCase().includes('eclipse'));
//             if (eclipseDir) {
//                 console.log(`${colors.green}[VERIFIED]${colors.reset} Eclipse folder: ${eclipseDir}`);
//             }
//         }
        
//     } catch (error) {
//         clearInterval(progressInterval);
//         process.stdout.write(`\r${' '.repeat(80)}\r`);
//         console.log(`${colors.red}[ERROR]${colors.reset} Extraction failed: ${error.message}`);
//         throw error;
//     }
    
//     // Completion markers (for batch file integration)
//     console.log(`\n${colors.magenta}[DOWNLOAD_COMPLETE]${colors.reset}`);
//     console.log(`${colors.magenta}[FILE_PATH]${colors.reset} ${filePath}`);
//     console.log(`${colors.magenta}[EXTRACT_PATH]${colors.reset} ${extractPath}`);
//     console.log(`${colors.magenta}[ARCHITECTURE]${colors.reset} ${eclipseArch}`);
//     console.log(`${colors.magenta}[VERSION]${colors.reset} ${eclipseVersion}`);
    
//     process.exit(0);
// })();

// // Download function with percentage
// async function downloadWithPercentage(url, outputPath) {
//     return new Promise((resolve, reject) => {
//         let downloadedBytes = 0;
//         let totalBytes = 0;
//         let percent = "0.00";
        
//         const spinnerFrames = ['/', '-', '\\', '|'];
//         const spinnerColors = [colors.red, colors.blue, colors.yellow, colors.green];
//         let step = 0;
//         let progressInterval = null;

//         // Start progress display
//         progressInterval = setInterval(() => {
//             const char = spinnerFrames[step % spinnerFrames.length];
//             const color = spinnerColors[step % spinnerColors.length];
//             process.stdout.write(`\r${colors.cyan}[Downloading]${colors.reset} ${color}${char}${colors.reset} | ${colors.yellow}${percent}%${colors.reset}`);
//             step++;
//         }, 100);

//         // Follow redirects
//         function followRedirects(url, callback) {
//             try {
//                 const urlObj = new URL(url);
//                 const req = https.get(urlObj, (response) => {
//                     if ([301, 302, 307, 308].includes(response.statusCode)) {
//                         const redirectUrl = response.headers.location;
//                         if (redirectUrl) {
//                             const resolvedUrl = new URL(redirectUrl, urlObj.origin);
//                             followRedirects(resolvedUrl.href, callback);
//                         } else {
//                             callback(new Error('Redirect with no location'));
//                         }
//                         response.destroy();
//                     } else {
//                         callback(null, response);
//                     }
//                 });
//                 req.on('error', callback);
//             } catch (error) {
//                 callback(error);
//             }
//         }

//         // Start download
//         followRedirects(url, (error, response) => {
//             if (error) {
//                 clearInterval(progressInterval);
//                 reject(error);
//                 return;
//             }

//             if (response.statusCode !== 200) {
//                 clearInterval(progressInterval);
//                 reject(new Error(`HTTP ${response.statusCode} for ${url}`));
//                 return;
//             }

//             totalBytes = parseInt(response.headers['content-length'], 10);
//             if (!totalBytes || totalBytes === 0) {
//                 totalBytes = 350000000; // 350MB estimate for Eclipse
//             }
            
//             const fileSizeMB = (totalBytes / (1024 * 1024)).toFixed(2);
//             console.log(`\n${colors.yellow}[INFO]${colors.reset} File size: ${fileSizeMB} MB`);
//             console.log(`${colors.yellow}[INFO]${colors.reset} Starting download...`);

//             const fileStream = fs.createWriteStream(outputPath);
            
//             response.on('data', (chunk) => {
//                 downloadedBytes += chunk.length;
//                 let calcPercent = ((downloadedBytes / totalBytes) * 100).toFixed(2);
//                 percent = Math.min(calcPercent, 100);
//                 fileStream.write(chunk);
//             });
            
//             response.on('end', () => {
//                 fileStream.end();
//                 clearInterval(progressInterval);
//                 process.stdout.write(`\r${' '.repeat(80)}\r`);
//                 console.log(`${colors.green}[Complete]${colors.reset} ${colors.green}✓${colors.reset} | ${colors.yellow}100.00%${colors.reset}`);
//                 resolve();
//             });
            
//             response.on('error', (err) => {
//                 clearInterval(progressInterval);
//                 fileStream.destroy();
//                 reject(err);
//             });
            
//             fileStream.on('error', reject);
//         });

//         // Timeout
//         setTimeout(() => {
//             clearInterval(progressInterval);
//             reject(new Error('Download timeout (10 minutes)'));
//         }, 600000);
//     });
// }




//================================================================================================================






// ======================================
// EclipseDownload.js - FIXED Progress + Installer Discovery
// ======================================

const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const os = require('os');
const unzipper = require('unzipper');
const https = require('https');
const { URL } = require('url');
const { exec } = require('child_process');

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

// Convert PowerShell architecture to Eclipse terminology
let psArch = process.argv[3] || '64-bit';
let eclipseArch = psArch === '64-bit' ? 'x86_64' : 'x86';

console.log(`${colors.cyan}[ARCH TRANSLATION]${colors.reset} PowerShell: ${psArch} → Eclipse: ${eclipseArch}`);

(async () => {
    console.log(`${colors.yellow}[INFO]${colors.reset} Download folder: ${downloadFolder}`);
    console.log(`${colors.green}[INFO]${colors.reset} Target architecture: ${eclipseArch} (Windows ${eclipseArch})`);
    
    if (!fs.existsSync(downloadFolder)) {
        fs.mkdirSync(downloadFolder, { recursive: true });
    }

    console.log(`${colors.yellow}[INFO]${colors.reset} Finding latest Eclipse IDE for Windows (${eclipseArch})...`);
    
    let eclipseUrl = null;
    let eclipseVersion = '2024-12'; // Default fallback
    let downloadSource = 'Eclipse Direct Download';
    
    try {
        const browser = await chromium.launch({ headless: true });
        const page = await browser.newPage();

        console.log(`${colors.yellow}[INFO]${colors.reset} Navigating to Eclipse downloads...`);
        
        // Go to Eclipse packages page (more reliable for specific downloads)
        await page.goto('https://www.eclipse.org/downloads/packages/', { 
            waitUntil: 'networkidle',
            timeout: 30000 
        });

        // Get version from page
        const pageText = await page.textContent('body');
        const versionMatch = pageText.match(/Eclipse IDE (\d{4}-\d{2})/) || 
                            pageText.match(/(\d{4}-\d{2})\s+Release/) ||
                            pageText.match(/Release\s+(\d{4}-\d{2})/);
        
        if (versionMatch) {
            eclipseVersion = versionMatch[1];
            console.log(`${colors.green}[INFO]${colors.reset} Latest Eclipse version: ${eclipseVersion}`);
        }
        
        // Now click the correct architecture link
        console.log(`${colors.yellow}[INFO]${colors.reset} Selecting ${eclipseArch} architecture...`);
        
        // Find and click the architecture link
        const archLink = page.locator(`text=${eclipseArch}`).first();
        await archLink.waitFor({ state: 'visible', timeout: 10000 });
        await archLink.click();
        
        // Wait for page to update
        await page.waitForLoadState('networkidle');
        
        // Find the direct download link for Windows ZIP
        console.log(`${colors.yellow}[INFO]${colors.reset} Looking for Windows download link...`);
        
        // Get all download links
        const downloadLinks = await page.$$eval('a[href*=".zip"]', (links, targetArch) => {
            return links
                .map(link => ({
                    href: link.href,
                    text: link.textContent.trim(),
                    innerHTML: link.innerHTML
                }))
                .filter(link => {
                    // Filter for Windows downloads matching our architecture
                    const href = link.href.toLowerCase();
                    const text = link.text.toLowerCase();
                    
                    // Must be a zip file
                    if (!href.endsWith('.zip')) return false;
                    
                    // Must contain architecture indicator
                    if (!href.includes(targetArch.toLowerCase()) && 
                        !text.includes(targetArch.toLowerCase())) {
                        return false;
                    }
                    
                    // Must be for Windows (not mac, linux, etc.)
                    if (href.includes('mac') || href.includes('linux') || 
                        href.includes('gtk') || href.includes('cocoa')) {
                        return false;
                    }
                    
                    return true;
                });
        }, eclipseArch);
        
        if (downloadLinks.length > 0) {
            eclipseUrl = downloadLinks[0].href;
            console.log(`${colors.green}[INFO]${colors.reset} Found direct download: ${downloadLinks[0].text}`);
        } else {
            // Fallback: construct URL directly
            eclipseUrl = `https://www.eclipse.org/downloads/download.php?file=/technology/epp/downloads/release/${eclipseVersion}/R/eclipse-java-${eclipseVersion}-R-win32-${eclipseArch}.zip&mirror_id=1`;
            console.log(`${colors.yellow}[INFO]${colors.reset} Using constructed URL`);
        }
        
        await browser.close();
        
    } catch (error) {
        console.log(`${colors.yellow}[WARNING]${colors.reset} Website navigation failed: ${error.message}`);
        // Construct direct URL as fallback
        eclipseUrl = `https://www.eclipse.org/downloads/download.php?file=/technology/epp/downloads/release/${eclipseVersion}/R/eclipse-java-${eclipseVersion}-R-win32-${eclipseArch}.zip&mirror_id=1`;
        downloadSource = 'Fallback URL';
    }
    
    console.log(`${colors.cyan}[SELECTED]${colors.reset} ${downloadSource}: Eclipse ${eclipseVersion} for Windows ${eclipseArch}`);
    console.log(`${colors.yellow}[INFO]${colors.reset} Download URL: ${eclipseUrl}`);
    
    // Validate URL
    try {
        new URL(eclipseUrl);
        console.log(`${colors.green}[INFO]${colors.reset} URL is valid`);
    } catch (error) {
        console.log(`${colors.red}[ERROR]${colors.reset} Invalid URL: ${error.message}`);
        process.exit(1);
    }
    
    // Determine filename
    let fileName = `eclipse-java-${eclipseVersion}-win32-${eclipseArch}.zip`;
    try {
        const urlObj = new URL(eclipseUrl);
        const pathname = urlObj.pathname;
        const lastSegment = pathname.split('/').pop();
        if (lastSegment && lastSegment.endsWith('.zip')) {
            fileName = lastSegment;
        }
    } catch (e) {
        // Use default filename
    }
    
    const filePath = path.join(downloadFolder, fileName);
    
    // Clean up existing file
    if (fs.existsSync(filePath)) { 
        console.log(`${colors.yellow}[INFO]${colors.reset} Removing existing file: ${fileName}`);
        fs.unlinkSync(filePath); 
    }
    
    console.log(`${colors.yellow}[INFO]${colors.reset} Downloading: ${fileName}`);
    
    // Download with progress tracking (FIXED: no early progress display)
    console.log(`${colors.yellow}[INFO]${colors.reset} Starting download...`);
    await downloadWithPercentage(eclipseUrl, filePath);
    
    console.log(`${colors.green}[SUCCESS]${colors.reset} Eclipse IDE downloaded to: ${filePath}`);
    
    // --- UNZIP ---
    console.log(`${colors.yellow}[INFO]${colors.reset} Starting extraction...`);
    const extractPath = path.join(downloadFolder, 'Eclipse_IDE');
    if (!fs.existsSync(extractPath)) fs.mkdirSync(extractPath, { recursive: true });
    
    // Show extraction spinner
    const spinnerFrames = ['/', '-', '\\', '|'];
    const spinnerColors = [colors.red, colors.blue, colors.yellow, colors.green];
    let step = 0;
    
    const progressInterval = setInterval(() => {
        const char = spinnerFrames[step % spinnerFrames.length];
        const color = spinnerColors[step % spinnerColors.length];
        process.stdout.write(`\r${colors.cyan}[Extracting]${colors.reset} ${color}${char}${colors.reset}`);
        step++;
    }, 100);
    
    try {
        const readStream = fs.createReadStream(filePath).pipe(unzipper.Parse()).on('entry', entry => {
            const fullPath = path.join(extractPath, entry.path);
            if (entry.type === 'Directory') {
                if (!fs.existsSync(fullPath)) fs.mkdirSync(fullPath, { recursive: true });
                entry.autodrain();
            } else {
                const pDir = path.dirname(fullPath);
                if (!fs.existsSync(pDir)) fs.mkdirSync(pDir, { recursive: true });
                entry.pipe(fs.createWriteStream(fullPath));
            }
        });

        await new Promise((resolve) => readStream.on('finish', resolve));
        
        clearInterval(progressInterval);
        process.stdout.write(`\r${' '.repeat(80)}\r`);
        console.log(`${colors.green}[SUCCESS]${colors.reset} Eclipse extracted to: ${extractPath}`);
        
    } catch (error) {
        clearInterval(progressInterval);
        process.stdout.write(`\r${' '.repeat(80)}\r`);
        console.log(`${colors.red}[ERROR]${colors.reset} Extraction failed: ${error.message}`);
        throw error;
    }
    
    // --- FIND ECLIPSE.EXE FOR MANUAL INSTALL ---
    console.log(`\n${colors.cyan}[INSTALLER DISCOVERY]${colors.reset} Looking for Eclipse installer...`);
    
    let eclipseExePath = null;
    let eclipseFolder = null;
    
    // Search for eclipse.exe in the extracted folder
    function findEclipseExe(startPath) {
        const files = fs.readdirSync(startPath, { withFileTypes: true });
        
        for (const file of files) {
            const fullPath = path.join(startPath, file.name);
            
            if (file.isDirectory()) {
                // Check if this is an eclipse folder
                if (file.name.toLowerCase().includes('eclipse')) {
                    eclipseFolder = fullPath;
                }
                
                // Recursively search
                const found = findEclipseExe(fullPath);
                if (found) return found;
                
            } else if (file.isFile()) {
                // Check for eclipse.exe
                if (file.name.toLowerCase() === 'eclipse.exe') {
                    return fullPath;
                }
            }
        }
        return null;
    }
    
    eclipseExePath = findEclipseExe(extractPath);
    
    if (eclipseExePath) {
        console.log(`${colors.green}[FOUND]${colors.reset} Eclipse executable: ${eclipseExePath}`);
        console.log(`${colors.green}[TYPE]${colors.reset} Application (.exe)`);
        console.log(`${colors.green}[DESCRIPTION]${colors.reset} eclipse.exe`);
        
        // Get file info
        const stats = fs.statSync(eclipseExePath);
        const fileSizeMB = (stats.size / (1024 * 1024)).toFixed(2);
        console.log(`${colors.green}[SIZE]${colors.reset} ${fileSizeMB} MB`);
        
        // Show instructions for manual installation
        console.log(`\n${colors.magenta}[MANUAL INSTALL INSTRUCTIONS]${colors.reset}`);
        console.log(`${colors.cyan}1.${colors.reset} Navigate to: ${extractPath}`);
        console.log(`${colors.cyan}2.${colors.reset} Look for folder named "eclipse"`);
        console.log(`${colors.cyan}3.${colors.reset} Run "eclipse.exe" to start Eclipse`);
        console.log(`${colors.cyan}4.${colors.reset} Eclipse is portable - no installation needed!`);
        
        // Offer to run it automatically
        console.log(`\n${colors.yellow}[OPTION]${colors.reset} Would you like to run Eclipse now?`);
        console.log(`${colors.yellow}Note:${colors.reset} Eclipse is ready to use - just run the .exe file`);
        
    } else {
        console.log(`${colors.yellow}[WARNING]${colors.reset} eclipse.exe not found automatically`);
        console.log(`${colors.yellow}[INFO]${colors.reset} Please check the extracted folder manually:`);
        console.log(`${colors.yellow}[PATH]${colors.reset} ${extractPath}`);
        
        // List top-level contents to help user
        console.log(`\n${colors.cyan}[FOLDER CONTENTS]${colors.reset}`);
        try {
            const items = fs.readdirSync(extractPath);
            items.forEach(item => {
                const itemPath = path.join(extractPath, item);
                const isDir = fs.statSync(itemPath).isDirectory();
                console.log(`  ${isDir ? '📁' : '📄'} ${item} ${isDir ? '(folder)' : ''}`);
            });
        } catch (e) {
            console.log(`${colors.red}[ERROR]${colors.reset} Could not read folder contents`);
        }
    }
    
    // Completion markers (for batch file integration)
    console.log(`\n${colors.magenta}[DOWNLOAD_COMPLETE]${colors.reset}`);
    console.log(`${colors.magenta}[FILE_PATH]${colors.reset} ${filePath}`);
    console.log(`${colors.magenta}[EXTRACT_PATH]${colors.reset} ${extractPath}`);
    console.log(`${colors.magenta}[ARCHITECTURE]${colors.reset} ${eclipseArch}`);
    console.log(`${colors.magenta}[VERSION]${colors.reset} ${eclipseVersion}`);
    if (eclipseExePath) {
        console.log(`${colors.magenta}[ECLIPSE_EXE]${colors.reset} ${eclipseExePath}`);
    }
    if (eclipseFolder) {
        console.log(`${colors.magenta}[ECLIPSE_FOLDER]${colors.reset} ${eclipseFolder}`);
    }
    
    process.exit(0);
})();

// Download function with percentage - FIXED: No early progress display
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
                reject(new Error(`HTTP ${response.statusCode} for ${url}`));
                return;
            }

            totalBytes = parseInt(response.headers['content-length'], 10);
            if (!totalBytes || totalBytes === 0) {
                totalBytes = 350000000; // 350MB estimate for Eclipse
            }
            
            const fileSizeMB = (totalBytes / (1024 * 1024)).toFixed(2);
            console.log(`${colors.yellow}[INFO]${colors.reset} File size: ${fileSizeMB} MB`);
            console.log(`${colors.yellow}[INFO]${colors.reset} Download in progress...`);
            
            // FIXED: Only start progress display AFTER we have file info
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
            reject(new Error('Download timeout (10 minutes)'));
        }, 600000);
    });
}