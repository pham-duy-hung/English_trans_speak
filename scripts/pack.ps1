# Pack extension zip for friends (includes your Azure key from pack-secrets.json).
# Usage:
#   1. Copy pack-secrets.example.json -> pack-secrets.json and fill key/region
#   2. Run:  powershell -ExecutionPolicy Bypass -File .\scripts\pack.ps1

$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent (Split-Path -Parent $MyInvocation.MyCommand.Path)
Set-Location $root

$secretsPath = Join-Path $root 'pack-secrets.json'
if (-not (Test-Path $secretsPath)) {
  Write-Host "Missing pack-secrets.json"
  Write-Host "Copy pack-secrets.example.json -> pack-secrets.json and paste your Azure key."
  exit 1
}

$secrets = Get-Content $secretsPath -Raw | ConvertFrom-Json
$key = [string]$secrets.azureKey
$region = [string]$secrets.azureRegion

if ([string]::IsNullOrWhiteSpace($key) -or $key -eq 'PASTE_YOUR_AZURE_KEY_HERE') {
  Write-Host "pack-secrets.json still has an empty/placeholder key."
  exit 1
}
if ([string]::IsNullOrWhiteSpace($region)) {
  $region = 'eastasia'
}

$dist = Join-Path $root 'dist'
$stage = Join-Path $dist 'English_trans_speak'
$zip = Join-Path $dist 'English_trans_speak.zip'

if (Test-Path $dist) { Remove-Item $dist -Recurse -Force }
New-Item -ItemType Directory -Path $stage | Out-Null

$include = @(
  'manifest.json',
  'README.md',
  'INSTALL-FRIENDS.md',
  'background',
  'popup',
  'options',
  'lib',
  'icons'
)

foreach ($item in $include) {
  $src = Join-Path $root $item
  if (-not (Test-Path $src)) { continue }
  $dest = Join-Path $stage $item
  Copy-Item $src $dest -Recurse -Force
}

# Inject shared config with your key (only inside the friend zip)
$escapedKey = $key.Replace('\', '\\').Replace("'", "\'")
$escapedRegion = $region.Replace('\', '\\').Replace("'", "\'")
$config = @"
/**
 * Bundled for friends — do not upload this zip publicly.
 */
export const SHARED_AZURE = {
  key: '$escapedKey',
  region: '$escapedRegion',
};
"@
Set-Content -Path (Join-Path $stage 'lib\shared-config.js') -Value $config -Encoding UTF8

if (Test-Path $zip) { Remove-Item $zip -Force }
Compress-Archive -Path (Join-Path $stage '*') -DestinationPath $zip -Force

Write-Host ""
Write-Host "Done: $zip"
Write-Host "Send this zip privately (Zalo/Drive restricted). Anyone with the zip has your Azure key."
Write-Host "Friends: unzip -> chrome://extensions -> Load unpacked -> select the folder."
