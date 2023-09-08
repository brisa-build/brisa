#!/bin/bash

if [ "$1" = "dev" ]; then
    bun --hot node_modules/bunrise/out/cli/serve.js development
elif [ "$1" = "build" ]; then
    bun node_modules/bunrise/out/cli/build.js
elif [ "$1" = "start" ]; then
    bun node_modules/bunrise/out/cli/serve.js production
else
    echo "error: script not found $1"
fi
