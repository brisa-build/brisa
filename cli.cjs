#!/usr/bin/env bun
const { spawnSync } = require("child_process");
const path = require("node:path");
const fs = require("node:fs");
const packageJSON = await import(path.join(process.cwd(), "package.json")).then(
  (m) => m.default,
);

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
let BUNX_EXEC;
let IS_DESKTOP_APP = false; // default value depends on brisa.config.ts

// Check if is desktop app
try {
  const config = await import(path.join(process.cwd(), "brisa.config.ts")).then(
    (m) => m.default,
  );

  IS_DESKTOP_APP =
    typeof config.output === "string" && config.output === "desktop";
} catch (error) {}

try {
  // Check if 'bun' is available in the system
  const bunCheck = spawnSync("bun", ["--version"], { stdio: "ignore" });
  if (bunCheck.status === 0) {
    BUN_EXEC = "bun";
    BUNX_EXEC = "bunx";
  } else {
    BUN_EXEC = `${process.env.HOME}/.bun/bin/bun`;
    BUNX_EXEC = `${process.env.HOME}/.bun/bin/bunx`;
  }

  // Command: brisa dev
  if (process.argv[2] === "dev") {
    let PORT = 3000; // default port
    let DEBUG_MODE = false; // default debug mode

    for (let i = 3; i < process.argv.length; i++) {
      switch (process.argv[i]) {
        case "--skip-desktop":
        case "-s":
          IS_DESKTOP_APP = false;
          break;
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
          console.log(" -p, --port         Specify port");
          console.log(" -d, --debug        Enable debug mode");
          console.log(
            " -s, --skip-desktop Skip open desktop app when 'output': 'desktop' in brisa.config.ts",
          );
          console.log(" --help             Show help");
          process.exit(0);
      }
    }

    const buildCommand = ["node_modules/brisa/out/cli/build.js", "DEV"];
    const serveCommand = [
      "node_modules/brisa/out/cli/serve/index.js",
      `${PORT}`,
      "DEV",
    ];

    // DEV mode for desktop app
    if (IS_DESKTOP_APP) {
      await initTauri();
      spawnSync(BUNX_EXEC, "tauri dev --port 3000".split(" "), devOptions);
    } else if (DEBUG_MODE) {
      spawnSync(BUN_EXEC, buildCommand, devOptions);
      spawnSync(BUN_EXEC, ["--inspect", ...serveCommand], devOptions);
    } else {
      spawnSync(BUN_EXEC, buildCommand, devOptions);
      spawnSync(BUN_EXEC, serveCommand, devOptions);
    }
  }

  // Command: brisa build
  else if (process.argv[2] === "build") {
    for (let i = 3; i < process.argv.length; i++) {
      switch (process.argv[i]) {
        case "--skip-desktop":
        case "-s":
          IS_DESKTOP_APP = false;
          break;
        case "--help":
          console.log("Usage: brisa build [options]");
          console.log("Options:");
          console.log(
            " -s, --skip-desktop Skip open desktop app when 'output': 'desktop' in brisa.config.ts",
          );
          console.log(" --help             Show help");
          process.exit(0);
      }
    }

    if (IS_DESKTOP_APP) {
      await initTauri();
      spawnSync(BUNX_EXEC, ["tauri", "build"], devOptions);
    } else {
      spawnSync(
        BUN_EXEC,
        ["node_modules/brisa/out/cli/build.js", "PROD"],
        prodOptions,
      );
    }
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

async function initTauri() {
  if (!packageJSON.dependencies["@tauri-apps/cli"]) {
    console.log("Installing @tauri-apps/cli...");
    spawnSync(BUN_EXEC, ["i", "@tauri-apps/cli"], devOptions);
  }

  if (
    !fs.existsSync(path.join(process.cwd(), "src-tauri", "tauri.conf.json"))
  ) {
    const name = packageJSON.name ?? "my-app";
    const initTauriCommand = [
      "tauri",
      "init",
      "-A",
      name,
      "-W",
      name,
      "-D",
      "../out",
      "--dev-path",
      "http://localhost:3000",
      "--before-dev-command",
      "bun dev -- -s",
      "--before-build-command",
      "bun run build -- -s",
    ];

    console.log("Initializing Tauri...");
    spawnSync(BUNX_EXEC, initTauriCommand, devOptions);

    const tauriConf = await import(
      path.join(process.cwd(), "src-tauri", "tauri.conf.json")
    ).then((m) => m.default);

    // change the bundle identifier in `tauri.conf.json > tauri > bundle > identifier` to `com.${name}`
    tauriConf.tauri.bundle.identifier = `com.${name}`;
    fs.writeFileSync(
      path.join(process.cwd(), "src-tauri", "tauri.conf.json"),
      JSON.stringify(tauriConf, null, 2),
    );
  }
}
