$repo = "C:\Users\alexm\granite_tasty_skeleton"
$backend = "$repo\backend"

Write-Host "Installing Phase 1 DB + Streaming..."

# --- DB ---
@'
<REPLACE_WITH_DB_PY>
'@ | Set-Content "$backend\db.py"

# --- SYMBOL LOADER ---
New-Item -ItemType Directory -Force -Path "$backend\services" | Out-Null
@'
<REPLACE_WITH_SYMBOL_LOADER>
'@ | Set-Content "$backend\services\symbol_loader.py"

# --- ACCOUNT STREAMER ---
@'
<REPLACE_WITH_ACCOUNT_STREAMER>
'@ | Set-Content "$backend\streamers\account_streamer.py"

# --- MARKET STREAMER ---
@'
<REPLACE_WITH_MARKET_STREAMER>
'@ | Set-Content "$backend\streamers\market_streamer.py"

# --- STORE ROUTER ---
@'
<REPLACE_WITH_STORE_ROUTER>
'@ | Set-Content "$backend\routers\store.py"

# --- MAIN ---
@'
<REPLACE_WITH_MAIN>
'@ | Set-Content "$backend\main.py"

Write-Host "Phase 1 install complete"