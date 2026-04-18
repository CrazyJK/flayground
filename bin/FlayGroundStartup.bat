@echo off
chcp 65001

setlocal

title FLAY_GROUND

@REM Guess FLAY_GROUND_HOME
set "CURRENT_DIR=%cd%"
set "FLAY_GROUND_HOME=%CURRENT_DIR%"
if exist "%FLAY_GROUND_HOME%\backend-node\src" goto foundHome
cd ..
set "FLAY_GROUND_HOME=%cd%"
if exist "%FLAY_GROUND_HOME%\backend-node\src" goto foundHome
echo invalid FLAY_GROUND_HOME: %FLAY_GROUND_HOME%
goto end

:foundHome

title FLAY_GROUND Build client-web
echo.
echo ====================================================================================================================
echo Build client-web
echo --------------------------------------------------------------------------------------------------------------------
cd "%FLAY_GROUND_HOME%\client-web"
start /wait /b cmd /c yarn install
echo.
start /wait /b cmd /c node madge.cjs
echo.
start /wait /b cmd /c yarn run build

title FLAY_GROUND Build backend-node
echo.
echo ====================================================================================================================
echo Build backend-node
echo --------------------------------------------------------------------------------------------------------------------
cd "%FLAY_GROUND_HOME%\backend-node"
start /wait /b cmd /c yarn install
echo.
start /wait /b cmd /c yarn build:schema
echo.
start /wait /b cmd /c yarn build

title FLAY_GROUND Start MCP-Nexus HTTP Server
echo.
echo ====================================================================================================================
echo MCP-Nexus HTTP Server started in background
echo --------------------------------------------------------------------------------------------------------------------
cd "%FLAY_GROUND_HOME%\mcp-nexus"
start /wait /b cmd /c yarn install
start /b cmd /c "yarn start:http > %FLAY_GROUND_HOME%\mcp-nexus\logs\mcp-nexus.log 2>&1"
echo MCP-Nexus logs: %FLAY_GROUND_HOME%\mcp-nexus\logs\mcp-nexus.log

title FLAY_GROUND
echo.
echo ====================================================================================================================
echo Start FLAY_GROUND (backend-node)
echo.
echo Using FLAY_GROUND: %FLAY_GROUND_HOME%
echo --------------------------------------------------------------------------------------------------------------------
cd "%FLAY_GROUND_HOME%\backend-node"
node dist\index.js

:end
