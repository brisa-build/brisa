#!/bin/bash

if command -v bun >/dev/null 2>&1; then
  BUN_EXEC="bun"
else
  BUN_EXEC="~/.bun/bin/bun"
fi

# brisa dev
if [ "$1" = "dev" ]; then
  PORT=3000 # default port
  DEBUG_MODE=false # default debug mode

  while [[ $# -gt 0 ]]; do
    case $1 in
      -p|--port)
        PORT="$2"
        shift
        ;;
      -d|--debug)
        DEBUG_MODE=true
        ;;
      --help)
        echo "Usage: brisa dev [options]"
        echo
        echo "Options:"
        echo " -p, --port    Specify port"
        echo " -d, --debug   Enable debug mode"
        echo " --help        Show help"
        exit 0
        ;;
    esac
    shift
  done
   if [ "$DEBUG_MODE" = true ]; then
    NODE_ENV=development $BUN_EXEC node_modules/brisa/out/cli/build.js DEV && NODE_ENV=development $BUN_EXEC --inspect node_modules/brisa/out/cli/serve/index.js $PORT DEV
  else
    NODE_ENV=development $BUN_EXEC node_modules/brisa/out/cli/build.js DEV && NODE_ENV=development $BUN_EXEC node_modules/brisa/out/cli/serve/index.js $PORT DEV
  fi

# brisa build
elif [ "$1" = "build" ]; then
  NODE_ENV=production $BUN_EXEC node_modules/brisa/out/cli/build.js PROD

# brisa start
elif [ "$1" = "start" ]; then
 PORT=3000 # default port

  while [[ $# -gt 0 ]]; do
    case $1 in
      -p|--port)
        PORT="$2"
        shift
        ;;
      --help)
        echo "Usage: brisa start [options]"
        echo
        echo "Options:"
        echo " -p, --port    Specify port"
        echo " --help        Show help"
        exit 0
        ;;
    esac
    shift
  done
  NODE_ENV=production $BUN_EXEC node_modules/brisa/out/cli/serve/index.js $PORT PROD

# brisa --help
else
  echo "Command not found"
  echo "Usage: brisa <command> [options]"
  echo
  echo "Commands:"
  echo " dev           Start development server"
  echo " build         Build for production"
  echo " start         Start production server"
  echo
  echo "Options:"
  echo " --help        Show help"
  echo " --port        Specify port (applicable for dev and start commands)"
  echo
  exit 0
fi
