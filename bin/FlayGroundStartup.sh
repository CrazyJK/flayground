#!/bin/sh

CURRENT_DIR=${PWD}
FLAY_GROUND_HOME="$CURRENT_DIR"
JAVA_OPTS="$JAVA_OPTS -XX:+UseG1GC -XX:+DisableExplicitGC -XX:+UseStringDeduplication"
JAVA_OPTS="$JAVA_OPTS -Dserver.port=80"
JAVA_OPTS="$JAVA_OPTS -Dspring.profiles.active=ground-wsl,env-prod,env-ssl"
JAVA_OPTS="$JAVA_OPTS -Dfile.encoding=UTF-8"
JAVA_OPTS="$JAVA_OPTS -Djava.awt.headless=true"
JAVA_OPTS="$JAVA_OPTS -Djava.net.preferIPv4Stack=true"
JAVA_OPTS="$JAVA_OPTS -Dlogging.file.name=flay-ground.log"

echo "Using FLAY_GROUND: $FLAY_GROUND_HOME"
echo "Using JAVA_HOME: $JAVA_HOME"
echo "Using JAVA_OPTS: $JAVA_OPTS"

$JAVA_HOME/bin/java $JAVA_OPTS -jar $FLAY_GROUND_HOME/target/Flay-Ground.jar
