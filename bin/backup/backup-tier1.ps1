# ============================================================
#  flayAI Tier1 backup - irreplaceable data (daily)
#    - SQLite flay.db (online backup via VACUUM INTO, safe while API runs)
#    - data/diary_assets, data/state.json
#    - gitignored private overrides (.cert, prompts yaml, .env, favicon)
#  Output : J:\Backup\flayAI\tier1\flayai-tier1-YYYYMMDD.zip (keep 14)
#  NOTE: ASCII only in this file (CP949 parsing safety).
# ============================================================
$ErrorActionPreference = "Stop"

$RepoRoot = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$Root    = Join-Path $RepoRoot "flay-ai"
$Dest    = "J:\Backup\flayAI\tier1"
$Keep    = 14
$Stamp   = Get-Date -Format "yyyyMMdd"
$Staging = Join-Path $env:TEMP ("flayai-tier1-" + $Stamp)
$LogFile = "J:\Backup\flayAI\backup.log"

function Write-Log($msg) {
    $line = (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + " [tier1] " + $msg
    Write-Output $line
    try { Add-Content -Path $LogFile -Value $line -Encoding UTF8 } catch {}
}

New-Item -ItemType Directory -Force -Path $Dest | Out-Null
if (Test-Path $Staging) { Remove-Item -Recurse -Force $Staging }
New-Item -ItemType Directory -Force -Path $Staging | Out-Null

try {
    Write-Log "start"

    # 1) SQLite online backup (consistent even while API is running)
    $Py  = Join-Path $Root ".venv\Scripts\python.exe"
    $Src = Join-Path $Root "data\sqlite\flay.db"
    $Dst = Join-Path $Staging "flay.db"
    & $Py (Join-Path $PSScriptRoot "sqlite_backup.py") $Src $Dst
    if ($LASTEXITCODE -ne 0) { throw "sqlite backup failed (exit $LASTEXITCODE)" }
    Write-Log ("flay.db backed up: " + [math]::Round((Get-Item $Dst).Length / 1MB, 1) + " MB")

    # 2) Diary assets + state
    if (Test-Path (Join-Path $Root "data\diary_assets")) {
        Copy-Item (Join-Path $Root "data\diary_assets") (Join-Path $Staging "diary_assets") -Recurse
    }
    if (Test-Path (Join-Path $Root "data\state.json")) {
        Copy-Item (Join-Path $Root "data\state.json") $Staging
    }

    # 3) Gitignored private overrides (only what exists), relative to repo root
    $Overrides = @(
        ".cert",
        "flay-ai\diary_prompts.yaml",
        "flay-ai\subtitle_prompts.yaml",
        "flay-ai\.env",
        "flay-ai\apps\web\src\app\favicon.ico"
    )
    $OvDir = Join-Path $Staging "overrides"
    New-Item -ItemType Directory -Force -Path $OvDir | Out-Null
    foreach ($rel in $Overrides) {
        $p = Join-Path $RepoRoot $rel
        if (Test-Path $p) {
            $flat = $rel -replace "[\\/]", "__"
            Copy-Item $p (Join-Path $OvDir $flat) -Recurse
        }
    }

    # 4) Zip (overwrite same-day file so reruns are idempotent)
    $Zip = Join-Path $Dest ("flayai-tier1-" + $Stamp + ".zip")
    Compress-Archive -Path (Join-Path $Staging "*") -DestinationPath $Zip -Force
    Write-Log ("zip done: " + $Zip + " (" + [math]::Round((Get-Item $Zip).Length / 1MB, 1) + " MB)")

    # 5) Rotation: keep newest N by filename (name contains date)
    Get-ChildItem $Dest -Filter "flayai-tier1-*.zip" |
        Sort-Object Name -Descending |
        Select-Object -Skip $Keep |
        ForEach-Object { Write-Log ("rotate out: " + $_.Name); Remove-Item $_.FullName -Force }

    Write-Log "done"
    exit 0
}
catch {
    Write-Log ("FAILED: " + $_.Exception.Message)
    exit 1
}
finally {
    if (Test-Path $Staging) { Remove-Item -Recurse -Force $Staging -ErrorAction SilentlyContinue }
}
