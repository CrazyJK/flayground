#!/bin/sh

CURRENT_DIR=${PWD}
FLAY_GROUND_HOME="$CURRENT_DIR"

if [ ! -d "$FLAY_GROUND_HOME/web-backend/src" ]; then
  FLAY_GROUND_HOME="$(cd .. && pwd)"
fi

if [ ! -d "$FLAY_GROUND_HOME/web-backend/src" ]; then
  echo "invalid FLAY_GROUND_HOME: $FLAY_GROUND_HOME"
  exit 1
fi

echo "Using FLAY_GROUND: $FLAY_GROUND_HOME"

# Build web-frontend
echo ""
echo "===================================================================================================================="
echo "Build web-frontend"
echo "--------------------------------------------------------------------------------------------------------------------"
cd "$FLAY_GROUND_HOME/web-frontend"
yarn install
node madge.cjs
yarn run build

# Build web-backend
echo ""
echo "===================================================================================================================="
echo "Build web-backend"
echo "--------------------------------------------------------------------------------------------------------------------"
cd "$FLAY_GROUND_HOME/web-backend"
yarn install
yarn build:schema
yarn build

# Start MCP-Nexus HTTP Server
echo ""
echo "===================================================================================================================="
echo "MCP-Nexus HTTP Server started in background"
echo "--------------------------------------------------------------------------------------------------------------------"
cd "$FLAY_GROUND_HOME/mcp-nexus"
yarn install
nohup yarn http > "$FLAY_GROUND_HOME/mcp-nexus/logs/mcp-nexus.log" 2>&1 &
echo "MCP-Nexus logs: $FLAY_GROUND_HOME/mcp-nexus/logs/mcp-nexus.log"

# Start web-backend
echo ""
echo "===================================================================================================================="
echo "Start FLAY_GROUND (web-backend)"
echo "--------------------------------------------------------------------------------------------------------------------"
cd "$FLAY_GROUND_HOME/web-backend"
node dist/index.js
