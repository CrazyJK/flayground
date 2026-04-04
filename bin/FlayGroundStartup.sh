#!/bin/sh

CURRENT_DIR=${PWD}
FLAY_GROUND_HOME="$CURRENT_DIR"

if [ ! -d "$FLAY_GROUND_HOME/server_node/src" ]; then
  FLAY_GROUND_HOME="$(cd .. && pwd)"
fi

if [ ! -d "$FLAY_GROUND_HOME/server_node/src" ]; then
  echo "invalid FLAY_GROUND_HOME: $FLAY_GROUND_HOME"
  exit 1
fi

echo "Using FLAY_GROUND: $FLAY_GROUND_HOME"

# Build WWW
echo ""
echo "===================================================================================================================="
echo "Build WWW"
echo "--------------------------------------------------------------------------------------------------------------------"
cd "$FLAY_GROUND_HOME/www"
yarn install
node madge.cjs
yarn run build

# Build server_node
echo ""
echo "===================================================================================================================="
echo "Build server_node"
echo "--------------------------------------------------------------------------------------------------------------------"
cd "$FLAY_GROUND_HOME/server_node"
yarn install
yarn build

# Start MCP-Gemini HTTP Server
echo ""
echo "===================================================================================================================="
echo "MCP-Gemini HTTP Server started in background"
echo "--------------------------------------------------------------------------------------------------------------------"
cd "$FLAY_GROUND_HOME/mcp-gemini"
yarn install
nohup yarn http > "$FLAY_GROUND_HOME/mcp-gemini/logs/mcp-gemini.log" 2>&1 &
echo "MCP-Gemini logs: $FLAY_GROUND_HOME/mcp-gemini/logs/mcp-gemini.log"

# Start MCP-Github HTTP Server
echo ""
echo "===================================================================================================================="
echo "MCP-Github HTTP Server started in background"
echo "--------------------------------------------------------------------------------------------------------------------"
cd "$FLAY_GROUND_HOME/mcp-github"
yarn install
nohup yarn http > "$FLAY_GROUND_HOME/mcp-github/logs/mcp-github.log" 2>&1 &
echo "MCP-Github logs: $FLAY_GROUND_HOME/mcp-github/logs/mcp-github.log"

# Start server_node
echo ""
echo "===================================================================================================================="
echo "Start FLAY_GROUND (server_node)"
echo "--------------------------------------------------------------------------------------------------------------------"
cd "$FLAY_GROUND_HOME/server_node"
node dist/index.js
