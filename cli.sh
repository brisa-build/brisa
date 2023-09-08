#!/bin/bash

if [ "$1" = "dev" ]; then
    NODE_ENV=development bun --hot node_modules/bunrise/out/cli/dev/serve.js
elif [ "$1" = "build" ]; then
    NODE_ENV=production bun node_modules/bunrise/out/cli/build.js
elif [ "$1" = "start" ]; then
    NODE_ENV=production bun node_modules/bunrise/out/cli/serve.js
else
    echo "error: script not found $1"
fi
