#!/bin/sh

CURRENT_DIR=${PWD}
FLAY_GROUND_HOME="$CURRENT_DIR"

if [ ! -d "$FLAY_GROUND_HOME/backend-node/src" ]; then
  FLAY_GROUND_HOME="$(cd .. && pwd)"
fi

if [ ! -d "$FLAY_GROUND_HOME/backend-node/src" ]; then
  echo "invalid FLAY_GROUND_HOME: $FLAY_GROUND_HOME"
  exit 1
fi

echo "Using FLAY_GROUND: $FLAY_GROUND_HOME"

# Build client-web
echo ""
echo "===================================================================================================================="
echo "Build client-web"
echo "--------------------------------------------------------------------------------------------------------------------"
cd "$FLAY_GROUND_HOME/client-web"
yarn install
node madge.cjs
yarn run build

# Build backend-node
echo ""
echo "===================================================================================================================="
echo "Build backend-node"
echo "--------------------------------------------------------------------------------------------------------------------"
cd "$FLAY_GROUND_HOME/backend-node"
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

# Start backend-node
echo ""
echo "===================================================================================================================="
echo "Start FLAY_GROUND (backend-node)"
echo "--------------------------------------------------------------------------------------------------------------------"
cd "$FLAY_GROUND_HOME/backend-node"
node dist/index.js
