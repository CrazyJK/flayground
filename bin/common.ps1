<#
============================================================
 Flay-Ground - shared helpers for the PRODUCTION control scripts
   Dot-source this file:  . (Join-Path $PSScriptRoot 'common.ps1')
   (dev mode lives in .vscode/launch.json and the Claude in-app procedure,
    not here)

   Provides
     $Components   : ordered table of every process (port, command, log, health url)
     Invoke-Flay   : start | stop | restart | status over a list of component keys
     Start-Component / Stop-Component / Show-Status / Get-ListenPid

   Every start runs the process as a background job of THIS terminal
   (no new window) with stdout+stderr redirected to a log file, then
   waits until the port is LISTENING and prints a colored status line.
   mcp, web (frontend webpack + backend tsup) and ai-web (next build) are
   built first unless -SkipBuild is given; build output -> <log dir>\build.log.

   ASCII only. Windows PowerShell 5.1 (no ??, no ternary, no &&).
============================================================
#>

$script:Root   = Split-Path -Parent $PSScriptRoot        # bin\ -> repo root
$script:FlayAi = Join-Path $Root 'flay-ai'

# ---- component table -----------------------------------------------------
#  Key     : used on the command line / in scripts
#  Label   : shown in the status column
#  Cmd     : command run through  cmd /c  in Dir (relative paths resolve from Dir)
#  Kind    : 'docker' -> qdrant container, controlled by docker compose
#  Build   : steps run (in order, output -> <log dir>\build.log) before starting;
#            skipped with -SkipBuild, which requires Dir\<BuildOut> (default 'dist') to exist.
$script:Components = [ordered]@{
    qdrant = @{ Label = 'qdrant'; Port = 6333;  Kind = 'docker'; Timeout = 60
                Url = 'http://localhost:6333/dashboard' }
    ollama = @{ Label = 'ollama'; Port = 11434; Cmd = 'ollama serve'; Dir = $FlayAi; Timeout = 60
                Log = (Join-Path $FlayAi 'logs\ollama.log') }
    mcp    = @{ Label = 'mcp';    Port = 3002;  Cmd = 'yarn start'; Timeout = 60
                Dir = (Join-Path $Root 'flay-mcp')
                Log = (Join-Path $Root 'flay-mcp\logs\mcp-nexus.log')
                Build = @(
                    @{ Dir = (Join-Path $Root 'flay-mcp'); Cmd = 'yarn install' },
                    @{ Dir = (Join-Path $Root 'flay-mcp'); Cmd = 'yarn run build' })
                Health = 'https://flay.kamoru.jk:3002/health'; Url = 'https://flay.kamoru.jk:3002/health' }
    web    = @{ Label = 'web';    Port = 443;   Cmd = 'yarn start'; Timeout = 90
                Dir = (Join-Path $Root 'flay-web\backend')
                Log = (Join-Path $Root 'flay-web\backend\logs\web-backend.log')
                # frontend (webpack -> frontend\dist, served by the backend) then backend (tsup -> backend\dist)
                Build = @(
                    @{ Dir = (Join-Path $Root 'flay-web\frontend'); Cmd = 'yarn install' },
                    @{ Dir = (Join-Path $Root 'flay-web\frontend'); Cmd = 'node madge.cjs' },
                    @{ Dir = (Join-Path $Root 'flay-web\frontend'); Cmd = 'yarn run build' },
                    @{ Dir = (Join-Path $Root 'flay-web\backend');  Cmd = 'yarn install' },
                    @{ Dir = (Join-Path $Root 'flay-web\backend');  Cmd = 'yarn build:schema' },
                    @{ Dir = (Join-Path $Root 'flay-web\backend');  Cmd = 'yarn build' })
                Health = 'https://flay.kamoru.jk/'; Url = 'https://flay.kamoru.jk' }
    api    = @{ Label = 'api';    Port = 8000;  Timeout = 180
                Cmd = '.venv\Scripts\python.exe -m uvicorn apps.api.main:app --host ai.kamoru.jk --port 8000 --ssl-keyfile ../.cert/kamoru.jk.key --ssl-certfile ../.cert/kamoru.jk.pem'
                Dir = $FlayAi
                Log = (Join-Path $FlayAi 'logs\api.log')
                Health = 'https://ai.kamoru.jk:8000/healthz'; Url = 'https://ai.kamoru.jk:8000/docs' }
    aiweb  = @{ Label = 'ai-web'; Port = 3000;  Cmd = 'node server.js'; Timeout = 90
                Dir = (Join-Path $FlayAi 'apps\web')
                Log = (Join-Path $FlayAi 'logs\web.log')
                # next build -> .next, served by the custom HTTPS server apps/web/server.js
                Build = @(
                    @{ Dir = (Join-Path $FlayAi 'apps\web'); Cmd = 'yarn install' },
                    @{ Dir = (Join-Path $FlayAi 'apps\web'); Cmd = 'yarn build' })
                BuildOut = '.next'
                Health = 'https://ai.kamoru.jk:3000/'; Url = 'https://ai.kamoru.jk:3000' }
}

