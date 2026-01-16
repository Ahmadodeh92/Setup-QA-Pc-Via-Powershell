@echo off
setlocal enabledelayedexpansion
:: --- Force UTF-8 for icons and frames ---
>nul chcp 65001
title QA Tools Downloader v2.0.0

:: --- Colors for CMD ---
set "cyan=[36m"
set "yellow=[33m"
set "white=[37m"
set "green=[32m"
set "red=[31m"
set "magenta=[35m"
set "reset=[0m"

:: --- Configuration ---
set "DOWNLOAD_DIR=%USERPROFILE%\Downloads\QA Tools"
set "SCRIPTS_DIR=%~dp0scripts"
if not exist "%DOWNLOAD_DIR%" mkdir "%DOWNLOAD_DIR%"

:MENU
cls
:: Padding for centering
set "p="

:: --- SYSTEM INFO GATHERING ---
:: CPU
set "cpu=Detecting..."
for /f "skip=1 tokens=*" %%a in ('wmic cpu get name 2^>nul') do (
    if not defined cpuLine if not "%%a"=="" set "cpuLine=%%a"
)
set "cpu=%cpuLine%"
set "cpuLine="

:: RAM in GB
for /f %%a in ('powershell -NoProfile -Command "[math]::Round((Get-CimInstance Win32_PhysicalMemory | Measure-Object Capacity -Sum).Sum/1GB,1)"') do set "ramGB=%%a"

:: Available Storage on C: in GB - MOST RELIABLE
set "diskGB=0"
for /f %%a in ('powershell -Command "$freeBytes = (Get-WmiObject Win32_LogicalDisk -Filter 'DeviceID=\"C:\"').FreeSpace; [math]::Round($freeBytes/1073741824, 1)"') do (
    set "diskGB=%%a"
)

:: System Type
for /f "skip=1 tokens=*" %%a in ('wmic os get OSArchitecture 2^>nul') do (
    if not defined osArchLine if not "%%a"=="" set "osArchLine=%%a"
)
set "osArch=%osArchLine%"
set "osArchLine="

:: --- FILE DETECTION ---
set "check1=0" & if exist "%DOWNLOAD_DIR%\node-v*" set "check1=1"
set "check2=0" & if exist "%DOWNLOAD_DIR%\Git-*" set "check2=1"
set "check3=0" & if exist "%DOWNLOAD_DIR%\*jre*" set "check3=1" & if exist "%DOWNLOAD_DIR%\*jdk*" set "check3=1" & if exist "%DOWNLOAD_DIR%\*java*" set "check3=1"
set "check4=0" & if exist "%DOWNLOAD_DIR%\Postman*" set "check4=1"
set "check5=0" & if exist "%DOWNLOAD_DIR%\Appium*" set "check5=1"
set "check6=0" & if exist "%DOWNLOAD_DIR%\VSCode*" set "check6=1"
set "check7=0" & if exist "%DOWNLOAD_DIR%\eclipse-*" set "check7=1"
set "check8=0" & if exist "%DOWNLOAD_DIR%\jdk-*" set "check8=1" & if exist "%DOWNLOAD_DIR%\openjdk-*" set "check8=1"

set "sig1=%red%[✘]%reset%" & if "!check1!"=="1" set "sig1=%green%[✔]%reset%"
set "sig2=%red%[✘]%reset%" & if "!check2!"=="1" set "sig2=%green%[✔]%reset%"
set "sig3=%red%[✘]%reset%" & if "!check3!"=="1" set "sig3=%green%[✔]%reset%"
set "sig4=%red%[✘]%reset%" & if "!check4!"=="1" set "sig4=%green%[✔]%reset%"
set "sig5=%red%[✘]%reset%" & if "!check5!"=="1" set "sig5=%green%[✔]%reset%"
set "sig6=%red%[✘]%reset%" & if "!check6!"=="1" set "sig6=%green%[✔]%reset%"
set "sig7=%red%[✘]%reset%" & if "!check7!"=="1" set "sig7=%green%[✔]%reset%"
set "sig8=%red%[✘]%reset%" & if "!check8!"=="1" set "sig8=%green%[✔]%reset%"

