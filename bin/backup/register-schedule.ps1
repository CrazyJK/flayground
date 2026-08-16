<#
.SYNOPSIS
  백업 예약 작업 등록 스크립트 (Windows 작업 스케줄러)

.DESCRIPTION
  bin\backup 의 백업 스크립트 3개를 예약 작업으로 등록한다. 같은 이름의 작업이 있으면 덮어쓴다.

    작업명               스크립트            주기
    flayAI Backup Tier1  backup-tier1.ps1    매일 03:30       (SQLite·일기 자산·private 오버라이드)
    flayAI Backup Tier2  backup-tier2.ps1    일요일 04:00     (Qdrant 스냅샷)
    Flay-Weekly-Backup   flay-backup.ps1     일요일 05:00     (flay-web 인스턴스/아카이브 zip → iCloud)

  - 현재 로그인 사용자 권한으로 실행 (K:, J: 드라이브 접근 필요)
  - 예정 시각에 PC가 꺼져 있었으면 부팅 후 가능한 시점에 실행 (StartWhenAvailable)
  - 실행 제한 시간: Tier1 2시간, Tier2/Flay 6시간

.PARAMETER Only
  특정 작업만 등록할 때 작업명 지정 (예: -Only 'Flay-Weekly-Backup')

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File register-schedule.ps1
#>
param(
  [string]$Only = ''
)

$ErrorActionPreference = 'Stop'

# 작업 정의: 이름 / 스크립트 / 트리거 / 제한시간 / 설명
$jobs = @(
  @{ Name = 'flayAI Backup Tier1'; Script = 'backup-tier1.ps1'; Trigger = (New-ScheduledTaskTrigger -Daily -At '03:30'); Hours = 2; Desc = 'flay-ai Tier1 일일 백업 (SQLite, 일기 자산, private 오버라이드)' },
  @{ Name = 'flayAI Backup Tier2'; Script = 'backup-tier2.ps1'; Trigger = (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At '04:00'); Hours = 6; Desc = 'flay-ai Tier2 주간 백업 (Qdrant 스냅샷)' },
  @{ Name = 'Flay-Weekly-Backup';   Script = 'flay-backup.ps1';   Trigger = (New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At '05:00'); Hours = 6; Desc = 'Flay 인스턴스/아카이브 주간 백업 (iCloud)' }
)

foreach ($job in $jobs) {
  if ($Only -and $job.Name -ne $Only) { continue }

  $scriptPath = Join-Path $PSScriptRoot $job.Script
  if (-not (Test-Path $scriptPath)) { throw "백업 스크립트를 찾을 수 없습니다: $scriptPath" }

  $action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
  $settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours $job.Hours)

  Register-ScheduledTask -TaskName $job.Name -Action $action -Trigger $job.Trigger -Settings $settings -Description $job.Desc -Force | Out-Null
  Write-Host ("예약 작업 등록 완료: {0}  ->  {1}" -f $job.Name, $scriptPath)
}

Write-Host ''
Write-Host '수동 실행: schtasks /Run /TN "<작업명>"'
Write-Host '삭제:     schtasks /Delete /TN "<작업명>" /F'
