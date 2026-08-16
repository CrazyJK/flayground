<#
============================================================
 flay-mcp - MCP Nexus HTTP server (production)
   Port  : https://flay.kamoru.jk:3002   (health: /health)
   Dir   : flay-mcp
   start : yarn install + yarn run build (-> dist/), then yarn start
   Log   : flay-mcp\logs\mcp-nexus.log  (build: flay-mcp\logs\build.log)

 Usage:  bin\web\mcp.ps1 <start|stop|restart|status> [-SkipBuild]
   -SkipBuild : start from the existing dist/ without rebuilding
============================================================
#>
param([Parameter(Position = 0)][string]$Action, [switch]$SkipBuild)

. (Join-Path $PSScriptRoot '..\common.ps1')

Invoke-Flay -Action $Action -Title 'flay-mcp' -Keys @('mcp') -SkipBuild:$SkipBuild
