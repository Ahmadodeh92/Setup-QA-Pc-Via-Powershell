// // ======================================
// // AppiumInspectorDownload.js - HEADLESS DOWNLOAD (API-based)
// // ======================================

// const fs = require('fs');
// const path = require('path');
// const os = require('os');
// const fetch = require('node-fetch');

// // ---------- Args from PowerShell ----------
// const downloadFolder =
//   process.argv[2] ||
//   path.join(os.homedir(), 'Downloads', 'QA Tools');
// const arch = process.argv[3] || (process.arch === 'x64' ? 'x64' : 'x86');

// // ---------- Ensure download folder ----------
// if (!fs.existsSync(downloadFolder)) {
//   fs.mkdirSync(downloadFolder, { recursive: true });
// }

// (async () => {
//   console.log(`[INFO] Download folder: ${downloadFolder}`);
//   console.log(`[INFO] Detected architecture: ${arch}`);

//   // ---------- GitHub API URL for Appium Inspector releases ----------
//   const apiUrl = 'https://api.github.com/repos/appium/appium-inspector/releases/latest';

//   try {
//     const response = await fetch(apiUrl, {
//       headers: { 'User-Agent': 'QA-Tools-Downloader' }
//     });
//     const release = await response.json();

//     // ---------- Find the .exe asset that matches architecture ----------
//     const asset = release.assets.find(a => {
//       const name = a.name.toLowerCase();
//       return name.endsWith('.exe') && name.includes(arch);
//     });

//     if (!asset) {
//       console.log(`[ERROR] No installer found for architecture: ${arch}`);
//       return;
//     }

//     console.log(`[INFO] Found latest release: ${release.tag_name}`);
//     console.log(`[INFO] Downloading asset: ${asset.name}`);

//     // ---------- Download file ----------
//     const downloadResponse = await fetch(asset.browser_download_url);
//     const filePath = path.join(downloadFolder, asset.name);
//     const fileStream = fs.createWriteStream(filePath);
//     await new Promise((resolve, reject) => {
//       downloadResponse.body.pipe(fileStream);
//       downloadResponse.body.on('error', reject);
//       fileStream.on('finish', resolve);
//     });

//     console.log(`[SUCCESS] Appium Inspector downloaded to: ${filePath}`);
//   } catch (err) {
//     console.error('[ERROR] Download failed:', err);
//   }
// })();

// ======================================
// AppiumInspectorDownload.js - HEADLESS DOWNLOAD with progress
// ======================================

const fs = require('fs');
const path = require('path');
const os = require('os');
const fetch = require('node-fetch');

// ---------- Args from PowerShell ----------
const downloadFolder =
  process.argv[2] ||
  path.join(os.homedir(), 'Downloads', 'QA Tools');
const arch = process.argv[3] || (process.arch === 'x64' ? 'x64' : 'x86');

// ---------- Ensure download folder ----------
if (!fs.existsSync(downloadFolder)) {
  fs.mkdirSync(downloadFolder, { recursive: true });
}

(async () => {
  console.log(`[INFO] Download folder: ${downloadFolder}`);
  console.log(`[INFO] Detected architecture: ${arch}`);

  // ---------- GitHub API URL for Appium Inspector releases ----------
  const apiUrl = 'https://api.github.com/repos/appium/appium-inspector/releases/latest';

  try {
    const response = await fetch(apiUrl, {
      headers: { 'User-Agent': 'QA-Tools-Downloader' }
    });
    const release = await response.json();

    // ---------- Find the .exe asset that matches architecture ----------
    const asset = release.assets.find(a => {
      const name = a.name.toLowerCase();
      return name.endsWith('.exe') && name.includes(arch);
    });

    if (!asset) {
      console.log(`[ERROR] No installer found for architecture: ${arch}`);
      return;
    }

    console.log(`[INFO] Found latest release: ${release.tag_name}`);
    console.log(`[INFO] Downloading asset: ${asset.name}`);

    // ---------- Download file with progress ----------
    const downloadResponse = await fetch(asset.browser_download_url);

    const totalBytes = parseInt(downloadResponse.headers.get('content-length')) || 0;
    const filePath = path.join(downloadFolder, asset.name);
    const fileStream = fs.createWriteStream(filePath);

    let downloadedBytes = 0;

    downloadResponse.body.on('data', chunk => {
      downloadedBytes += chunk.length;
      if (totalBytes) {
        const percent = ((downloadedBytes / totalBytes) * 100).toFixed(2);
        process.stdout.write(
          `\r[DOWNLOAD] ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB of ${(totalBytes / 1024 / 1024).toFixed(2)} MB (${percent}%)`
        );
      } else {
        process.stdout.write(`\r[DOWNLOAD] ${(downloadedBytes / 1024 / 1024).toFixed(2)} MB downloaded`);
      }
    });

    await new Promise((resolve, reject) => {
      downloadResponse.body.pipe(fileStream);
      downloadResponse.body.on('error', reject);
      fileStream.on('finish', resolve);
    });

    console.log(`\n[SUCCESS] Appium Inspector downloaded to: ${filePath}`);
  } catch (err) {
    console.error('[ERROR] Download failed:', err);
  }
})();

