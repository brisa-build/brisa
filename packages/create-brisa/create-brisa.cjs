#!/usr/bin/env bun

const fs = require("node:fs");
const { execSync } = require("node:child_process");
const readline = require("node:readline");

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("Enter project name: ", (PROJECT_NAME) => {
  rl.close();

  console.log(`Creating project ${PROJECT_NAME}`);
  fs.mkdirSync(PROJECT_NAME);
  process.chdir(PROJECT_NAME);

  const BRISA_VERSION = "0.0.56";

  console.log("\n🛠️  Installing brisa...\n");

  const packageJsonContent = {
    name: PROJECT_NAME,
    module: "src/pages/index.tsx",
    type: "module",
    scripts: {
      dev: "brisa dev",
      "dev:debug": "brisa dev --debug",
      build: "brisa build",
      start: "brisa start",
    },
    dependencies: {
      brisa: BRISA_VERSION,
    },
    devDependencies: {
      "@types/bun": "latest",
    },
    peerDependencies: {
      typescript: "latest",
    },
  };

  fs.writeFileSync("package.json", JSON.stringify(packageJsonContent, null, 2));

  const tsConfigContent = {
    compilerOptions: {
      baseUrl: "./src",
      lib: ["dom", "dom.iterable", "esnext"],
      module: "esnext",
      target: "esnext",
      moduleResolution: "bundler",
      moduleDetection: "force",
      allowImportingTsExtensions: true,
      noEmit: true,
      composite: true,
      strict: true,
      downlevelIteration: true,
      skipLibCheck: true,
      jsx: "react-jsx",
      jsxImportSource: "brisa",
      allowSyntheticDefaultImports: true,
      forceConsistentCasingInFileNames: true,
      allowJs: true,
      verbatimModuleSyntax: true,
      noFallthroughCasesInSwitch: true,
      types: ["brisa"],
      paths: {
        "@/*": ["*"],
      },
    },
  };

  fs.writeFileSync("tsconfig.json", JSON.stringify(tsConfigContent, null, 2));

  const readmeContent = `# ${PROJECT_NAME}

Project created with [Brisa](https://github.com/brisa-build/brisa).

## Getting Started

### Installation

\`\`\`bash
bun install
\`\`\`

### Development

\`\`\`bash
bun dev
\`\`\`

### Build

\`\`\`bash
bun build
\`\`\`

### Start

\`\`\`bash
bun start
\`\`\`

`;

  fs.writeFileSync("README.md", readmeContent);

  fs.mkdirSync("src");
  fs.mkdirSync("src/pages");
  fs.writeFileSync(
    "src/pages/index.tsx",
    `export default function Homepage() {
  return (
    <div>
      <h1>Hello World</h1>
    </div>
  );
}`,
  );

  fs.writeFileSync("bunfig.toml", '[test]\npreload = "brisa/test"');

  fs.writeFileSync(".gitignore", "build\nnode_modules\nout\n");

  execSync("bun install");

  process.chdir("..");

  console.log("\n✨ Project created successfully\n");
  console.log(`📀 Run: cd ${PROJECT_NAME} && bun dev`);
});
