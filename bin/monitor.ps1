<#
============================================================
 Flay-Ground Monitor - Docker-Desktop-like window over the PRODUCTION scripts
   backend : this script = local HTTP server (http://localhost:7777, loopback only)
             /             bin\monitor\index.html (dark UI: cards, table, logs view)
             /api/status   JSON: system cpu/ram/gpu/disks + one row per component
                           (state, pid, health code, cpu % and ram of the process
                           tree, uptime) - gathered every 3s in a worker runspace
             /api/action   ?key=<component|all>&action=start|stop|restart&skip=0|1
                           -> runs the matching bin\*.ps1 in a HIDDEN console; its
                           output goes to bin\monitor\logs\<id>.log and /api/status
                           lists the task (elapsed, last line, exit code)
             /api/log      ?key=<component>  -> last 300 lines of its log file
                           ?task=<id>        -> a control task's output
   window  : Edge (or Chrome) --app window without browser chrome; closing it
             leaves the monitor in the tray. Tray menu: Open / Exit.

   Processes started from here get their own hidden console (FLAY_DETACH=1 ->
   Start-Background uses -WindowStyle Hidden), so they survive when the
   launcher window or this monitor closes. Stop kills the LISTENING pid tree.

   On launch every component is started from the existing build output
   (flay.ps1 start -SkipBuild, shown as a task in the UI; components already
   up are skipped) unless -NoAutoStart is given.

   Usage:  powershell -NoProfile -WindowStyle Hidden -File bin\monitor.ps1 [-NoAutoStart]
   ASCII only. Windows PowerShell 5.1 (no ??, no ternary, no &&).
============================================================
#>
param([switch]$NoAutoStart)

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing
. (Join-Path $PSScriptRoot 'common.ps1')

$script:Port    = 7777
$script:Url     = "http://localhost:$Port/"
$script:Keys    = @('mcp', 'web', 'qdrant', 'ollama', 'api', 'aiweb')
$script:Scripts = @{ mcp = 'web\mcp.ps1'; web = 'web\web.ps1'; qdrant = 'ai\qdrant.ps1'
                     ollama = 'ai\ollama.ps1'; api = 'ai\api.ps1'; aiweb = 'ai\web.ps1'; all = 'flay.ps1' }
$env:FLAY_DETACH = '1'             # inherited by the control scripts started from the http runspace

# shared state between the runspaces
#  Sys   : @{ cpu; cores; ramUsed; ramTotal (GB); gpu = $null | @{ util; used; total (GB) }; disks = @(@{ name; free; total (GB) }) }
#  Snap  : key -> @{ Pid; Health; Cpu (percent); Ram (bytes); Up (seconds) }
#  Seq   : incremented after every worker pass; Error : last worker exception text
$script:Shared = [hashtable]::Synchronized(@{ Stop = $false; Seq = 0; Sys = $null; Snap = $null; Error = ''; Listener = $null })

function New-Worker {
    <# run $Script in its own runspace with the shared variables set; returns @{ Ps; Handle } #>
    param([scriptblock]$Script)
    $rs = [runspacefactory]::CreateRunspace()
    $rs.Open()
    foreach ($v in 'Shared', 'Keys', 'Scripts', 'Port') { $rs.SessionStateProxy.SetVariable($v, (Get-Variable $v -ValueOnly)) }
    $rs.SessionStateProxy.SetVariable('BinDir', $PSScriptRoot)
    $ps = [powershell]::Create()
    $ps.Runspace = $rs
    [void]$ps.AddScript($Script)
    return @{ Ps = $ps; Handle = $ps.BeginInvoke(); Runspace = $rs }
}

# ---- worker 1: data gathering every 3s ----------------------------------

$collector = New-Worker {
    . (Join-Path $BinDir 'common.ps1')
    $cores  = [int]$env:NUMBER_OF_PROCESSORS
    $hasGpu = [bool](Get-Command nvidia-smi.exe -ErrorAction SilentlyContinue)
    $cpuCounter = New-Object Diagnostics.PerformanceCounter('Processor', '% Processor Time', '_Total')
    [void]$cpuCounter.NextValue()                      # first sample is always 0
    $prevCpu = @{}                                     # pid -> total processor ms at the previous pass
    $prevAt  = Get-Date

    while (-not $Shared.Stop) {
        try {
            # -- system
            $os = Get-CimInstance Win32_OperatingSystem -Property TotalVisibleMemorySize, FreePhysicalMemory
            $sys = @{ cpu = [int]$cpuCounter.NextValue(); cores = $cores
                      ramUsed = ($os.TotalVisibleMemorySize - $os.FreePhysicalMemory) / 1MB; ramTotal = $os.TotalVisibleMemorySize / 1MB
                      gpu = $null; disks = @() }
            if ($hasGpu) {
                $g = (& nvidia-smi.exe --query-gpu=utilization.gpu,memory.used,memory.total --format=csv,noheader,nounits 2>$null) -split ','
                if ($g.Count -ge 3) { $sys.gpu = @{ util = [int]$g[0]; used = [int]$g[1] / 1024; total = [int]$g[2] / 1024 } }
            }
            $sys.disks = @([IO.DriveInfo]::GetDrives() | Where-Object { $_.DriveType -eq 'Fixed' -and $_.IsReady } |
                ForEach-Object { @{ name = $_.Name.TrimEnd('\'); free = $_.AvailableFreeSpace / 1GB; total = $_.TotalSize / 1GB } })
            $Shared.Sys = $sys

            # -- one pass over ports, processes and the parent/child map
            $now = Get-Date
            $elapsed = ($now - $prevAt).TotalMilliseconds
            $prevAt = $now
            $listen = @{}                                  # port -> owning pid
            foreach ($t in Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue) { if (-not $listen.ContainsKey([int]$t.LocalPort)) { $listen[[int]$t.LocalPort] = [int]$t.OwningProcess } }
            $procs = @{}
            foreach ($p in Get-Process) { $procs[[int]$p.Id] = $p }
            $kids = @{}                                    # parent pid -> child pids
            foreach ($w in Get-CimInstance Win32_Process -Property ProcessId, ParentProcessId) {
                $pp = [int]$w.ParentProcessId
                if (-not $kids.ContainsKey($pp)) { $kids[$pp] = New-Object Collections.ArrayList }
                [void]$kids[$pp].Add([int]$w.ProcessId)
            }

            # -- per component
            $cur = @{}
            $snap = @{}
            foreach ($k in $Keys) {
                $c = $Components[$k]
                $owner = $listen[[int]$c.Port]
                $row = @{ Pid = $owner; Health = ''; Cpu = $null; Ram = $null; Up = $null }
                if ($owner) {
                    if ($c.Health) { $row.Health = Test-Health $c.Health }
                    if ($c.Kind -ne 'docker') {            # docker owner is the Docker backend - not measured
                        # process tree: owner + descendants (ollama -> runner, next.js workers)
                        $tree = New-Object Collections.ArrayList
                        [void]$tree.Add($owner)
                        $i = 0
                        while ($i -lt $tree.Count) { if ($kids.ContainsKey($tree[$i])) { $tree.AddRange($kids[$tree[$i]]) }; $i++ }
                        $ram = 0; $ms = 0
                        foreach ($id in $tree) {
                            $p = $procs[$id]
                            if (-not $p) { continue }
                            $ram += $p.WorkingSet64
                            try { $t = $p.TotalProcessorTime.TotalMilliseconds } catch { continue }
                            $cur[$id] = $t
                            if ($prevCpu.ContainsKey($id)) { $ms += $t - $prevCpu[$id] }
                        }
                        $row.Ram = $ram
                        if ($elapsed -gt 0) { $row.Cpu = [Math]::Round($ms / $elapsed / $cores * 100, 1) }
                        try { $row.Up = [int]($now - $procs[$owner].StartTime).TotalSeconds } catch { }
                    }
                }
                $snap[$k] = $row
            }
            $prevCpu = $cur
            $Shared.Snap = $snap
            $Shared.Error = ''
        } catch {
            $Shared.Error = $_.Exception.Message
        }
        $Shared.Seq++
        [GC]::Collect()                                    # drop the CIM/process objects of this pass right away
        Start-Sleep -Seconds 3
    }
}

# ---- worker 2: http server ------------------------------------------------

$server = New-Worker {
    . (Join-Path $BinDir 'common.ps1')
    $html = Join-Path $BinDir 'monitor\index.html'

    function Send-Bytes {
        param($Res, [byte[]]$Bytes, [string]$Type, [int]$Code = 200)
        $Res.StatusCode = $Code; $Res.ContentType = $Type; $Res.ContentLength64 = $Bytes.Length
        $Res.OutputStream.Write($Bytes, 0, $Bytes.Length); $Res.Close()
    }
    function Send-Text { param($Res, [string]$Text, [string]$Type = 'text/plain; charset=utf-8', [int]$Code = 200)
        Send-Bytes $Res ([Text.Encoding]::UTF8.GetBytes($Text)) $Type $Code }

    # control tasks: bin\<script> <action> runs hidden, console output -> bin\monitor\logs\<id>.log
    $logDir = Join-Path $BinDir 'monitor\logs'
    if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
    Get-ChildItem $logDir -Filter '*.log' | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-7) } | Remove-Item -ErrorAction SilentlyContinue
    $tasks = New-Object Collections.ArrayList          # newest first: @{ id; key; action; started; ended; log; proc }

    function Start-Task {
        <# start bin\<script> <action> [-SkipBuild] in a hidden console with stdout+stderr -> log; remembers it in $tasks #>
        param([string]$Key, [string]$Action, [bool]$SkipBuild)
        $id = '{0}-{1}-{2}' -f (Get-Date -Format 'yyyyMMdd-HHmmss'), $Key, $Action
        $log = Join-Path $logDir "$id.log"
        $line = 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "{0}" {1}' -f (Join-Path $BinDir $Scripts[$Key]), $Action
        if ($SkipBuild) { $line += ' -SkipBuild' }
        $p = Start-Process -FilePath $env:ComSpec -ArgumentList '/c', ('{0} > "{1}" 2>&1' -f $line, $log) `
            -WorkingDirectory $Root -WindowStyle Hidden -PassThru
        $tasks.Insert(0, @{ id = $id; key = $Key; action = $Action; started = Get-Date; ended = $null; log = $log; proc = $p })
        if ($tasks.Count -gt 20) { $tasks.RemoveRange(20, $tasks.Count - 20) }
    }

    function Read-TaskLog {
        <# log text with the in-place updates collapsed: every line keeps only what follows its last CR; -Last -> last non-empty line #>
        param([string]$Path, [switch]$Last)
        if (-not (Test-Path $Path)) { return '' }
        $fs = [IO.File]::Open($Path, 'Open', 'Read', 'ReadWrite')
        try { $raw = (New-Object IO.StreamReader($fs, [Text.Encoding]::Default)).ReadToEnd() } finally { $fs.Close() }
        $lines = foreach ($l in $raw -split "`n") { $seg = $l -split "`r"; $seg[$seg.Count - 1].TrimEnd() }
        if ($Last) { $nonEmpty = @($lines | Where-Object { $_.Trim() }); if ($nonEmpty.Count) { return $nonEmpty[$nonEmpty.Count - 1].Trim() }; return '' }
        return $lines -join "`n"
    }

    function Read-LogTail {
        <# last $Lines lines of a log being written by another process: strict UTF-8 first (node logs), CP949 (Default) when that fails #>
        param([string]$Path, [int]$Lines = 300)
        $fs = [IO.File]::Open($Path, 'Open', 'Read', 'ReadWrite')
        try {
            $take = [Math]::Min($fs.Length, 512KB)
            $fs.Seek(-$take, 'End') | Out-Null
            $bytes = New-Object byte[] $take
            $n = $fs.Read($bytes, 0, $take)
        } finally { $fs.Close() }
        $start = 0
        if ($take -lt $fs.Length) { while ($start -lt $n -and ($bytes[$start] -band 0xC0) -eq 0x80) { $start++ } }   # skip a cut UTF-8 sequence
        try { $text = (New-Object Text.UTF8Encoding($false, $true)).GetString($bytes, $start, $n - $start) }
        catch { $text = [Text.Encoding]::Default.GetString($bytes, $start, $n - $start) }
        $all = $text.TrimEnd("`r", "`n") -split "`r?`n"
        if ($all.Count -gt $Lines) { $all = $all[($all.Count - $Lines)..($all.Count - 1)] }
        return $all -join "`n"
    }

    function Get-TaskList {
        <# task summaries for /api/status (newest first) #>
        foreach ($t in $tasks) {
            $p = $t.proc
            if (-not $t.ended -and $p.HasExited) { $t.ended = $p.ExitTime }
            $end = $t.ended; if (-not $end) { $end = Get-Date }
            $exit = $null; if ($t.ended) { $exit = $p.ExitCode }
            @{ id = $t.id; key = $t.key; action = $t.action; started = $t.started.ToString('HH:mm:ss')
               elapsed = [int]($end - $t.started).TotalSeconds; done = [bool]$t.ended; exit = $exit; last = (Read-TaskLog $t.log -Last) }
        }
    }

    $listener = New-Object Net.HttpListener
    $listener.Prefixes.Add("http://localhost:$Port/")
    $listener.Start()
    $Shared.Listener = $listener                       # main thread stops it on exit -> GetContext throws -> loop ends
    while (-not $Shared.Stop) {
        try { $ctx = $listener.GetContext() } catch { break }
        $req = $ctx.Request; $res = $ctx.Response
        try {
            $q = $req.QueryString
            switch ($req.Url.AbsolutePath) {
                '/' { Send-Bytes $res ([IO.File]::ReadAllBytes($html)) 'text/html; charset=utf-8' }
                '/favicon.ico' { Send-Bytes $res ([IO.File]::ReadAllBytes((Join-Path $BinDir 'flay.ico'))) 'image/x-icon' }
                '/api/status' {
                    $snap = $Shared.Snap
                    $rows = foreach ($k in $Keys) {
                        $c = $Components[$k]
                        $r = @{}; if ($snap) { $r = $snap[$k] }
                        # ollama: the tray app owns the process, its log file only holds old failed 'ollama serve' attempts -> no log tab
                        @{ key = $k; label = $c.Label; port = $c.Port; url = $c.Url; hasLog = ([bool]$c.Log -and $k -ne 'ollama'); kind = "$($c.Kind)"
                           pid = $r.Pid; health = $r.Health; cpu = $r.Cpu; ram = $r.Ram; up = $r.Up }
                    }
                    $body = @{ seq = $Shared.Seq; error = $Shared.Error; sys = $Shared.Sys; rows = @($rows); tasks = @(Get-TaskList) } | ConvertTo-Json -Depth 5 -Compress
                    Send-Text $res $body 'application/json; charset=utf-8'
                }
                '/api/action' {
                    $key = "$($q['key'])"; $action = "$($q['action'])"
                    if (-not $Scripts.ContainsKey($key) -or $action -notmatch '^(start|stop|restart)$') { Send-Text $res 'bad request' 'text/plain' 400; break }
                    # -SkipBuild exists only on flay.ps1 and the scripts of components with Build steps
                    $canSkip = ($key -eq 'all') -or [bool]$Components[$key].Build
                    Start-Task $key $action ($canSkip -and $q['skip'] -eq '1')
                    Send-Text $res '{"ok":true}' 'application/json'
                }
                '/api/log' {
                    if ($q['task']) {                      # control task output (collapsed)
                        $t = $tasks | Where-Object { $_.id -eq "$($q['task'])" } | Select-Object -First 1
                        if (-not $t) { Send-Text $res 'no task' 'text/plain' 404; break }
                        Send-Text $res (Read-TaskLog $t.log); break
                    }
                    $c = $Components["$($q['key'])"]
                    if (-not $c -or -not $c.Log) { Send-Text $res 'no log' 'text/plain' 404; break }
                    $text = ''
                    if (Test-Path $c.Log) { $text = Read-LogTail $c.Log }
                    Send-Text $res $text
                }
                default { Send-Text $res 'not found' 'text/plain' 404 }
            }
        } catch {
            try { Send-Text $res $_.Exception.Message 'text/plain' 500 } catch { }
        }
    }
}

# ---- window (browser app mode) + tray ----------------------------------

function Open-Window {
    <# open the UI as an Edge/Chrome --app window (no browser chrome); default browser as a fallback #>
    foreach ($exe in 'msedge.exe', 'chrome.exe') {
        $p = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows\CurrentVersion\App Paths\$exe" -ErrorAction SilentlyContinue).'(default)'
        if ($p -and (Test-Path $p)) { Start-Process -FilePath $p -ArgumentList "--app=$Url", '--window-size=1000,680'; return }
    }
    Start-Process $Url
}

# wait for the listener (up to 5s), then open the window
$sw = [Diagnostics.Stopwatch]::StartNew()
while (-not $Shared.Listener -and $sw.Elapsed.TotalSeconds -lt 5 -and -not $server.Handle.IsCompleted) { Start-Sleep -Milliseconds 100 }
if ($server.Handle.IsCompleted) {                      # listener failed (port in use?) -> show the error and quit
    try { $server.Ps.EndInvoke($server.Handle) } catch { [Windows.Forms.MessageBox]::Show($_.Exception.Message, 'Flay-Ground Monitor') }
    $Shared.Stop = $true; $collector.Ps.Stop(); exit 1
}
if (-not $NoAutoStart) {                               # bring everything up from the existing build output; shows as a task in the UI
    try { Invoke-RestMethod "${Url}api/action?key=all&action=start&skip=1" -Method Post | Out-Null } catch { }
}
Open-Window

$icon = New-Object Drawing.Icon (Join-Path $PSScriptRoot 'flay.ico')
$tray = New-Object Windows.Forms.NotifyIcon
$tray.Icon = $icon; $tray.Text = "Flay-Ground Monitor - $Url"; $tray.Visible = $true
$menu = New-Object Windows.Forms.ContextMenu
[void]$menu.MenuItems.Add('Open', { Open-Window })
[void]$menu.MenuItems.Add('Exit', { [Windows.Forms.Application]::Exit() })
$tray.ContextMenu = $menu
$tray.Add_DoubleClick({ Open-Window })

[void][Windows.Forms.Application]::Run((New-Object Windows.Forms.ApplicationContext))

# ---- shutdown -----------------------------------------------------------
$tray.Visible = $false; $tray.Dispose()
$Shared.Stop = $true
if ($Shared.Listener) { $Shared.Listener.Stop(); $Shared.Listener.Close() }
foreach ($w in $collector, $server) { $w.Ps.Stop(); $w.Ps.Dispose(); $w.Runspace.Close() }
