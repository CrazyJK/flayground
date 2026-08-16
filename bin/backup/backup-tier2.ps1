# ============================================================
#  flayAI Tier2 backup - Qdrant vector storage (weekly)
#    Primary : full storage snapshot via Qdrant API (safe while running)
#    Fallback: raw directory copy when Qdrant is not running
#  Output : J:\Backup\flayAI\tier2\  (keep 4 generations)
#  NOTE: ASCII only in this file (CP949 parsing safety).
# ============================================================
$ErrorActionPreference = "Stop"

$Root    = Join-Path (Split-Path -Parent (Split-Path -Parent $PSScriptRoot)) "flay-ai"
$Dest    = "J:\Backup\flayAI\tier2"
$Keep    = 4
$Stamp   = Get-Date -Format "yyyyMMdd"
$Qdrant  = "http://127.0.0.1:6333"
$LogFile = "J:\Backup\flayAI\backup.log"

function Write-Log($msg) {
    $line = (Get-Date -Format "yyyy-MM-dd HH:mm:ss") + " [tier2] " + $msg
    Write-Output $line
    try { Add-Content -Path $LogFile -Value $line -Encoding UTF8 } catch {}
}

New-Item -ItemType Directory -Force -Path $Dest | Out-Null

try {
    Write-Log "start"

    $alive = $false
    try {
        Invoke-RestMethod ($Qdrant + "/collections") -TimeoutSec 5 | Out-Null
        $alive = $true
    } catch {}

    if ($alive) {
        # Full storage snapshot: restorable with qdrant --storage-snapshot <file>
        # Qdrant runs in Docker, so the file is fetched via download API
        # (works regardless of volume mounts).
        Write-Log "qdrant alive -> full snapshot via API"
        $r = Invoke-RestMethod -Method Post ($Qdrant + "/snapshots?wait=true") -TimeoutSec 7200
        $name = $r.result.name
        if (-not $name) { throw "snapshot API returned no name" }
        $dstFile = Join-Path $Dest ("flayai-qdrant-" + $Stamp + ".snapshot")
        $prevPP = $ProgressPreference
        $ProgressPreference = "SilentlyContinue"
        try {
            Invoke-WebRequest -Uri ($Qdrant + "/snapshots/" + $name) -OutFile $dstFile -TimeoutSec 7200
        } finally {
            $ProgressPreference = $prevPP
        }
        $gotSize = (Get-Item $dstFile).Length
        if ($r.result.size -and $gotSize -ne $r.result.size) {
            throw ("downloaded size mismatch: got " + $gotSize + ", expected " + $r.result.size)
        }
        Write-Log ("snapshot downloaded: " + $dstFile + " (" + [math]::Round($gotSize / 1GB, 2) + " GB)")
        # Remove server-side snapshot to free C: disk (deletes the file too)
        try {
            Invoke-RestMethod -Method Delete ($Qdrant + "/snapshots/" + $name + "?wait=true") -TimeoutSec 600 | Out-Null
            Write-Log "server-side snapshot deleted"
        } catch {
            Write-Log ("WARN: server-side snapshot delete failed: " + $_.Exception.Message)
        }
    }
    else {
        # Live data lives in the Docker named volume (flayai_qdrant_storage),
        # NOT in ./data/qdrant (stale pre-migration copy). Without the API
        # there is no safe copy path, so fail loudly and retry next schedule.
        throw "qdrant is not running; start it (bin\qdrant.bat start) and rerun"
    }

    # Rotation: newest N kept
    Get-ChildItem $Dest |
        Where-Object { $_.Name -match "^flayai-qdrant-\d{8}\.snapshot$" } |
        Sort-Object Name -Descending |
        Select-Object -Skip $Keep |
        ForEach-Object { Write-Log ("rotate out: " + $_.Name); Remove-Item $_.FullName -Recurse -Force }

    Write-Log "done"
    exit 0
}
catch {
    Write-Log ("FAILED: " + $_.Exception.Message)
    exit 1
}
