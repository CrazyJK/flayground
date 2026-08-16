@echo off
chcp 65001

setlocal

title FLAY_GROUND

@REM FLAY_GROUND_HOME = repo root (this script lives in <root>\bin\web)
pushd "%~dp0..\.."
set "FLAY_GROUND_HOME=%cd%"
popd
if exist "%FLAY_GROUND_HOME%\flay-web\backend\src" goto foundHome
echo invalid FLAY_GROUND_HOME: %FLAY_GROUND_HOME%
goto end

:foundHome

rem Build flay-mcp, flay-web/backend, and flay-web/frontend

title FLAY_GROUND Build flay-mcp
echo.
echo ====================================================================================================================
echo Build flay-mcp
echo --------------------------------------------------------------------------------------------------------------------
cd "%FLAY_GROUND_HOME%\flay-mcp"
start /wait /b cmd /c yarn install
echo.
start /wait /b cmd /c yarn run build

title FLAY_GROUND Build flay-web/frontend
echo.
echo ====================================================================================================================
echo Build flay-web/frontend
echo --------------------------------------------------------------------------------------------------------------------
cd "%FLAY_GROUND_HOME%\flay-web\frontend"
start /wait /b cmd /c yarn install
echo.
start /wait /b cmd /c node madge.cjs
echo.
start /wait /b cmd /c yarn run build

title FLAY_GROUND Build flay-web/backend
echo.
echo ====================================================================================================================
echo Build flay-web/backend
echo --------------------------------------------------------------------------------------------------------------------
cd "%FLAY_GROUND_HOME%\flay-web\backend"
start /wait /b cmd /c yarn install
echo.
start /wait /b cmd /c yarn build:schema
echo.
start /wait /b cmd /c yarn build

rem Start flay-mcp, flay-web/backend

title FLAY_GROUND Start MCP-Nexus HTTP Server
echo.
echo ====================================================================================================================
echo MCP-Nexus HTTP Server started in background
echo --------------------------------------------------------------------------------------------------------------------
cd "%FLAY_GROUND_HOME%\flay-mcp"
start /b cmd /c "yarn start > %FLAY_GROUND_HOME%\flay-mcp\logs\mcp-nexus.log 2>&1"
echo MCP-Nexus logs: %FLAY_GROUND_HOME%\flay-mcp\logs\mcp-nexus.log

title FLAY_GROUND
echo.
echo ====================================================================================================================
echo FLAY_GROUND Web Backend started
echo --------------------------------------------------------------------------------------------------------------------
cd "%FLAY_GROUND_HOME%\flay-web\backend"
start /b cmd /c "yarn start > %FLAY_GROUND_HOME%\flay-web\backend\logs\web-backend.log 2>&1"
echo Web Backend logs: %FLAY_GROUND_HOME%\flay-web\backend\logs\web-backend.log

:end
