<#
============================================================
 flayAI - API server (FastAPI / uvicorn, no --reload)
   Port      : https://ai.kamoru.jk:8000   (health: /healthz)
   Entrypoint: apps.api.main:app   (cwd flay-ai, cert ../.cert)
   Depends   : qdrant(6333), ollama(11434)
   Log       : flay-ai\logs\api.log (+ the app's own logs\flayai.log)

 Usage:  bin\ai\api.ps1 <start|stop|restart|status>
============================================================
#>
param([Parameter(Position = 0)][string]$Action)

. (Join-Path $PSScriptRoot '..\common.ps1')

Invoke-Flay -Action $Action -Title 'flayAI api' -Keys @('api')