# ---- primitives ----------------------------------------------------------

function Get-ListenPid {
    <# PID that LISTENs on $Port, or $null #>
    param([int]$Port)
    $c = Get-NetTCPConnection -State Listen -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($c) { return [int]$c.OwningProcess }
    return $null
}

function Write-Line {
    <# one status line:  "  name     :port   [TAG]  detail"  (overwrites the current line) #>
    param([string]$Name, [int]$Port, [string]$Tag, [string]$Color, [string]$Detail, [switch]$NoNewline)
    Write-Host -NoNewline ("`r  {0,-8} :{1,-6} " -f $Name, $Port)
    Write-Host -NoNewline "[$Tag]" -ForegroundColor $Color
    $text = "  " + $Detail.PadRight(60)
    if ($NoNewline) { Write-Host -NoNewline $text } else { Write-Host $text }
}

function Test-Health {
    <# HTTP status code of $Url via curl.exe (self-signed ok), '' when unreachable #>
    param([string]$Url)
    if (-not $Url) { return '' }
    $code = & curl.exe -sk -o NUL -w '%{http_code}' --max-time 5 $Url 2>$null
    if ($code -eq '000') { return '' }
    return "$code"
}

function Start-Background {
    <#
      run $Cmd through cmd /c in $Dir with stdout+stderr -> $Log, no new window.
      -Wait : block until it exits (log is appended) and return the exit code.
    #>
    param([string]$Cmd, [string]$Dir, [string]$Log, [switch]$Wait)
    $logDir = Split-Path -Parent $Log
    if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
    if ($Wait) {
        $inner = '"{0} >> "{1}" 2>&1"' -f $Cmd, $Log
        $p = Start-Process -FilePath $env:ComSpec -ArgumentList '/c', $inner -WorkingDirectory $Dir -NoNewWindow -Wait -PassThru
        return $p.ExitCode
    }
    $inner = '"{0} > "{1}" 2>&1"' -f $Cmd, $Log
    Start-Process -FilePath $env:ComSpec -ArgumentList '/c', $inner -WorkingDirectory $Dir -NoNewWindow | Out-Null
}

# ---- component operations -----------------------------------------------

