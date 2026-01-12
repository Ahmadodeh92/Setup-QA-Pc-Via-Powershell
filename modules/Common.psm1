function PreDownload-Setup {
    # ---- Downloads folder ----
    $global:userProfile     = [Environment]::GetFolderPath("UserProfile")
    $global:downloadFolder  = Join-Path $userProfile "Downloads\QA Setup"
    if (-not (Test-Path $downloadFolder)) { New-Item -ItemType Directory -Path $downloadFolder | Out-Null }
    Write-Host "[INFO] Download folder: $downloadFolder"

    # ---- Detect system architecture ----
    $global:arch = if ([Environment]::Is64BitOperatingSystem) { "x64" } else { "x86" }
    Write-Host "[INFO] Detected architecture: $arch"

    # ---- Force TLS 1.2 ----
    [Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
}
