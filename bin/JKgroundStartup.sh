#!/bin/sh

CURRENT_DIR=${PWD}
JK_GROUND_HOME="$CURRENT_DIR"
JAVA_OPTS="$JAVA_OPTS -XX:+UseG1GC -XX:+DisableExplicitGC -XX:+UseStringDeduplication"
JAVA_OPTS="$JAVA_OPTS -Dserver.port=80"
JAVA_OPTS="$JAVA_OPTS -Dspring.profiles.active=flay-wsl"
JAVA_OPTS="$JAVA_OPTS -Dfile.encoding=UTF-8"
JAVA_OPTS="$JAVA_OPTS -Djava.awt.headless=true"
JAVA_OPTS="$JAVA_OPTS -Djava.net.preferIPv4Stack=true"
JAVA_OPTS="$JAVA_OPTS -Dlogging.file.name=flayground.log"

echo "Using JK_GROUND: $JK_GROUND_HOME"
echo "Using JAVA_HOME: $JAVA_HOME"
echo "Using JAVA_OPTS: $JAVA_OPTS"

$JAVA_HOME/bin/java $JAVA_OPTS -jar $JK_GROUND_HOME/target/Flayground.jar
