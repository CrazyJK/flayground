#!/bin/sh

# FLAY_GROUND_HOME = repo root (this script lives in <root>/bin/web)
FLAY_GROUND_HOME="$(cd "$(dirname "$0")/../.." && pwd)"

if [ ! -d "$FLAY_GROUND_HOME/flay-web/backend/src" ]; then
  echo "invalid FLAY_GROUND_HOME: $FLAY_GROUND_HOME"
  exit 1
fi

echo "Using FLAY_GROUND: $FLAY_GROUND_HOME"

# Build flay-web/frontend
echo ""
echo "===================================================================================================================="
echo "Build flay-web/frontend"
echo "--------------------------------------------------------------------------------------------------------------------"
cd "$FLAY_GROUND_HOME/flay-web/frontend"
yarn install
node madge.cjs
yarn run build

# Build flay-web/backend
echo ""
echo "===================================================================================================================="
echo "Build flay-web/backend"
echo "--------------------------------------------------------------------------------------------------------------------"
cd "$FLAY_GROUND_HOME/flay-web/backend"
yarn install
yarn build:schema
yarn build

# Start MCP-Nexus HTTP Server
echo ""
echo "===================================================================================================================="
echo "MCP-Nexus HTTP Server started in background"
echo "--------------------------------------------------------------------------------------------------------------------"
cd "$FLAY_GROUND_HOME/flay-mcp"
yarn install
nohup yarn http > "$FLAY_GROUND_HOME/flay-mcp/logs/mcp-nexus.log" 2>&1 &
echo "MCP-Nexus logs: $FLAY_GROUND_HOME/flay-mcp/logs/mcp-nexus.log"

# Start flay-web/backend
echo ""
echo "===================================================================================================================="
echo "Start FLAY_GROUND (flay-web/backend)"
echo "--------------------------------------------------------------------------------------------------------------------"
cd "$FLAY_GROUND_HOME/flay-web/backend"
node dist/index.js
