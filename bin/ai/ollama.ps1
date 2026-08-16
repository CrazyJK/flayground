<#
============================================================
 flayAI - Ollama local LLM server
   Port  : 11434
   Model : see flay-ai/config.yaml (models.*)
   Log   : flay-ai\logs\ollama.log
   Note  : the Windows installer runs Ollama as a tray app that restarts
           it after `stop` - Quit it from the tray icon if you really
           want it down.

 Usage:  bin\ai\ollama.ps1 <start|stop|restart|status>
============================================================
#>
param([Parameter(Position = 0)][string]$Action)

. (Join-Path $PSScriptRoot '..\common.ps1')

Invoke-Flay -Action $Action -Title 'flayAI ollama' -Keys @('ollama')
