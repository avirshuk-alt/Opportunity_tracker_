# Start Opportunity Tracker dev server on localhost
# Double-click this file, or run in PowerShell: .\start-server.ps1
# Requires Node.js installed (https://nodejs.org)

Set-Location $PSScriptRoot

Write-Host "Checking for Node.js..." -ForegroundColor Cyan
$node = Get-Command node -ErrorAction SilentlyContinue
if (-not $node) {
    Write-Host "ERROR: Node.js is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Install from https://nodejs.org then restart PowerShell and run this script again." -ForegroundColor Yellow
    Write-Host "See SETUP-WINDOWS.md for details." -ForegroundColor Yellow
    pause
    exit 1
}

Write-Host "Node: $($node.Source)" -ForegroundColor Green
Write-Host ""

if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies (first run)..." -ForegroundColor Cyan
    npm install
    if ($LASTEXITCODE -ne 0) { Write-Host "npm install failed." -ForegroundColor Red; pause; exit 1 }
}

Write-Host "Starting dev server at http://localhost:3000 ..." -ForegroundColor Cyan
Write-Host "Press Ctrl+C to stop." -ForegroundColor Gray
Write-Host ""
npm run dev
