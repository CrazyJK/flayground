@echo off
chcp 65001
setlocal

set "CURRENT_DIR=%cd%"
set "FLAYGROUND_HOME=%CURRENT_DIR%"
set "JAVA_OPTS=%JAVA_OPTS% -javaagent:%SCOUTER_AGENT_DIR%/scouter.agent.jar"
set "JAVA_OPTS=%JAVA_OPTS% -Dscouter.config=%SCOUTER_AGENT_DIR%/conf/scouter.conf"
set "JAVA_OPTS=%JAVA_OPTS% -Dspring.profiles.active=flay-home"
set "JAVA_OPTS=%JAVA_OPTS% -Dfile.encoding=UTF-8"

echo Using FLAYGROUND_HOME:  %FLAYGROUND_HOME%
echo Using       JAVA_HOME:  %JAVA_HOME%
echo Using       JAVA_OPTS:  %JAVA_OPTS%

"%JAVA_HOME%"\bin\java.exe %JAVA_OPTS% -jar "%FLAYGROUND_HOME%\target\Flayground.jar"
