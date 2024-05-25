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

  const BRISA_VERSION = "0.0.68";

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
  fs.mkdirSync("src/web-components");
  fs.mkdirSync("src/components");
  fs.writeFileSync(
    "src/pages/index.tsx",
    `import CounterServer from "@/components/counter-server";

export default function Homepage() {
  return (
    <div>
      <h1>Hello World</h1>
      <counter-client initialValue={42} />
      <CounterServer initialValue={37} />
    </div>
  );
}`,
  );

  fs.writeFileSync(
    "src/components/counter-server.tsx",
    `import type { RequestContext } from "brisa";
import { rerenderInAction } from "brisa/server";

export default function CounterServer(
  { initialValue = 0 }: { initialValue: number },
  { store, method }: RequestContext,
) {
  const isDuringActionRerender = method === "POST";

  if (!isDuringActionRerender) store.set("count", initialValue);

  store.transferToClient(["count"]);

  function increment() {
    store.set("count", store.get("count") + 1);
    rerenderInAction({ type: "page" });
  }

  function decrement() {
    store.set("count", store.get("count") - 1);
    rerenderInAction({ type: "page" });
  }

  return (
    <div>
      <h2>Server counter</h2>
      <button onClick={increment}>+</button>
      {store.get("count")}
      <button onClick={decrement}>-</button>
    </div>
  );
}`,
  );

  fs.writeFileSync(
    "src/pages/index.test.tsx",
    `import { render } from "brisa/test"
import { describe, expect, it } from "bun:test"
import Home from '.'

describe("Index", () => {
  it("should render Hello World",  async () => {
    const { container } = await render(<Home />)
    expect(container).toHaveTextContent("Hello World")
  })
});`,
  );

  fs.writeFileSync(
    "src/web-components/counter-client.tsx",
    `import type { WebContext } from "brisa";

export default function Counter(
  { initialValue = 0 }: { initialValue: number },
  { state }: WebContext,
) {
  const count = state(initialValue);

  return (
    <div>
      <h2>Client counter</h2>
      <button onClick={() => count.value++}>+</button>
      {count.value}
      <button onClick={() => count.value--}>-</button>
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
