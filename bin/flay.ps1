<#
============================================================
 Flay-Ground - control every component at once (PRODUCTION mode)
   mcp    : flay-mcp            (3002)  yarn build -> dist/, yarn start
   web    : flay-web/backend    (443)   frontend webpack + backend tsup build, yarn start
   qdrant : flay-ai vector DB   (6333, docker)
   ollama : local LLM           (11434)
   api    : flay-ai FastAPI     (8000)  uvicorn, no --reload
   ai-web : flay-ai Next.js     (3000)  yarn build -> .next, node server.js
 (dev mode: .vscode/launch.json or the Claude in-app procedure - not this script)

   start   : mcp -> web -> qdrant -> ollama -> api -> ai-web (skips ports already LISTENING)
   stop    : reverse order
   restart : stop -> 3s -> start
   status  : port LISTEN state + health code of every component

 Every process runs as a background job of THIS terminal (no new windows);
 stdout goes to  flay-mcp\logs\mcp-nexus.log, flay-web\backend\logs\web-backend.log,
 flay-ai\logs\{ollama,api,web}.log; build output to <same dir>\build.log.

 Usage:  bin\flay.ps1 <start|stop|restart|status> [-SkipBuild]
   -SkipBuild : start mcp/web/ai-web from the existing build output without rebuilding
   (from cmd.exe: powershell -NoProfile -File bin\flay.ps1 start)
============================================================
#>
param([Parameter(Position = 0)][string]$Action, [switch]$SkipBuild)

. (Join-Path $PSScriptRoot 'common.ps1')

Invoke-Flay -Action $Action -Title 'Flay-Ground' -Keys @('mcp', 'web', 'qdrant', 'ollama', 'api', 'aiweb') -SkipBuild:$SkipBuild
