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

rem Build mcp-nexus, web-backend, and web-frontend

title FLAY_GROUND Build mcp-nexus
echo.
echo ====================================================================================================================
echo Build mcp-nexus
echo --------------------------------------------------------------------------------------------------------------------
cd "%FLAY_GROUND_HOME%\mcp-nexus"
start /wait /b cmd /c yarn install
echo.
start /wait /b cmd /c yarn run build

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

rem Start mcp-nexus, web-backend

title FLAY_GROUND Start MCP-Nexus HTTP Server
echo.
echo ====================================================================================================================
echo MCP-Nexus HTTP Server started in background
echo --------------------------------------------------------------------------------------------------------------------
cd "%FLAY_GROUND_HOME%\mcp-nexus"
start /b cmd /c "yarn start > %FLAY_GROUND_HOME%\mcp-nexus\logs\mcp-nexus.log 2>&1"
echo MCP-Nexus logs: %FLAY_GROUND_HOME%\mcp-nexus\logs\mcp-nexus.log

title FLAY_GROUND
echo.
echo ====================================================================================================================
echo FLAY_GROUND Web Backend started
echo --------------------------------------------------------------------------------------------------------------------
cd "%FLAY_GROUND_HOME%\web-backend"
start /b cmd /c "yarn start > %FLAY_GROUND_HOME%\web-backend\logs\web-backend.log 2>&1"
echo Web Backend logs: %FLAY_GROUND_HOME%\web-backend\logs\web-backend.log

:end
