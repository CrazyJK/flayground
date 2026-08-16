<#
============================================================
 flayAI - apply source changes (reindex)
   Call when JSON/posters/videos under K:\Crazy\* change.
   Each stage is incremental (already-processed rows auto-skip).
   Runs  flay-ai\.venv\Scripts\python.exe -m packages.indexer.cli <stage>
   in the foreground, one stage after another; stops at the first failure.

 Usage:  bin\ai\reindex.ps1 <quick|sync|full|clean> [apply]

   quick : metadata only (light/fast, no AI)
           load    : K:\Crazy\Info\*.json -> SQLite videos
           scan    : poster scan + kind reclassify (instance/archive)
           history : history.csv -> SQLite usage_log
           fts     : rebuild videos_fts
           sync-payload : push kind/playable changes to Qdrant collections
   sync  : quick + text AI (daily sync)
           translate : JP/EN title/desc -> KO
           embed     : bge-m3 -> Qdrant videos (1024d)
   full  : sync + all visual/face/OCR AI (nightly/weekend)
           embed-clip / extract-faces / cluster-faces / ocr-posters
   clean : orphan cleanup (poster file gone / video gone from JSON / Qdrant-only opus)
           reindex.ps1 clean        -> dry-run (counts only)
           reindex.ps1 clean apply  -> actual delete
============================================================
#>
param([Parameter(Position = 0)][string]$Mode, [Parameter(Position = 1)][string]$Arg2)

. (Join-Path $PSScriptRoot '..\common.ps1')

$stagesByMode = @{
    quick = @('load', 'scan', 'history', 'fts', 'sync-payload')
    sync  = @('load', 'scan', 'history', 'translate', 'embed', 'fts', 'sync-payload')
    full  = @('load', 'scan', 'history', 'translate', 'embed', 'embed-clip', 'extract-faces', 'cluster-faces', 'ocr-posters', 'fts', 'sync-payload')
    clean = @('cleanup')
}
if (-not $Mode -or -not $stagesByMode.ContainsKey($Mode.ToLower())) {
    Write-Host 'Usage: reindex.ps1 <quick|sync|full|clean> [apply]' -ForegroundColor Yellow
    Write-Host ''
    Write-Host '  quick  : load + scan + history + fts                       + sync-payload'
    Write-Host '  sync   : quick + translate + embed                         + sync-payload'
    Write-Host '  full   : sync + embed-clip + extract-faces + cluster-faces + ocr-posters + sync-payload'
    Write-Host '  clean  : orphan dry-run.  actual delete: reindex.ps1 clean apply'
    exit 1
}
$Mode = $Mode.ToLower()
$stages = $stagesByMode[$Mode]
$python = Join-Path $FlayAi '.venv\Scripts\python.exe'
$sw = [Diagnostics.Stopwatch]::StartNew()

Write-Host ("=== reindex {0} : start {1:HH:mm:ss} ===" -f $Mode, (Get-Date)) -ForegroundColor White
Push-Location $FlayAi
try {
    $i = 0
    foreach ($stage in $stages) {
        $i++
        $extra = @()
        $label = $stage
        if ($stage -eq 'cleanup') {
            if ($Arg2 -eq 'apply') { $extra = @('--apply'); $label = 'cleanup --apply (actual delete)' }
            else { $label = 'cleanup (dry-run; actual delete: reindex.ps1 clean apply)' }
        }
        Write-Host ''
        Write-Host ("--- [{0}/{1}] {2}" -f $i, $stages.Count, $label) -ForegroundColor Cyan
        $t = [Diagnostics.Stopwatch]::StartNew()
        & $python -m packages.indexer.cli $stage @extra
        if ($LASTEXITCODE -ne 0) {
            Write-Host ("*** FAILED at {0} (exit {1}) after {2:N0}s" -f $stage, $LASTEXITCODE, $t.Elapsed.TotalSeconds) -ForegroundColor Red
            exit 1
        }
        Write-Host ("    {0} done in {1:N0}s" -f $stage, $t.Elapsed.TotalSeconds) -ForegroundColor Green
    }
} finally { Pop-Location }

Write-Host ''
Write-Host ("=== reindex {0} : done in {1:N0}s (end {2:HH:mm:ss}) ===" -f $Mode, $sw.Elapsed.TotalSeconds, (Get-Date)) -ForegroundColor Green
