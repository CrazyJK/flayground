@echo off
chcp 65001

setlocal

title FLAY_GROUND

@REM Guess FLAY_GROUND_HOME
set "CURRENT_DIR=%cd%"
set "FLAY_GROUND_HOME=%CURRENT_DIR%"
if exist "%FLAY_GROUND_HOME%\target" goto setEnv
cd ..
set "FLAY_GROUND_HOME=%cd%"
if exist "%FLAY_GROUND_HOME%\target" goto setEnv
echo invalid FLAY_GROUND_HOME: %FLAY_GROUND_HOME%
goto end

:setEnv
set "JAVA_OPTS=%JAVA_OPTS% -Dfile.encoding=UTF-8"
set "JAVA_OPTS=%JAVA_OPTS% -Djava.awt.headless=true"
set "JAVA_OPTS=%JAVA_OPTS% -Djava.net.preferIPv4Stack=true"
set "JAVA_OPTS=%JAVA_OPTS% -Dlogging.file.name=%FLAY_GROUND_HOME%\logs\flay-ground.log"
set "JAVA_OPTS=%JAVA_OPTS% -XX:+UseG1GC -XX:+DisableExplicitGC -XX:+UseStringDeduplication"

if ""%1"" == """" goto setHTTP
if ""%1"" == ""ssl"" goto setHTTPS

echo Unknown command
goto end

:setHTTP
set "JAVA_OPTS=%JAVA_OPTS% -Dspring.profiles.active=ground-home,env-prod"
goto execCmd

:setHTTPS
set "JAVA_OPTS=%JAVA_OPTS% -Dspring.profiles.active=ground-home,env-prod,env-ssl"
goto execCmd

:execCmd
title FLAY_GROUND Build WWW
echo.
echo ====================================================================================================================
echo Build WWW
echo --------------------------------------------------------------------------------------------------------------------
cd www
start /wait /b cmd /c yarn install
echo.
start /wait /b cmd /c node madge.cjs
echo.
start /wait /b cmd /c yarn run build

title FLAY_GROUND Build maven
echo.
echo ====================================================================================================================
echo Build maven
echo --------------------------------------------------------------------------------------------------------------------
cd ..
start /wait /b cmd /c mvn clean package

title FLAY_GROUND Start MCP-Gemini HTTP Server
echo.
echo ====================================================================================================================
echo MCP-Gemini HTTP Server started in background
echo --------------------------------------------------------------------------------------------------------------------
cd ..\mcp-gemini
start /wait /b cmd /c yarn install
start /b cmd /c "yarn http > %FLAY_GROUND_HOME%\logs\mcp-gemini.log 2>&1"
echo MCP-Gemini logs: %FLAY_GROUND_HOME%\logs\mcp-gemini.log

title FLAY_GROUND
echo.
echo ====================================================================================================================
echo Start FLAY_GROUND %1
echo.
echo Using FLAY_GROUND: %FLAY_GROUND_HOME%
echo Using JAVA_HOME:   %JAVA_HOME%
echo Using JAVA_OPTS:   %JAVA_OPTS%
echo --------------------------------------------------------------------------------------------------------------------
"%JAVA_HOME%\bin\java.exe" %JAVA_OPTS% -jar "%FLAY_GROUND_HOME%\target\Flay-Ground.jar"

:end
