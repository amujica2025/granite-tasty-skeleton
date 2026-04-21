param(
  [string]$RepoRoot = 'C:\Users\alexm\granite_tasty_skeleton'
)

$ErrorActionPreference = 'Stop'

function Write-Step($message) {
  Write-Host "`n==> $message" -ForegroundColor Cyan
}

function Ensure-Path($path) {
  if (!(Test-Path $path)) {
    New-Item -ItemType Directory -Path $path -Force | Out-Null
  }
}

$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$PayloadRoot = Join-Path $ScriptRoot 'payload'
$FrontendRoot = Join-Path $RepoRoot 'frontend'
$SrcRoot = Join-Path $FrontendRoot 'src'

if (!(Test-Path $RepoRoot)) {
  throw "Repo root not found: $RepoRoot"
}

if (!(Test-Path $FrontendRoot)) {
  throw "Frontend folder not found: $FrontendRoot"
}

if (!(Test-Path $SrcRoot)) {
  throw "Frontend src folder not found: $SrcRoot"
}

$Timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$BackupRoot = Join-Path $RepoRoot "backup_troubleshooting_agent_$Timestamp"
Ensure-Path $BackupRoot

$FilesToCopy = @(
  'frontend/src/App.tsx',
  'frontend/src/components/alerts/AlertsPanel.tsx',
  'frontend/src/components/alerts/alertsTypes.ts',
  'frontend/src/components/alerts/alertsUtils.ts',
  'frontend/src/components/artifact/ArtifactCanvas.tsx',
  'frontend/src/components/artifact/ArtifactModal.tsx',
  'frontend/src/components/artifact/artifactTypes.ts',
  'frontend/src/components/artifact/artifactUtils.ts',
  'frontend/src/components/artifact/useArtifactStore.ts',
  'frontend/src/components/journal/JournalPopup.tsx',
  'frontend/src/components/scanner/ScannerPanel.tsx',
  'frontend/src/components/scanner/scannerTypes.ts',
  'frontend/src/components/scanner/scannerUtils.ts',
  'frontend/src/components/watchlist/MiniPriceChart.tsx',
  'frontend/src/components/watchlist/WatchlistPanel.tsx',
  'frontend/src/components/watchlist/watchlistSeed.ts',
  'frontend/src/components/watchlist/watchlistTypes.ts',
  'frontend/src/components/watchlist/watchlistUtils.ts'
)

Write-Step "Backing up existing files to $BackupRoot"
foreach ($relativePath in $FilesToCopy) {
  $TargetPath = Join-Path $RepoRoot $relativePath
  if (Test-Path $TargetPath) {
    $BackupPath = Join-Path $BackupRoot $relativePath
    Ensure-Path (Split-Path -Parent $BackupPath)
    Copy-Item $TargetPath $BackupPath -Force
  }
}

Write-Step 'Creating component folders'
Ensure-Path (Join-Path $RepoRoot 'frontend/src/components/alerts')
Ensure-Path (Join-Path $RepoRoot 'frontend/src/components/artifact')
Ensure-Path (Join-Path $RepoRoot 'frontend/src/components/journal')
Ensure-Path (Join-Path $RepoRoot 'frontend/src/components/scanner')
Ensure-Path (Join-Path $RepoRoot 'frontend/src/components/watchlist')

Write-Step 'Copying integrated frontend files'
foreach ($relativePath in $FilesToCopy) {
  $SourcePath = Join-Path $PayloadRoot $relativePath
  $TargetPath = Join-Path $RepoRoot $relativePath
  Ensure-Path (Split-Path -Parent $TargetPath)
  Copy-Item $SourcePath $TargetPath -Force
}

Write-Step 'Running frontend type/build verification'
Push-Location $FrontendRoot
try {
  npm run build
  if ($LASTEXITCODE -ne 0) {
    throw "Frontend build failed with exit code $LASTEXITCODE"
  }
}
finally {
  Pop-Location
}

Write-Step 'Install complete'
Write-Host "Backup saved to: $BackupRoot" -ForegroundColor Green
Write-Host 'The App.tsx integration and component mounts are now installed.' -ForegroundColor Green