:: --- HEADER DISPLAY ---
echo %cyan%%p%┌──────────────────────────────────%white%*Welcome to QA Tools Downloader*%cyan%────────────────────────────┐%reset%
echo %cyan%%p%│                                                                                              │%reset%
echo %cyan%%p%│                                                                                              │%reset%
echo %cyan%%p%│    ██████      █████████      ███████████    ███████       ███████    █████        █████████ │%reset%
echo %cyan%%p%│  ███░░░░███   ███░░░░░███    ░█░░░███░░░█  ███░░░░░███   ███░░░░░███ ░░███        ███░░░░░███│%reset%
echo %cyan%%p%│ ███    ░░███ ░███    ░███    ░   ░███  ░  ███     ░░███ ███     ░░███ ░███       ░███    ░░░ │%reset%
echo %cyan%%p%│░███     ░███ ░███████████        ░███    ░███      ░███░███      ░███ ░███       ░░█████████ │%reset%
echo %cyan%%p%│░███   ██░███ ░███░░░░░███        ░███    ░███      ░███░███      ░███ ░███        ░░░░░░░░███│%reset%
echo %cyan%%p%│░░███ ░░████  ░███    ░███        ░███    ░░███     ███  ░░███     ███  ░███      █ ███    ░██│%reset%
echo %cyan%%p%│ ░░░██████░██ █████   █████       █████    ░░░███████░   ░░░███████░   ███████████░░█████████ │%reset%
echo %cyan%%p%│   ░░░░░░ ░░ ░░░░░   ░░░░░       ░░░░░       ░░░░░░░       ░░░░░░░    ░░░░░░░░░░░  ░░░░░░░░░  │%reset%
echo %cyan%%p%└─────────────────────────%white%* The Ultimate QA Environment Setup v1.0.0 *%reset%%cyan%─────────────────────────┘%reset%

:: --- SYSTEM INFO DISPLAY ---
echo %cyan%┌──────────────────────────────────────────────────────────────────────────────────────────────┐%reset%
echo %cyan%│ %yellow%SYSTEM INFORMATION%reset%                                                                           %cyan%│%reset%
echo %cyan%├──────────────────────────────────────────────────────────────────────────────────────────────┤%reset%
echo %cyan%│ %magenta%* - Processor:   %reset% !cpu!                                 %cyan%│%reset%
echo %cyan%│ %magenta%* - RAM:         %reset% !ramGB! GB                                                                       %cyan%│%reset%
echo %cyan%│ %magenta%* - Storage:     %reset% !diskGB! GB free (C: Drive)                                                    %cyan%│%reset%
echo %cyan%│ %magenta%* - System Type: %reset% !osArch!                                                           %cyan%│%reset%
echo %cyan%└──────────────────────────────────────────────────────────────────────────────────────────────┘%reset%

:: --- FILE DETECTION & COOL SHAPE LOGIC ---
set "sh1=%red%[X]%reset%" & if "!check1!"=="1" set "sh1=%green%[✓]%reset%"
set "sh2=%red%[X]%reset%" & if "!check2!"=="1" set "sh2=%green%[✓]%reset%"
set "sh3=%red%[X]%reset%" & if "!check3!"=="1" set "sh3=%green%[✓]%reset%"
set "sh4=%red%[X]%reset%" & if "!check4!"=="1" set "sh4=%green%[✓]%reset%"
set "sh5=%red%[X]%reset%" & if "!check5!"=="1" set "sh5=%green%[✓]%reset%"
set "sh6=%red%[X]%reset%" & if "!check6!"=="1" set "sh6=%green%[✓]%reset%"
set "sh7=%red%[X]%reset%" & if "!check7!"=="1" set "sh7=%green%[✓]%reset%"
set "sh8=%red%[X]%reset%" & if "!check8!"=="1" set "sh8=%green%[✓]%reset%"

:: --- UPDATED MENU BLOCK ---
echo %cyan%┌──────────────────────────────────────────────────────────────────────────────────────────────┐%reset%
echo %cyan%│                                                                                              │%reset%
echo %cyan%│%reset% %white%    !sh1! 1. Node.js         !sh2! 2. Git             !sh3! 3. Java%reset%                                %cyan%│%reset%
echo %cyan%│%reset% %white%    !sh4! 4. Postman         !sh5! 5. Appium          !sh6! 6. VSCode%reset%                              %cyan%│%reset%
echo %cyan%│%reset% %white%    !sh7! 7. Eclipse         !sh8! 8. JDK             [ ] 0. Exit%reset%                                                       %cyan%│%reset%
echo %cyan%│                                                                                              │%reset%
echo %cyan%└─────────────────────────────────By KANWULF───────────────────────────────────────────────────┘%reset%
set /p choice="%cyan%Enter selection: %reset%"

