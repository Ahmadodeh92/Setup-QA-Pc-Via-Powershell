Get-Command
Get-Help <command>
Start-Process "git" -ArgumentList "--version" -Wait
Get-Command git -ErrorAction SilentlyContinue
$output = git --version 2>&1
$config = Get-Content tools.json | ConvertFrom-Json
