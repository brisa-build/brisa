import fs from "node:fs";
import { join } from "node:path";
import packageJSON from "../package.json";
import brisaPackageJSON from "../packages/brisa/package.json";
import createBrisaPackageJSON from "../packages/create-brisa/package.json";
import docsPackageJSON from "../packages/docs/package.json";

const currentVersion = packageJSON.version;
const version = prompt(
  `Introduce the new version of Brisa (now ${currentVersion}): `,
);

if (
  !version ||
  currentVersion === version ||
  !Bun.semver.satisfies(version, ">= 0.0.0") ||
  [currentVersion, version].sort(Bun.semver.order)[0] !== currentVersion
) {
  console.error("Invalid version, must be greater than the current one.");
  process.exit(1);
}

// Root monorepo package.json
packageJSON.version = version;
fs.writeFileSync(
  join(import.meta.dir, "..", "package.json"),
  JSON.stringify(packageJSON, null, 2),
);

// Brisa package.json
brisaPackageJSON.version = version;
fs.writeFileSync(
  join(import.meta.dir, "..", "packages", "brisa", "package.json"),
  JSON.stringify(brisaPackageJSON, null, 2),
);

// Create Brisa package.json
createBrisaPackageJSON.version = version;
fs.writeFileSync(
  join(import.meta.dir, "..", "packages", "create-brisa", "package.json"),
  JSON.stringify(createBrisaPackageJSON, null, 2),
);

// Docs package.json
docsPackageJSON.version = version;
fs.writeFileSync(
  join(import.meta.dir, "..", "packages", "docs", "package.json"),
  JSON.stringify(docsPackageJSON, null, 2),
);

// Update Brisa CLI version
const createBrisaCLIPath = join(
  import.meta.dir,
  "..",
  "packages",
  "create-brisa",
  "create-brisa.cjs",
);
const createBrisaCLI = fs
  .readFileSync(createBrisaCLIPath)
  .toString()
  .replace(
    `BRISA_VERSION = "${currentVersion}";`,
    `BRISA_VERSION = "${version}";`,
  );

fs.writeFileSync(createBrisaCLIPath, createBrisaCLI);

console.log("Version updated successfully!");
