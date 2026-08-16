<#
============================================================
 flayAI - Qdrant vector DB (Docker)
   Container  : flayai-qdrant (flay-ai/docker-compose.yml)
   Port       : 6333 (REST), 6334 (gRPC)
   Volume     : flay-ai/data/qdrant
   Prereq     : Docker Desktop running

   start   : docker compose up -d qdrant
   stop    : docker compose stop qdrant   (data preserved)
   restart : stop -> start
   status  : port + container status

 Usage:  bin\ai\qdrant.ps1 <start|stop|restart|status>
============================================================
#>
param([Parameter(Position = 0)][string]$Action)

. (Join-Path $PSScriptRoot '..\common.ps1')

Invoke-Flay -Action $Action -Title 'flayAI qdrant' -Keys @('qdrant')
