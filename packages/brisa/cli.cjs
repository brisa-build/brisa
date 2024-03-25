#!/usr/bin/env bun
import cp from "child_process";
import path from "node:path";
import fs from "node:fs";
import crypto from "node:crypto";

const outPath = path.join(import.meta.dir, 'out');
const buildFilepath = path.join(outPath, 'cli', 'build.js');
const serveFilepath = path.join(outPath, 'cli', 'serve', 'index.js');
const MOBILE_OUTPUTS = new Set(["android", "ios"]);
const TAURI_OUTPUTS = new Set(["android", "ios", "desktop"]);

export async function main() {
  const packageJSON = await import(path.join(process.cwd(), "package.json")).then(m => m.default);
  const __CRYPTO_KEY__ = crypto.randomBytes(32).toString("hex");
  const __CRYPTO_IV__ = crypto.randomBytes(8).toString("hex");
  const BRISA_BUILD_FOLDER =
    process.env.BRISA_BUILD_FOLDER || path.join(process.cwd(), "build");

  const prodOptions = {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "production", BRISA_BUILD_FOLDER, __CRYPTO_KEY__, __CRYPTO_IV__ },
  };
  const devOptions = {
    stdio: "inherit",
    env: { ...process.env, NODE_ENV: "development", BRISA_BUILD_FOLDER, __CRYPTO_KEY__, __CRYPTO_IV__ },
  };

  let BUN_EXEC;
  let BUNX_EXEC;
  let IS_TAURI_APP = false; // default value depends on brisa.config.ts
  let OUTPUT = 'server'

  // Check if is desktop app
  try {
    const config = await import(path.join(process.cwd(), "brisa.config.ts")).then(m => m.default);
    const hasOutput = typeof config.output === "string" 

    if (hasOutput) {
      OUTPUT = config.output;
      IS_TAURI_APP = TAURI_OUTPUTS.has(OUTPUT);
    }
  } catch (error) {}

  try {
    // Check if 'bun' is available in the system
    const bunCheck = cp.spawnSync("bun", ["--version"], { stdio: "ignore" });
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
          case "--skip-tauri":
          case "-s":
            IS_TAURI_APP = false;
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
              " -s, --skip-tauri Skip open desktop app when 'output': 'desktop' in brisa.config.ts",
            );
            console.log(" --help             Show help");
            return process.exit(0);
        }
      }

      const buildCommand = [buildFilepath, "DEV"];
      const serveCommand = [serveFilepath, PORT.toString(), "DEV"];

      // DEV mode for desktop app
      if (IS_TAURI_APP) {
        const devTauriCommand = ["tauri", "dev", "--port", PORT.toString()];

        if(MOBILE_OUTPUTS.has(OUTPUT)) {
          devTauriCommand.splice(1, 0, OUTPUT)
        }

        await initTauri(devOptions, PORT);
        cp.spawnSync(BUN_EXEC, buildCommand, devOptions);
        cp.spawn(BUN_EXEC, serveCommand, devOptions);
        cp.spawnSync(BUNX_EXEC, devTauriCommand, devOptions);
      } else if (DEBUG_MODE) {
        cp.spawnSync(BUN_EXEC, buildCommand, devOptions);
        cp.spawnSync(BUN_EXEC, ["--inspect", ...serveCommand], devOptions);
      } else {
        cp.spawnSync(BUN_EXEC, buildCommand, devOptions);
        cp.spawnSync(BUN_EXEC, serveCommand, devOptions);
      }
    }

    // Command: brisa build
    else if (process.argv[2] === "build") {
      for (let i = 3; i < process.argv.length; i++) {
        switch (process.argv[i]) {
          case "--skip-tauri":
          case "-s":
            IS_TAURI_APP = false;
            break;
          case "--help":
            console.log("Usage: brisa build [options]");
            console.log("Options:");
            console.log(
              " -s, --skip-tauri Skip open tauri app when 'output': 'desktop' | 'android' | 'ios' in brisa.config.ts",
            );
            console.log(" --help             Show help");
            return process.exit(0);
        }
      }

      if (IS_TAURI_APP) {
        const tauriCommand = ["tauri", "build"];

        if(MOBILE_OUTPUTS.has(OUTPUT)) {
          tauriCommand.splice(1, 0, OUTPUT)
        }

        await initTauri(prodOptions);
        cp.spawnSync(BUN_EXEC, [buildFilepath, "PROD"], prodOptions);
        cp.spawnSync(BUNX_EXEC, tauriCommand, prodOptions);
      } else {
        cp.spawnSync(BUN_EXEC, [buildFilepath, "PROD"], prodOptions);
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
            return process.exit(0);
        }
      }

      cp.spawnSync(
        BUN_EXEC,
        [serveFilepath, PORT.toString(), "PROD"],
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
      return process.exit(0);
    }
  } catch (error) {
    console.error("Error:", error.message);
    return process.exit(1);
  }

  async function initTauri(options = devOptions, port = 3000) {
    const tauriConfigPath = path.join(process.cwd(), "src-tauri", "tauri.conf.json");
    const existsTauri = fs.existsSync(tauriConfigPath)
    const isMobile = MOBILE_OUTPUTS.has(OUTPUT);

    if (!packageJSON?.dependencies?.["@tauri-apps/cli"]) {
      console.log("Installing @tauri-apps/cli...");
      cp.spawnSync(BUN_EXEC, ["i", "@tauri-apps/cli@2.0.0-beta.8"], options);
    }

    if(existsTauri && isMobile) {
      cp.spawnSync(BUNX_EXEC, ['tauri', OUTPUT, 'init'], options);
    }

    if(existsTauri) return

    const name = packageJSON?.name ?? "my-app";
    const initTauriCommand = [
      "tauri",
      "init",
      "-A",
      name,
      "-W",
      name,
      "-D",
      "../out",
      "--dev-url",
      `http://localhost:${port}`,
      "--before-dev-command",
      `echo 'Starting ${OUTPUT} app...'`,
      "--before-build-command",
      `echo 'Building ${OUTPUT} app...'`,
    ];

    console.log("Initializing Tauri...");
    cp.spawnSync(BUNX_EXEC, initTauriCommand, options);

    if (!fs.existsSync(tauriConfigPath)) return

    const tauriConf = await import(tauriConfigPath).then((m) => m.default);

    // change the bundle identifier in `tauri.conf.json > identifier` to `com.${name}`
    tauriConf.identifier = `com.${name}`;
    fs.writeFileSync(
      tauriConfigPath,
      JSON.stringify(tauriConf, null, 2),
    );

    if(isMobile) {
      cp.spawnSync(BUNX_EXEC, ['tauri', OUTPUT, 'init'], options);
    }
  }
}

if (import.meta.main) main();