function Start-Component {
    <#
      start one component (skips when the port is already LISTENING); returns $true on success.
      Components with Build steps are built first (-SkipBuild to start from the existing build output).
    #>
    param([string]$Key, [switch]$SkipBuild)
    $c = $Components[$Key]; $name = $c.Label; $port = $c.Port
    $owner = Get-ListenPid $port
    if ($owner) { Write-Line $name $port 'SKIP' Yellow "already up (pid $owner)"; return $true }

    # build (web: frontend webpack + backend tsup, mcp: tsc, ai-web: next build) -> <log dir>\build.log
    $built = ''
    if ($c.Build) {
        if ($SkipBuild) {
            $out = 'dist'; if ($c.BuildOut) { $out = $c.BuildOut }
            if (-not (Test-Path (Join-Path $c.Dir $out))) {
                Write-Line $name $port 'FAIL' Red "$out not found - start without -SkipBuild"; return $false
            }
        } else {
            $buildLog = Join-Path (Split-Path -Parent $c.Log) 'build.log'
            if (Test-Path $buildLog) { Remove-Item $buildLog }
            $bsw = [Diagnostics.Stopwatch]::StartNew()
            $i = 0
            foreach ($step in $c.Build) {
                $i++
                Write-Line $name $port '....' Cyan ("build {0}/{1}: {2}  ({3})  {4}s" -f $i, $c.Build.Count, $step.Cmd, (Split-Path -Leaf $step.Dir), [int]$bsw.Elapsed.TotalSeconds) -NoNewline
                $rc = Start-Background -Cmd $step.Cmd -Dir $step.Dir -Log $buildLog -Wait
                if ($rc -ne 0) {
                    Write-Line $name $port 'FAIL' Red ("build failed: '{0}' in {1} (exit {2}) - see {3}" -f $step.Cmd, (Split-Path -Leaf $step.Dir), $rc, $buildLog)
                    return $false
                }
            }
            $built = "built {0:N0}s, " -f $bsw.Elapsed.TotalSeconds
        }
    }

    if ($c.Kind -eq 'docker') {
        Write-Line $name $port '....' Cyan 'docker compose up -d qdrant' -NoNewline
        Push-Location $FlayAi
        $out = docker compose up -d qdrant 2>&1
        $rc = $LASTEXITCODE
        Pop-Location
        if ($rc -ne 0) { Write-Line $name $port 'FAIL' Red "docker compose failed - is Docker Desktop running?"; return $false }
    } else {
        if ($Key -eq 'ollama' -and -not (Get-Command ollama -ErrorAction SilentlyContinue)) {
            Write-Line $name $port 'FAIL' Red 'ollama not found in PATH (https://ollama.com)'; return $false
        }
        Start-Background -Cmd $c.Cmd -Dir $c.Dir -Log $c.Log
    }

    # wait for the port
    $sw = [Diagnostics.Stopwatch]::StartNew()
    while ($sw.Elapsed.TotalSeconds -lt $c.Timeout) {
        $owner = Get-ListenPid $port
        if ($owner) { break }
        Write-Line $name $port '....' Cyan ("waiting {0}s" -f [int]$sw.Elapsed.TotalSeconds) -NoNewline
        Start-Sleep -Milliseconds 500
    }
    if (-not $owner) {
        Write-Line $name $port 'FAIL' Red ("not listening after {0}s - see {1}" -f $c.Timeout, $c.Log)
        return $false
    }
    $detail = "{0}up in {1,5:N1}s   pid {2,-6}" -f $built, $sw.Elapsed.TotalSeconds, $owner
    if ($c.Health) { $code = Test-Health $c.Health; if ($code) { $detail += " health $code" } }
    Write-Line $name $port ' OK ' Green $detail
    return $true
}

function Stop-Component {
    <# stop one component: kill the LISTENING pid tree (qdrant: docker compose stop) #>
    param([string]$Key)
    $c = $Components[$Key]; $name = $c.Label; $port = $c.Port
    $owner = Get-ListenPid $port
    if (-not $owner) { Write-Line $name $port ' -- ' DarkGray 'not running'; return }

    if ($c.Kind -eq 'docker') {
        Write-Line $name $port '....' Cyan 'docker compose stop qdrant' -NoNewline
        Push-Location $FlayAi
        docker compose stop qdrant 2>&1 | Out-Null
        Pop-Location
    } else {
        Write-Line $name $port '....' Cyan "taskkill /F /T /PID $owner" -NoNewline
        if (Get-Process -Id $owner -ErrorAction SilentlyContinue) {
            taskkill /F /T /PID $owner 2>&1 | Out-Null
        } else {
            # owner already gone: a child inherited the socket -> kill by parent pid
            Get-CimInstance Win32_Process -Filter "ParentProcessId=$owner" | ForEach-Object {
                taskkill /F /T /PID $_.ProcessId 2>&1 | Out-Null
            }
        }
    }
    $sw = [Diagnostics.Stopwatch]::StartNew()
    while ((Get-ListenPid $port) -and $sw.Elapsed.TotalSeconds -lt 15) { Start-Sleep -Milliseconds 300 }
    if (Get-ListenPid $port) {
        Write-Line $name $port 'FAIL' Red "port still open (pid $(Get-ListenPid $port))"
    } else {
        Write-Line $name $port 'STOP' Magenta "stopped (was pid $owner)"
    }
}

