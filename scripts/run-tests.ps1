# =========================================
# Multi-tool downloader (Node.js, Git, Temurin JDK)
# Auto-detect architecture, fetch latest, retry on failure
# =========================================

Set-ExecutionPolicy -Scope Process Bypass -Force

# -----------------------------------------
# Downloads folder
# -----------------------------------------
$userProfile = [Environment]::GetFolderPath("UserProfile")
$downloadsFolder = Join-Path $userProfile "Downloads"
$downloadFolder = Join-Path $downloadsFolder "QA Setup"

if (-not (Test-Path $downloadFolder)) {
    New-Item -ItemType Directory -Path $downloadFolder | Out-Null
}
Write-Host "Download folder: $downloadFolder"

# -----------------------------------------
# Detect system architecture
# -----------------------------------------
$arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
Write-Host "Detected architecture: $arch"

# -----------------------------------------
# Force TLS 1.2 (required for modern sites)
# -----------------------------------------
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

# -----------------------------------------
# Reusable download helper
# -----------------------------------------
function Get-File {
    param (
        [string]$Name,
        [string]$Url,
        [string]$OutputPath
    )

    Write-Host "`nDownloading $Name..."
    try {
        Start-BitsTransfer -Source $Url -Destination $OutputPath -Description "Downloading $Name"
        if ((Test-Path $OutputPath) -and ((Get-Item $OutputPath).Length -gt 1024)) {
            Write-Host "$Name successfully downloaded."
        } else {
            Write-Host "Download incomplete for $Name."
        }
    } catch {
        Write-Host ("Failed to download {0}: {1}" -f $Name, $_.Exception.Message)
    }
}

# =========================================
# Node.js LTS (COMMENTED, working reference)
# =========================================
<# 
$jsonUrl = "https://nodejs.org/dist/index.json"
Write-Host "`nFetching latest Node.js LTS info..."
$versions = Invoke-WebRequest -Uri $jsonUrl | ConvertFrom-Json
$latestLTS = $versions | Where-Object { $_.lts -ne $false } | Select-Object -First 1
Write-Host "Latest Node.js LTS: $($latestLTS.version)"
$nodeUrl = "https://nodejs.org/dist/$($latestLTS.version)/node-$($latestLTS.version)-$arch.msi"
$nodeFile = Join-Path $downloadFolder "NodeJS-$($latestLTS.version)-$arch.msi"
Get-File -Name "Node.js LTS" -Url $nodeUrl -OutputPath $nodeFile
#>

# =========================================
# Git for Windows Portable (COMMENTED, working reference)
# =========================================
<# 
Write-Host "`nFetching latest Git for Windows release info..."
$gitApiUrl = "https://api.github.com/repos/git-for-windows/git/releases/latest"
$gitRelease = Invoke-WebRequest -Uri $gitApiUrl -Headers @{ "User-Agent" = "PowerShell" } | ConvertFrom-Json
$archGit = if ([Environment]::Is64BitOperatingSystem) { "64-bit" } else { "32-bit" }
if ($archGit -eq "64-bit") {
    $gitAsset = $gitRelease.assets | Where-Object { $_.name -match "PortableGit.*(64|x64).*\.exe" } | Select-Object -First 1
} else {
    $gitAsset = $gitRelease.assets | Where-Object { $_.name -match "PortableGit.*(32|x86).*\.exe" } | Select-Object -First 1
}
if (-not $gitAsset) { Write-Host "Git standalone installer not found for architecture $archGit"; return }
$gitVersion = $gitRelease.tag_name
$gitUrl = $gitAsset.browser_download_url
$gitFile = Join-Path $downloadFolder "Git-Portable-$gitVersion-$archGit.exe"
Get-File -Name "Git Portable $gitVersion ($archGit)" -Url $gitUrl -OutputPath $gitFile
Write-Host "Git Portable download complete. Version: $gitVersion, Architecture: $archGit"
#>

# =========================================
# Temurin JDK Downloader (Windows x64/x86)
# =========================================



# =========================================
# Template for additional tools
# =========================================
<#
Write-Host "`nFetching <Tool Name>..."
$toolApiUrl = "<JSON feed or latest download URL>"
$toolRelease = Invoke-WebRequest -Uri $toolApiUrl -Headers @{ "User-Agent" = "PowerShell" } | ConvertFrom-Json
if ($arch -eq "64-bit") {
    $toolAsset = $toolRelease.assets | Where-Object { $_.name -match "(64|x64)" } | Select-Object -First 1
} else {
    $toolAsset = $toolRelease.assets | Where-Object { $_.name -match "(32|x86)" } | Select-Object -First 1
}
$toolVersion = $toolRelease.tag_name
$toolUrl = $toolAsset.browser_download_url
$toolFile = Join-Path $downloadFolder "<ToolName>-$toolVersion-$arch.exe"
Get-File -Name "<ToolName> $toolVersion ($arch)" -Url $toolUrl -OutputPath $toolFile
#>

Write-Host "`n=== All downloads completed ==="
Write-Host "Check folder: $downloadFolder"
