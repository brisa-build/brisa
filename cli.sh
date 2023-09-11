#!/bin/bash

if command -v bun >/dev/null 2>&1; then
  BUN_EXEC="bun"
else
  BUN_EXEC="~/.bun/bin/bun"
fi

# bunrise dev
if [ "$1" = "dev" ]; then
  PORT=3000 # default port

  while [[ $# -gt 0 ]]; do
    case $1 in
      -p|--port)
        PORT="$2"
        shift
        ;;
      --help)
        echo "Usage: bunrise dev [options]"
        echo
        echo "Options:"
        echo " -p, --port    Specify port"
        echo " --help        Show help"
        exit 0
        ;;
    esac
    shift
  done
  NODE_ENV=development $BUN_EXEC --hot node_modules/bunrise/out/cli/dev/serve.js $PORT

# bunrise build
elif [ "$1" = "build" ]; then
  NODE_ENV=production $BUN_EXEC node_modules/bunrise/out/cli/build.js  

# bunrise start
elif [ "$1" = "start" ]; then
 PORT=3000 # default port

  while [[ $# -gt 0 ]]; do
    case $1 in
      -p|--port)
        PORT="$2"
        shift
        ;;
      --help)
        echo "Usage: bunrise start [options]"
        echo
        echo "Options:"
        echo " -p, --port    Specify port"
        echo " --help        Show help"
        exit 0
        ;;
    esac
    shift
  done
  NODE_ENV=production $BUN_EXEC node_modules/bunrise/out/cli/serve.js $PORT

# bunrise --help
else
  echo "Command not found"
  echo "Usage: bunrise <command> [options]"
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
