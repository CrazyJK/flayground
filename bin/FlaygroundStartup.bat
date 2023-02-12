@echo off
chcp 65001

setlocal

@REM Guess FLAYGROUND_HOME
set "CURRENT_DIR=%cd%"
set "FLAYGROUND_HOME=%CURRENT_DIR%"
if exist "%FLAYGROUND_HOME%\target" goto setEnv
cd ..
set "FLAYGROUND_HOME=%cd%"
if exist "%FLAYGROUND_HOME%\target" goto setEnv
echo invalid FLAYGROUND_HOME: %FLAYGROUND_HOME%
goto end

:setEnv
set "JAVA_OPTS=%JAVA_OPTS% -Dspring.profiles.active=flay-home"
set "JAVA_OPTS=%JAVA_OPTS% -Dfile.encoding=UTF-8"
set "JAVA_OPTS=%JAVA_OPTS% -Djava.awt.headless=true"
set "JAVA_OPTS=%JAVA_OPTS% -Djava.net.preferIPv4Stack=true"
set "JAVA_OPTS=%JAVA_OPTS% -Dlogging.file.name=%FLAYGROUND_HOME%\logs\flayground.log"
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
start /wait /b cmd /c yarn run build

echo ===========================================================================================
echo Build maven
echo ===========================================================================================
cd ..
start /wait /b cmd /c mvn clean package

echo ===========================================================================================
echo Start Flayground
echo -------------------------------------------------------------------------------------------
echo Using FLAYGROUND: %FLAYGROUND_HOME%
echo Using  JAVA_HOME: %JAVA_HOME%
echo Using  JAVA_OPTS: %JAVA_OPTS%
echo ===========================================================================================

"%JAVA_HOME%\bin\java.exe" %JAVA_OPTS% -jar "%FLAYGROUND_HOME%\target\Flayground.jar"

:end
