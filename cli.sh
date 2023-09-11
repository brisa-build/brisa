#!/bin/bash

if command -v bun >/dev/null 2>&1; then
  BUN_EXEC="bun"
else
  BUN_EXEC="~/.bun/bin/bun"
fi

if [ "$1" = "dev" ]; then
  NODE_ENV=development $BUN_EXEC --hot node_modules/bunrise/out/cli/dev/serve.js
elif [ "$1" = "build" ]; then
  NODE_ENV=production $BUN_EXEC node_modules/bunrise/out/cli/build.js  
elif [ "$1" = "start" ]; then
  NODE_ENV=production $BUN_EXEC node_modules/bunrise/out/cli/serve.js
else
  echo "Error: script not found $1"
fi
