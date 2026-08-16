@echo off
REM ============================================================
REM  Flay-Ground - control every component at once
REM    web : flay-web/backend  (443, serves frontend + API, needs prior build)
REM    mcp : flay-mcp          (3002)
REM    ai  : flay-ai           (qdrant 6333 -> ollama 11434 -> api 8000 -> web 3000)
REM
REM    start   : mcp -> web -> ai   (skips components already listening)
REM    stop    : ai -> web -> mcp
REM    status  : port LISTEN state of every component
REM
REM  web/mcp are started from their built output (yarn start).
REM  Build first with bin\web\FlayGroundStartup.bat when dist/ is missing.
REM
REM  Usage: flay.bat <start|stop|status>
REM ============================================================
setlocal enabledelayedexpansion
set "ACTION=%~1"
pushd "%~dp0.."
set "ROOT=%cd%"
popd
set "BIN=%~dp0"

if /i "%ACTION%"=="start"  goto :start
if /i "%ACTION%"=="stop"   goto :stop
if /i "%ACTION%"=="status" goto :status
echo Usage: flay.bat ^<start^|stop^|status^>
exit /b 1

:start
call :start_node 3002 mcp "%ROOT%\flay-mcp"          "%ROOT%\flay-mcp\logs\mcp-nexus.log"
call :start_node  443 web "%ROOT%\flay-web\backend"  "%ROOT%\flay-web\backend\logs\web-backend.log"
echo   [start] ai ...
call "%BIN%ai\all.bat" start
echo.
echo [flay start] done.
echo   web : https://flay.kamoru.jk
echo   mcp : http://localhost:3002
echo   ai  : https://ai.kamoru.jk:3000
goto :eof

:start_node
REM  %1=port  %2=name  %3=project dir  %4=log file
set "PORT=%~1"
set "NAME=%~2"
set "DIR=%~3"
set "LOG=%~4"
set "PID="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":%PORT% " ^| findstr "LISTENING"') do set "PID=%%P"
if defined PID (
    echo   [skip ] %NAME% already listening on port %PORT% ^(pid !PID!^)
    exit /b 0
)
if not exist "%DIR%\dist" (
    echo   [error] %NAME%: %DIR%\dist not found. run bin\web\FlayGroundStartup.bat first.
    exit /b 1
)
echo   [start] %NAME% ...
if not exist "%DIR%\logs" mkdir "%DIR%\logs"
pushd "%DIR%"
start /b cmd /c "yarn start > "%LOG%" 2>&1"
popd
timeout /t 3 /nobreak >nul
exit /b 0

:stop
call "%BIN%ai\all.bat" stop
call :stop_port  443 web
call :stop_port 3002 mcp
echo.
echo [flay stop] done.
goto :eof

:stop_port
REM  %1=port  %2=name  -> taskkill the LISTENING pid tree
set "PORT=%~1"
set "NAME=%~2"
set "FOUND="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":%PORT% " ^| findstr "LISTENING"') do (
    echo   [stop ] %NAME% pid %%P
    taskkill /F /T /PID %%P >nul 2>&1
    set "FOUND=1"
)
if not defined FOUND echo   [    ] %NAME% not running ^(port %PORT%^)
exit /b 0

:status
echo === flay-web / flay-mcp ===
call :check  443 web
call :check 3002 mcp
echo.
call "%BIN%ai\all.bat" status
goto :eof

:check
set "PORT=%~1"
set "NAME=%~2"
set "PID="
for /f "tokens=5" %%P in ('netstat -ano ^| findstr ":%PORT% " ^| findstr "LISTENING"') do set "PID=%%P"
if defined PID (
    echo   [UP  ]  %NAME%   port %PORT%   pid !PID!
) else (
    echo   [DOWN]  %NAME%   port %PORT%
)
exit /b 0
