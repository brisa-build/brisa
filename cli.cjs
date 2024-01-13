#!/usr/bin/env bun
const { spawnSync } = require("child_process");
const path = require("node:path");

const BRISA_BUILD_FOLDER =
  process.env.BRISA_BUILD_FOLDER || path.join(process.cwd(), "build");

const prodOptions = {
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "production", BRISA_BUILD_FOLDER },
};
const devOptions = {
  stdio: "inherit",
  env: { ...process.env, NODE_ENV: "development", BRISA_BUILD_FOLDER },
};

let BUN_EXEC;

try {
  // Check if 'bun' is available in the system
  const bunCheck = spawnSync("bun", ["--version"], { stdio: "ignore" });
  if (bunCheck.status === 0) {
    BUN_EXEC = "bun";
  } else {
    BUN_EXEC = `${process.env.HOME}/.bun/bin/bun`;
  }

  // Command: brisa dev
  if (process.argv[2] === "dev") {
    let PORT = 3000; // default port
    let DEBUG_MODE = false; // default debug mode

    for (let i = 3; i < process.argv.length; i++) {
      switch (process.argv[i]) {
        case "-p":
        case "--port":
          PORT = process.argv[i + 1];
          i++;
          break;
        case "-d":
        case "--debug":
          DEBUG_MODE = true;
          break;
        case "--help":
          console.log("Usage: brisa dev [options]");
          console.log("Options:");
          console.log(" -p, --port    Specify port");
          console.log(" -d, --debug   Enable debug mode");
          console.log(" --help        Show help");
          process.exit(0);
      }
    }

    const buildCommand = ["node_modules/brisa/out/cli/build.js", "DEV"];
    const serveCommand = [
      "node_modules/brisa/out/cli/serve/index.js",
      `${PORT}`,
      "DEV",
    ];

    if (DEBUG_MODE) {
      spawnSync(BUN_EXEC, buildCommand, devOptions);
      spawnSync(BUN_EXEC, ["--inspect", ...serveCommand], devOptions);
    } else {
      spawnSync(BUN_EXEC, buildCommand, devOptions);
      spawnSync(BUN_EXEC, serveCommand, devOptions);
    }
  }

  // Command: brisa build
  else if (process.argv[2] === "build") {
    spawnSync(
      BUN_EXEC,
      ["node_modules/brisa/out/cli/build.js", "PROD"],
      prodOptions,
    );
  }

  // Command: brisa start
  else if (process.argv[2] === "start") {
    let PORT = 3000; // default port

    for (let i = 3; i < process.argv.length; i++) {
      switch (process.argv[i]) {
        case "-p":
        case "--port":
          PORT = process.argv[i + 1];
          i++;
          break;
        case "--help":
          console.log("Usage: brisa start [options]");
          console.log("Options:");
          console.log(" -p, --port    Specify port");
          console.log(" --help        Show help");
          process.exit(0);
      }
    }

    spawnSync(
      BUN_EXEC,
      ["node_modules/brisa/out/cli/serve/index.js", `${PORT}`, "PROD"],
      prodOptions,
    );
  }

  // Command: brisa --help
  else {
    console.log("Command not found");
    console.log("Usage: brisa <command> [options]");
    console.log("Commands:");
    console.log(" dev           Start development server");
    console.log(" build         Build for production");
    console.log(" start         Start production server");
    console.log("Options:");
    console.log(" --help        Show help");
    console.log(
      " --port        Specify port (applicable for dev and start commands)",
    );
    process.exit(0);
  }
} catch (error) {
  console.error("Error:", error.message);
  process.exit(1);
}
