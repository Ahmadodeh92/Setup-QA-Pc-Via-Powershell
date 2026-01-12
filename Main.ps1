# =========================================
# Main.ps1 - QA Tools Download Manager
# =========================================

# ---- Pre-download setup function ----
function PreDownload-Setup {
    $global:userProfile    = [Environment]::GetFolderPath("UserProfile")
    $global:downloadFolder = Join-Path $userProfile "Downloads\QA Tools"
    if (-not (Test-Path $downloadFolder)) { 
        New-Item -ItemType Directory -Path $downloadFolder | Out-Null 
    }
    Write-Host "[INFO] Download folder: $downloadFolder"

    $global:arch = if ([Environment]::Is64BitOperatingSystem) { "64-bit" } else { "32-bit" }
    Write-Host "[INFO] Detected architecture: $arch"

    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
}

# ---- Run pre-download setup ----
PreDownload-Setup

# ---- Simple menu ----
function Show-Menu {
    Clear-Host
    Write-Host "======================================="
    Write-Host "QA Tools Downloader"
    Write-Host "======================================="
    Write-Host "1. Node.js"
    Write-Host "2. Git"
    Write-Host "3. Java"
    Write-Host "4. Postman"
    Write-Host "5. Appium Inspector"
    Write-Host "6. VSCode"
    Write-Host "7. Eclipse"
    Write-Host "0. Exit"
    Write-Host "======================================="
    $choice = Read-Host "Enter the number of the software to download"
    return $choice
}

# ---- Dispatcher ----
do {
    $selection = Show-Menu
    switch ($selection) {
        '1' {
            Write-Host "[INFO] Node.js download starting..."
            $nodeScript = Join-Path $PSScriptRoot "scripts\NodeJs.js"
            & node $nodeScript $downloadFolder $arch
        }
        '2' {
            Write-Host "[INFO] Git download starting..."
            $gitScript = Join-Path $PSScriptRoot "scripts\GitDownload.js"
            & node $gitScript $downloadFolder $arch
        }
        '3' {
            Write-Host "[INFO] Java download starting..."
            $javaScript = Join-Path $PSScriptRoot "scripts\JavaDownload.js"
            & node $javaScript $downloadFolder $arch
        }
        '4' {
            Write-Host "[INFO] Postman download starting..."
            $postmanScript = Join-Path $PSScriptRoot "scripts\PostmanDownload.js"
            & node $postmanScript $downloadFolder $arch
        }
        '5' {
            Write-Host "[INFO] Appium Inspector download starting..."
            $appiumScript = Join-Path $PSScriptRoot "scripts\AppiumInspectorDownload.js"
            & node $appiumScript $downloadFolder $arch
        }
        '6' {
            Write-Host "[INFO] VSCode download starting..."
            $vscodeScript = Join-Path $PSScriptRoot "scripts\VsCodeDownload.js"
            & node $vscodeScript $downloadFolder $arch
        }
        '7' {
            Write-Host "[INFO] Eclipse download starting..."
            $eclipseScript = Join-Path $PSScriptRoot "scripts\EclipseDownload.js"
            & node $eclipseScript $downloadFolder $arch
        }
        '0' {
            Write-Host "[INFO] Exiting..."
        }
        default {
            Write-Host "[WARN] Invalid selection!"
        }
    }
    if ($selection -ne '0') { Read-Host "Press Enter to return to menu..." }
} while ($selection -ne '0')