function Show-Status {
    <# one line per component: UP (pid, health) / DOWN #>
    param([string[]]$Keys)
    foreach ($k in $Keys) {
        $c = $Components[$k]
        $owner = Get-ListenPid $c.Port
        if ($owner) {
            $detail = "pid {0,-6}" -f $owner
            if ($c.Health) { $code = Test-Health $c.Health; if ($code) { $detail += " health $code" } }
            if ($c.Kind -eq 'docker') {
                $st = docker ps --filter 'name=flayai-qdrant' --format '{{.Status}}' 2>$null
                if ($st) { $detail += " docker: $st" }
            }
            Write-Line $c.Label $c.Port ' UP ' Green $detail
        } else {
            Write-Line $c.Label $c.Port 'DOWN' Red ''
        }
    }
}

function Show-Summary {
    <# URLs and log files of the started components #>
    param([string[]]$Keys)
    Write-Host ''
    foreach ($k in $Keys) {
        $c = $Components[$k]
        if (-not $c.Url) { continue }
        $log = ''
        if ($c.Log) { $log = $c.Log.Replace($Root + '\', '') }
        Write-Host ("  {0,-8} {1,-40} {2}" -f $c.Label, $c.Url, $log)
    }
}

# ---- entry point used by every script -----------------------------------

function Invoke-Flay {
    <#
      Run $Action over $Keys (start order = list order, stop order = reversed).
      -SkipBuild : start mcp/web/ai-web from the existing build output without rebuilding.
    #>
    param([string]$Action, [string[]]$Keys, [string]$Title, [switch]$SkipBuild)
    $sw = [Diagnostics.Stopwatch]::StartNew()
    switch -Regex ($Action) {
        '^start$' {
            Write-Host "=== $Title start ===" -ForegroundColor White
            $ok = $true
            foreach ($k in $Keys) {
                if (-not (Start-Component -Key $k -SkipBuild:$SkipBuild)) { $ok = $false }
            }
            Show-Summary -Keys $Keys
            $color = 'Green'; if (-not $ok) { $color = 'Red' }
            Write-Host ("=== done ({0:N1}s) - processes run in the background of this terminal ===" -f $sw.Elapsed.TotalSeconds) -ForegroundColor $color
            if (-not $ok) { exit 1 }
        }
        '^stop$' {
            Write-Host "=== $Title stop ===" -ForegroundColor White
            $rev = @($Keys); [array]::Reverse($rev)
            foreach ($k in $rev) { Stop-Component -Key $k }
            Write-Host ("=== done ({0:N1}s) ===" -f $sw.Elapsed.TotalSeconds) -ForegroundColor White
        }
        '^restart$' {
            Invoke-Flay -Action stop -Keys $Keys -Title $Title
            Start-Sleep -Seconds 3
            Invoke-Flay -Action start -Keys $Keys -Title $Title -SkipBuild:$SkipBuild
        }
        '^status$' {
            Write-Host "=== $Title status ===" -ForegroundColor White
            Show-Status -Keys $Keys
        }
        default {
            $entry = (Get-PSCallStack | Where-Object { $_.ScriptName } | Select-Object -Last 1).ScriptName
            Write-Host ("Usage: {0} <start|stop|restart|status> [-SkipBuild]" -f (Split-Path -Leaf $entry)) -ForegroundColor Yellow
            exit 1
        }
    }
}
