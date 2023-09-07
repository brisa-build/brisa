#!/bin/bash

if [ "$1" = "dev" ]; then
    bun --watch node_modules/bunrise/out/cli/dev.js
elif [ "$1" = "build" ]; then
    bun node_modules/bunrise/out/cli/build.js
elif [ "$1" = "start" ]; then
    bun node_modules/bunrise/out/cli/start.js
else
    echo "error: script not found $1"
fi
