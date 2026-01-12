@echo off
REM ========================================
REM QA Tools Setup Launcher
REM ========================================

REM Launch PowerShell script
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0Main.ps1"

pause
