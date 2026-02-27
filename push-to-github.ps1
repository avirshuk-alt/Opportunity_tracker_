# Push Opportunity Tracker to GitHub
# Run: .\push-to-github.ps1
# Requires: Git installed (https://git-scm.com/download/win)

Set-Location $PSScriptRoot

Write-Host "Checking for Git..." -ForegroundColor Cyan
$git = Get-Command git -ErrorAction SilentlyContinue
if (-not $git) {
    Write-Host "ERROR: Git is not installed or not in PATH." -ForegroundColor Red
    Write-Host "Install from https://git-scm.com/download/win then restart PowerShell." -ForegroundColor Yellow
    Write-Host "See GITHUB-SETUP.md for full instructions." -ForegroundColor Yellow
    exit 1
}

Write-Host "Git found: $($git.Source)" -ForegroundColor Green
Write-Host ""

# Check if already a git repo
if (Test-Path ".git") {
    Write-Host "Git already initialized." -ForegroundColor Green
} else {
    Write-Host "Initializing git..." -ForegroundColor Cyan
    git init
    git add .
    git commit -m "Initial commit: Opportunity Tracker"
    git branch -M main
}

# Get repo URL
$url = Read-Host "Paste your GitHub repo URL (e.g. https://github.com/username/opportunity-tracker.git)"
$url = $url.Trim()
if (-not $url) {
    Write-Host "No URL provided. Exiting." -ForegroundColor Red
    exit 1
}
if (-not $url.EndsWith(".git")) {
    $url = $url + ".git"
}

# Remove existing origin if any, add new one
git remote remove origin 2>$null
git remote add origin $url

Write-Host ""
Write-Host "Pushing to GitHub..." -ForegroundColor Cyan
git push -u origin main

if ($LASTEXITCODE -eq 0) {
    $shareUrl = $url -replace '\.git$', ''
    Write-Host ""
    Write-Host "SUCCESS!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Share this link with your team:" -ForegroundColor Cyan
    Write-Host "  $shareUrl" -ForegroundColor White
    Write-Host ""
    Write-Host "To add collaborators: Repo -> Settings -> Collaborators -> Add people" -ForegroundColor Gray
} else {
    Write-Host ""
    Write-Host "Push failed. Common causes:" -ForegroundColor Red
    Write-Host "  - Repo doesn't exist yet: Create it at https://github.com/new" -ForegroundColor Yellow
    Write-Host "  - Wrong URL: Check the repo URL" -ForegroundColor Yellow
    Write-Host "  - Auth: You may need to sign in (GitHub will prompt)" -ForegroundColor Yellow
}
