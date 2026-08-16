<#
============================================================
 flay-web - backend (Express) serving the webpack-built frontend + API (production)
   Port  : https://flay.kamoru.jk (443)
   start : builds first, then `yarn start` in flay-web/backend
             flay-web/frontend : yarn install, node madge.cjs, yarn run build  (webpack -> frontend/dist)
             flay-web/backend  : yarn install, yarn build:schema, yarn build   (tsup -> backend/dist)
   Log   : flay-web\backend\logs\web-backend.log  (build: flay-web\backend\logs\build.log)

 Usage:  bin\web\web.ps1 <start|stop|restart|status> [-SkipBuild]
   -SkipBuild : start from the existing dist/ without rebuilding
============================================================
#>
param([Parameter(Position = 0)][string]$Action, [switch]$SkipBuild)

. (Join-Path $PSScriptRoot '..\common.ps1')

Invoke-Flay -Action $Action -Title 'flay-web' -Keys @('web') -SkipBuild:$SkipBuild