if "%choice%"=="1" set "APP=Node.js" & set "STATUS=!check1!" & set "JS=NodeJsDownload.js" & goto RUN
if "%choice%"=="2" set "APP=Git"     & set "STATUS=!check2!" & set "JS=GitDownload.js" & goto RUN
if "%choice%"=="3" set "APP=Java"    & set "STATUS=!check3!" & set "JS=JavaDownload.js" & goto RUN
if "%choice%"=="4" set "APP=Postman" & set "STATUS=!check4!" & set "JS=PostmanDownload.js" & goto RUN
if "%choice%"=="5" set "APP=Appium"  & set "STATUS=!check5!" & set "JS=AppiumInspectorDownload.js" & goto RUN
if "%choice%"=="6" set "APP=VSCode"  & set "STATUS=!check6!" & set "JS=VsCodeDownload.js" & goto RUN
if "%choice%"=="7" set "APP=Eclipse" & set "STATUS=!check7!" & set "JS=EclipseDownload.js" & goto RUN
if "%choice%"=="8" set "APP=JDK"     & set "STATUS=!check8!" & set "JS=JDK-Download.js" & goto RUN
if "%choice%"=="0" exit
goto MENU

:RUN
cls
echo %cyan%%p% ┌───────────────────────────────────────────────────────────────┐%reset%
if "%STATUS%"=="1" (
    echo %cyan%%p% │%reset%  %green%[CHECK]%reset% %APP% is already present. Skipping to install..         %cyan%│%reset%
    echo %cyan%%p% └───────────────────────────────────────────────────────────────┘%reset%
    timeout /t 1 >nul
    goto INSTALL_MENU
)
echo %cyan%%p%│%reset% %yellow%[INFO]%reset% Starting %APP%...                                               %cyan%│%reset%
echo %cyan%%p%└────────────────────────────────────────────────────────────────────────────────────────────────────┘%reset%
if exist "%SCRIPTS_DIR%\%JS%" (
    node "%SCRIPTS_DIR%\%JS%" "%DOWNLOAD_DIR%"
) else (
    echo %red%%p%[ERROR] Script %JS% not found in %SCRIPTS_DIR%%reset%
    pause
    goto MENU
)

:INSTALL_MENU
echo.
echo %cyan%%p%┌────────────────────────────────────────────────────────────────┐%reset%
echo %cyan%%p%│%reset% %yellow%   INSTALLATION OPTIONS FOR %APP%%reset%     %cyan%│%reset%
echo %cyan%%p%├────────────────────────────────────────────────────────────────┤%reset%
echo %cyan%%p%│%reset% %white%   1.  Express (Silent)%reset%                                        %cyan%│%reset%
echo %cyan%%p%│%reset% %white%   2.  Manual (Open Installer)%reset%                                 %cyan%│%reset%
echo %cyan%%p%│%reset% %white%   3.  Return to Menu%reset%                                          %cyan%│%reset%
echo %cyan%%p%└──────────────────────────────────────────────────────────────┘%reset%
set /p inst_choice="%green%%p%Choose option: %reset%"

if "%inst_choice%"=="1" goto SILENT
if "%inst_choice%"=="2" goto MANUAL
if "%inst_choice%"=="3" goto MENU
goto INSTALL_MENU

:SILENT
:: [Silent Logic Here]
goto MENU

:MANUAL
echo %p%%cyan%[SEARCHING]%reset% Scanning for installer in %DOWNLOAD_DIR%...
set "targetExe="
:: Smart search for .exe or .msi recursively
for /f "delims=" %%i in ('dir /b /s /o-d "%DOWNLOAD_DIR%\*.exe" "%DOWNLOAD_DIR%\*.msi" 2^>nul') do (
    set "targetExe=%%i"
    goto LAUNCH
)

:LAUNCH
if defined targetExe (
    echo %p%%green%[FOUND]%reset% Launching: "!targetExe!"
    start "" "!targetExe!"
) else (
    echo %p%%red%[ERROR]%reset% No installer found.
    pause
)
goto MENU

@Rem==============================================================================================================