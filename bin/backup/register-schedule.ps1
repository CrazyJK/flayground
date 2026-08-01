<#
.SYNOPSIS
  Flay 주간 백업 작업 스케줄러 등록 스크립트

.DESCRIPTION
  flay-backup.ps1을 매주 일요일 05:00에 실행하는 예약 작업을 등록한다.
  (flayAI Backup Tier2가 일요일 04:00에 실행되므로 중복을 피해 05:00로 설정)
  - 현재 로그인 사용자 권한으로 실행 (K:, J: 드라이브 접근 필요)
  - 예정 시각에 PC가 꺼져 있었으면 부팅 후 가능한 시점에 실행 (StartWhenAvailable)
  - 실행 제한 시간 6시간
  이미 같은 이름의 작업이 있으면 덮어쓴다.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File register-schedule.ps1
#>
param(
  [string]$TaskName = 'Flay-Weekly-Backup'
)

$ErrorActionPreference = 'Stop'

$scriptPath = Join-Path $PSScriptRoot 'flay-backup.ps1'
if (-not (Test-Path $scriptPath)) { throw "백업 스크립트를 찾을 수 없습니다: $scriptPath" }

$action = New-ScheduledTaskAction -Execute 'powershell.exe' -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`""
$trigger = New-ScheduledTaskTrigger -Weekly -DaysOfWeek Sunday -At '05:00'
$settings = New-ScheduledTaskSettingsSet -StartWhenAvailable -ExecutionTimeLimit (New-TimeSpan -Hours 6)

Register-ScheduledTask -TaskName $TaskName -Action $action -Trigger $trigger -Settings $settings -Description 'Flay 인스턴스/아카이브 주간 백업 (iCloud)' -Force | Out-Null

Write-Host "예약 작업 등록 완료: $TaskName (매주 일요일 05:00)"
Write-Host "수동 실행: schtasks /Run /TN $TaskName"
Write-Host "삭제:     schtasks /Delete /TN $TaskName /F"
