@echo off
chcp 65001
setlocal

set "CURRENT_DIR=%cd%"
set "FLAYGROUND_HOME=%CURRENT_DIR%"
set "JAVA_OPTS=%JAVA_OPTS% -Dspring.profiles.active=flay-home"
set "JAVA_OPTS=%JAVA_OPTS% -Dserver.port=443"
set "JAVA_OPTS=%JAVA_OPTS% -Dserver.ssl.enabled=true"
set "JAVA_OPTS=%JAVA_OPTS% -Dserver.ssl.key-alias=kamoru"
set "JAVA_OPTS=%JAVA_OPTS% -Dserver.ssl.key-store=classpath:cert/kamoru.jk.p12"
set "JAVA_OPTS=%JAVA_OPTS% -Dserver.ssl.key-store-password=697489"
set "JAVA_OPTS=%JAVA_OPTS% -Dfile.encoding=UTF-8"
set "JAVA_OPTS=%JAVA_OPTS% -Djava.awt.headless=true"
set "JAVA_OPTS=%JAVA_OPTS% -Djava.net.preferIPv4Stack=true"
set "JAVA_OPTS=%JAVA_OPTS% -Dlogging.file.name=./logs/flayground.log"
set "JAVA_OPTS=%JAVA_OPTS% -XX:+UseG1GC -XX:+DisableExplicitGC -XX:+UseStringDeduplication"

echo Using FLAYGROUND: %FLAYGROUND_HOME%
echo Using JAVA_HOME:  %JAVA_HOME%
echo Using JAVA_OPTS:  %JAVA_OPTS%

"%JAVA_HOME%"\bin\java.exe %JAVA_OPTS% -jar "%FLAYGROUND_HOME%"\target\Flayground.jar
