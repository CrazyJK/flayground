<#
============================================================
 flayAI - Web frontend, production (Next.js build + custom HTTPS server)
   Port     : https://ai.kamoru.jk:3000
   Location : flay-ai/apps/web
   start    : yarn install + yarn build (-> .next), then node server.js
   Depends  : api(8000)
   Log      : flay-ai\logs\web.log  (build: flay-ai\logs\build.log)

 Usage:  bin\ai\web.ps1 <start|stop|restart|status> [-SkipBuild]
   -SkipBuild : reuse the existing .next build
============================================================
#>
param([Parameter(Position = 0)][string]$Action, [switch]$SkipBuild)

. (Join-Path $PSScriptRoot '..\common.ps1')

Invoke-Flay -Action $Action -Title 'flayAI web' -Keys @('aiweb') -SkipBuild:$SkipBuild
