<#
.SYNOPSIS
  Flay 주간 백업 스크립트 — 인스턴스/아카이브 2개 zip 파일 생성

.DESCRIPTION
  flay-web/backend 설정(default.json)에서 백업 대상 경로를 읽어
  Windows 내장 tar(bsdtar)로 압축한 뒤 iCloud 공유 폴더에 저장한다.

  - flay-instance.zip : Info 폴더 + Storage/Stage/Cover의 이미지·자막 파일 (동영상 제외)
  - flay-archive.zip  : Archive 폴더 전체

  zip은 임시 폴더에 먼저 생성한 뒤 목적지로 이동한다.
  (iCloud가 작성 중인 미완성 파일을 동기화하는 것을 방지)

.PARAMETER ConfigPath
  flay-web/backend 설정 파일 경로 (기본: 저장소의 default.json)

.PARAMETER DestDir
  백업 목적지 폴더 (기본: iCloud 공유 폴더)

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File flay-backup.ps1
#>
param(
  [string]$ConfigPath = (Join-Path $PSScriptRoot '..\..\flay-web\backend\config\default.json'),
  [string]$DestDir = 'C:\Users\namjk\iCloudDrive\Flay'
)

$ErrorActionPreference = 'Stop'

# ── 로그 설정: 스크립트 폴더 하위 logs/, 60일 지난 로그는 삭제 ──
$logDir = Join-Path $PSScriptRoot 'logs'
if (-not (Test-Path $logDir)) { New-Item -ItemType Directory -Path $logDir | Out-Null }
$script:LogFile = Join-Path $logDir ('backup-{0}.log' -f (Get-Date -Format 'yyyyMMdd-HHmmss'))
Get-ChildItem $logDir -Filter 'backup-*.log' | Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-60) } | Remove-Item -Force

<#
  타임스탬프를 붙여 콘솔과 로그 파일에 동시에 기록한다.
  @param $msg [string] 기록할 메시지
#>
function Write-Log([string]$msg) {
  $line = '{0} {1}' -f (Get-Date -Format 'yyyy-MM-dd HH:mm:ss'), $msg
  Write-Host $line
  Add-Content -Path $script:LogFile -Value $line -Encoding UTF8
}

<#
  tar.exe를 실행하고 출력과 종료 코드를 로그에 남긴다. 실패 시 예외를 던진다.
  @param $tarArgs [string[]] tar 인자 배열
#>
function Invoke-Tar([string[]]$tarArgs) {
  Write-Log "tar $($tarArgs -join ' ')"
  # 네이티브 stderr가 ErrorRecord로 승격되어 중단되지 않도록 EAP를 일시 완화
  $prevEAP = $ErrorActionPreference
  $ErrorActionPreference = 'Continue'
  $output = & tar.exe @tarArgs 2>&1 | ForEach-Object { $_.ToString() }
  $ErrorActionPreference = $prevEAP
  foreach ($line in $output) { Write-Log "  tar: $line" }
  if ($LASTEXITCODE -ne 0) { throw "tar 종료 코드 $LASTEXITCODE" }
}

<#
  바이트 크기를 KB/MB/GB 문자열로 변환한다.
  @param $size [long] 바이트 크기
  @return [string] 사람이 읽기 좋은 크기 문자열
#>
function Format-Size([long]$size) {
  if ($size -gt 1GB) { return '{0:N1} GB' -f ($size / 1GB) }
  if ($size -gt 1MB) { return '{0:N1} MB' -f ($size / 1MB) }
  return '{0:N1} KB' -f ($size / 1KB)
}

$startTime = Get-Date
Write-Log '[Backup] START'

try {
  # ── 설정 읽기 ──
  $config = Get-Content $ConfigPath -Raw -Encoding UTF8 | ConvertFrom-Json
  $flay = $config.flay
  Write-Log "[Backup] 설정 로드: $ConfigPath"

  if (-not (Test-Path $DestDir)) { New-Item -ItemType Directory -Path $DestDir | Out-Null }

  # 임시 작업 폴더 (zip 생성 후 목적지로 이동)
  $tempDir = Join-Path $env:TEMP 'flay-backup'
  if (Test-Path $tempDir) { Remove-Item $tempDir -Recurse -Force }
  New-Item -ItemType Directory -Path $tempDir | Out-Null

  # ── 인스턴스 백업: Info + Storage/Stage/Cover (동영상 제외) ──
  # flay-source.ts의 VIDEO_EXTS와 동일한 확장자 목록 (대소문자 모두 제외)
  $videoExts = @('avi', 'mpg', 'mkv', 'wmv', 'mp4', 'mov', 'rmvb', 'm2ts')
  $excludes = foreach ($e in $videoExts) { "--exclude=*.$e"; "--exclude=*.$($e.ToUpper())" }

  $instanceRoots = @($flay.infoPath, $flay.storagePath) + @($flay.stagePaths) + @($flay.coverPath)
  # hdrcharset=UTF-8: 파일명을 UTF-8로 기록 (미지정 시 ANSI 코드페이지로 저장되어 일본어 한자 등이 깨짐)
  $tmpInstanceZip = Join-Path $tempDir 'flay-instance.zip'
  $instanceArgs = @('-a', '-cf', $tmpInstanceZip, '--options', 'hdrcharset=UTF-8') + $excludes
  foreach ($root in $instanceRoots) {
    if (Test-Path $root) {
      # -C <부모폴더> <폴더명> 쌍으로 추가하여 zip 내부 경로를 "Info/", "Storage/" 형태로 유지
      $instanceArgs += @('-C', (Split-Path $root -Parent), (Split-Path $root -Leaf))
    }
    else {
      Write-Log "[Backup] 경고: 경로 없음, 건너뜀 - $root"
    }
  }
  Write-Log '[Backup] 인스턴스 압축 시작'
  Invoke-Tar $instanceArgs
  Move-Item -Path $tmpInstanceZip -Destination (Join-Path $DestDir 'flay-instance.zip') -Force
  $instanceSize = (Get-Item (Join-Path $DestDir 'flay-instance.zip')).Length
  Write-Log "[Backup] flay-instance.zip 완료 ($(Format-Size $instanceSize))"

  # ── 아카이브 백업: Archive 폴더 전체 ──
  $tmpArchiveZip = Join-Path $tempDir 'flay-archive.zip'
  $archiveArgs = @('-a', '-cf', $tmpArchiveZip, '--options', 'hdrcharset=UTF-8', '-C', (Split-Path $flay.archivePath -Parent), (Split-Path $flay.archivePath -Leaf))
  Write-Log '[Backup] 아카이브 압축 시작'
  Invoke-Tar $archiveArgs
  Move-Item -Path $tmpArchiveZip -Destination (Join-Path $DestDir 'flay-archive.zip') -Force
  $archiveSize = (Get-Item (Join-Path $DestDir 'flay-archive.zip')).Length
  Write-Log "[Backup] flay-archive.zip 완료 ($(Format-Size $archiveSize))"

  # ── 정리 ──
  Remove-Item $tempDir -Recurse -Force
  $elapsed = (Get-Date) - $startTime
  Write-Log ('[Backup] END (소요 {0:hh\:mm\:ss})' -f $elapsed)
  exit 0
}
catch {
  Write-Log "[Backup] 오류: $($_.Exception.Message)"
  exit 1
}
