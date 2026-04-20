@echo off
chcp 65001

setlocal

title FLAY_GROUND

@REM Guess FLAY_GROUND_HOME
set "CURRENT_DIR=%cd%"
set "FLAY_GROUND_HOME=%CURRENT_DIR%"
if exist "%FLAY_GROUND_HOME%\web-backend\src" goto foundHome
cd ..
set "FLAY_GROUND_HOME=%cd%"
if exist "%FLAY_GROUND_HOME%\web-backend\src" goto foundHome
echo invalid FLAY_GROUND_HOME: %FLAY_GROUND_HOME%
goto end

:foundHome

title FLAY_GROUND Build web-frontend
echo.
echo ====================================================================================================================
echo Build web-frontend
echo --------------------------------------------------------------------------------------------------------------------
cd "%FLAY_GROUND_HOME%\web-frontend"
start /wait /b cmd /c yarn install
echo.
start /wait /b cmd /c node madge.cjs
echo.
start /wait /b cmd /c yarn run build

title FLAY_GROUND Build web-backend
echo.
echo ====================================================================================================================
echo Build web-backend
echo --------------------------------------------------------------------------------------------------------------------
cd "%FLAY_GROUND_HOME%\web-backend"
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
echo Start FLAY_GROUND (web-backend)
echo.
echo Using FLAY_GROUND: %FLAY_GROUND_HOME%
echo --------------------------------------------------------------------------------------------------------------------
cd "%FLAY_GROUND_HOME%\web-backend"
node dist\index.js

:end
