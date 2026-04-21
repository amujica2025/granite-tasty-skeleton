param(
  [string]$RepoRoot = 'C:\Users\alexm\granite_tasty_skeleton',
  [string]$PushoverUserKey = 'uw8mofrtidtoc46hth3v86dymnssyi',
  [string]$PushoverAppToken = 'a9sgeqip8nhorgd9mb4r1f1qkcrf4j'
)
$ErrorActionPreference = 'Stop'
function Write-Step($m){ Write-Host "`n==> $m" -ForegroundColor Cyan }
function Ensure-Path($p){ if(!(Test-Path $p)){ New-Item -ItemType Directory -Path $p -Force | Out-Null } }
function Set-Or-AppendEnvValue($FilePath, $Key, $Value){ if(!(Test-Path $FilePath)){ New-Item -ItemType File -Path $FilePath -Force | Out-Null }; $content = Get-Content $FilePath -Raw -ErrorAction SilentlyContinue; if($content -match "(?m)^$Key=") { $content = [regex]::Replace($content, "(?m)^$Key=.*$", "$Key=$Value") } else { if($content -and -not $content.EndsWith("`n")) { $content += "`r`n" }; $content += "$Key=$Value`r`n" }; Set-Content -Path $FilePath -Value $content -NoNewline }
$ScriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$PayloadRoot = Join-Path $ScriptRoot 'payload'
$FrontendRoot = Join-Path $RepoRoot 'frontend'
$BackendRoot = Join-Path $RepoRoot 'backend'
if(!(Test-Path $FrontendRoot)){ throw "Frontend folder not found: $FrontendRoot" }
if(!(Test-Path $BackendRoot)){ throw "Backend folder not found: $BackendRoot" }
$Timestamp = Get-Date -Format 'yyyyMMdd_HHmmss'
$BackupRoot = Join-Path $RepoRoot "backup_live_troubleshooting_agent_$Timestamp"
Ensure-Path $BackupRoot
$FilesToCopy = @(
'frontend/src/App.tsx','frontend/src/index.css','frontend/src/components/PositionsPanel.tsx',
'frontend/src/components/alerts/AlertsPanel.tsx','frontend/src/components/alerts/alertsTypes.ts','frontend/src/components/alerts/alertsUtils.ts',
'frontend/src/components/artifact/ArtifactCanvas.tsx','frontend/src/components/artifact/ArtifactRail.tsx','frontend/src/components/artifact/ArtifactModal.tsx','frontend/src/components/artifact/artifactTypes.ts','frontend/src/components/artifact/artifactUtils.ts','frontend/src/components/artifact/useArtifactStore.ts',
'frontend/src/components/journal/JournalPopup.tsx',
'frontend/src/components/scanner/ScannerPanel.tsx','frontend/src/components/scanner/scannerTypes.ts','frontend/src/components/scanner/scannerUtils.ts',
'frontend/src/components/watchlist/MiniPriceChart.tsx','frontend/src/components/watchlist/WatchlistPanel.tsx','frontend/src/components/watchlist/watchlistSeed.ts','frontend/src/components/watchlist/watchlistTypes.ts','frontend/src/components/watchlist/watchlistUtils.ts',
'backend/main.py','backend/config.py','backend/routers/accounts.py','backend/routers/market.py','backend/routers/alerts.py','backend/streamers/market_streamer.py','backend/streamers/account_streamer.py','backend/services/live_state.py','backend/services/alert_engine.py','backend/data/weeklys_symbols.py'
)
Write-Step "Backing up existing files to $BackupRoot"
foreach($relativePath in $FilesToCopy){ $target = Join-Path $RepoRoot $relativePath; if(Test-Path $target){ $backup = Join-Path $BackupRoot $relativePath; Ensure-Path (Split-Path -Parent $backup); Copy-Item $target $backup -Force } }
Write-Step 'Creating required folders'
@('frontend/src/components/alerts','frontend/src/components/artifact','frontend/src/components/journal','frontend/src/components/scanner','frontend/src/components/watchlist','backend/routers','backend/streamers','backend/services','backend/data') | ForEach-Object { Ensure-Path (Join-Path $RepoRoot $_) }
Write-Step 'Copying frontend and backend payload files'
foreach($relativePath in $FilesToCopy){ $source = Join-Path $PayloadRoot $relativePath; $target = Join-Path $RepoRoot $relativePath; Ensure-Path (Split-Path -Parent $target); Copy-Item $source $target -Force }
Write-Step 'Writing Pushover configuration to backend/.env'
$EnvPath = Join-Path $BackendRoot '.env'
Set-Or-AppendEnvValue $EnvPath 'PUSHOVER_USER_KEY' $PushoverUserKey
Set-Or-AppendEnvValue $EnvPath 'PUSHOVER_APP_TOKEN' $PushoverAppToken
Write-Step 'Installing backend dependencies'
$BackendPython = Join-Path $BackendRoot 'venv\Scripts\python.exe'
if(Test-Path $BackendPython){ & $BackendPython -m pip install --disable-pip-version-check -q plyer httpx python-dotenv tastytrade websockets fastapi uvicorn | Out-Null } else { Write-Host 'Backend venv not found; skipping pip install.' -ForegroundColor Yellow }
Write-Step 'Running frontend build verification'
Push-Location $FrontendRoot
try { npm run build; if($LASTEXITCODE -ne 0){ throw "Frontend build failed with exit code $LASTEXITCODE" } } finally { Pop-Location }
Write-Step 'Running backend syntax verification'
if(Test-Path $BackendPython){
  $PythonFiles = Get-ChildItem -Path $BackendRoot -Recurse -Filter *.py | Select-Object -ExpandProperty FullName
  foreach($PyFile in $PythonFiles){
    & $BackendPython -m py_compile $PyFile
    if($LASTEXITCODE -ne 0){ throw "Backend syntax check failed for $PyFile with exit code $LASTEXITCODE" }
  }
}
Write-Step 'Install complete'
Write-Host "Backup saved to: $BackupRoot" -ForegroundColor Green
Write-Host 'Live frontend/backend integration installed. Restart the backend to activate live streamers and alert engine.' -ForegroundColor Green
