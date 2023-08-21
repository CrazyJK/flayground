@echo off
chcp 65001

setlocal

@REM Guess JK_GROUND_HOME
set "CURRENT_DIR=%cd%"
set "JK_GROUND_HOME=%CURRENT_DIR%"
if exist "%JK_GROUND_HOME%\target" goto setEnv
cd ..
set "JK_GROUND_HOME=%cd%"
if exist "%JK_GROUND_HOME%\target" goto setEnv
echo invalid JK_GROUND_HOME: %JK_GROUND_HOME%
goto end

:setEnv
set "JAVA_OPTS=%JAVA_OPTS% -Dspring.profiles.active=ground-home"
set "JAVA_OPTS=%JAVA_OPTS% -Dfile.encoding=UTF-8"
set "JAVA_OPTS=%JAVA_OPTS% -Djava.awt.headless=true"
set "JAVA_OPTS=%JAVA_OPTS% -Djava.net.preferIPv4Stack=true"
set "JAVA_OPTS=%JAVA_OPTS% -Dlogging.file.name=%JK_GROUND_HOME%\logs\jkground.log"
set "JAVA_OPTS=%JAVA_OPTS% -XX:+UseG1GC -XX:+DisableExplicitGC -XX:+UseStringDeduplication"

if ""%1"" == """" goto setHTTP
if ""%1"" == ""ssl"" goto setHTTPS

echo Unknown command
goto end

:setHTTP
set "JAVA_OPTS=%JAVA_OPTS% -Dserver.port=80"
goto execCmd

:setHTTPS
set "JAVA_OPTS=%JAVA_OPTS% -Dserver.port=443"
set "JAVA_OPTS=%JAVA_OPTS% -Dserver.ssl.enabled=true"
set "JAVA_OPTS=%JAVA_OPTS% -Dserver.ssl.key-alias=kamoru"
set "JAVA_OPTS=%JAVA_OPTS% -Dserver.ssl.key-store=classpath:cert/kamoru.jk.p12"
set "JAVA_OPTS=%JAVA_OPTS% -Dserver.ssl.key-store-password=697489"
goto execCmd

:execCmd
echo ===========================================================================================
echo Build WWW
echo ===========================================================================================

cd www
start /wait /b cmd /c yarn install
start /wait /b cmd /c yarn run build

echo ===========================================================================================
echo Build maven
echo ===========================================================================================

cd ..
start /wait /b cmd /c mvn clean package

title JK_GROUND

echo ===========================================================================================
echo Start JK_GROUND %1
echo -------------------------------------------------------------------------------------------
echo Using JK_GROUND: %JK_GROUND_HOME%
echo Using JAVA_HOME: %JAVA_HOME%
echo Using JAVA_OPTS: %JAVA_OPTS%
echo ===========================================================================================

"%JAVA_HOME%\bin\java.exe" %JAVA_OPTS% -jar "%JK_GROUND_HOME%\target\JK-Ground.jar"

:end
