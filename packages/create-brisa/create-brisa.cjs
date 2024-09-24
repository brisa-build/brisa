#!/usr/bin/env bun

const fs = require('node:fs');
const path = require('node:path');
const { version } = require('./package.json');
const { execSync } = require('node:child_process');
const readline = require('node:readline');
const BRISA_VERSION = version;
const isPowerShell = process.env.PSModulePath !== undefined;
let PROJECT_NAME = process.argv[2];

if (!PROJECT_NAME) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  rl.question('Enter project name: ', (name) => {
    rl.close();
    PROJECT_NAME = name;
    createProject(PROJECT_NAME);
  });
} else {
  createProject(PROJECT_NAME);
}

function createProject(PROJECT_NAME) {
  console.log(`Creating project ${PROJECT_NAME}`);

  // Allow PROJECT_NAME to be a path like @foo/bar/baz
  const folders = PROJECT_NAME.split(path.sep);
  for (let i = 0; i < folders.length; i++) {
    const folder = folders.slice(0, i + 1).join(path.sep);
    if (!fs.existsSync(folder)) fs.mkdirSync(folder);
    else {
      console.error(`Error: ${folder} folder already exists`);
      process.exit(1);
    }
  }

  process.chdir(PROJECT_NAME);

  console.log('\n🛠️  Installing brisa...\n');

  const packageJsonContent = {
    name: PROJECT_NAME,
    module: 'src/pages/index.tsx',
    type: 'module',
    scripts: {
      dev: 'brisa dev',
      'dev:debug': 'brisa dev --debug',
      build: 'brisa build',
      start: 'brisa start',
    },
    dependencies: {
      brisa: BRISA_VERSION,
    },
    devDependencies: {
      '@types/bun': 'latest',
      typescript: 'latest',
    },
  };

  fs.writeFileSync('package.json', JSON.stringify(packageJsonContent, null, 2));

  const tsConfigContent = {
    compilerOptions: {
      baseUrl: './src',
      lib: ['dom', 'dom.iterable', 'esnext'],
      module: 'esnext',
      target: 'esnext',
      moduleResolution: 'bundler',
      moduleDetection: 'force',
      allowImportingTsExtensions: true,
      noEmit: true,
      composite: true,
      strict: true,
      downlevelIteration: true,
      skipLibCheck: true,
      jsx: 'react-jsx',
      jsxImportSource: 'brisa',
      allowSyntheticDefaultImports: true,
      forceConsistentCasingInFileNames: true,
      allowJs: true,
      verbatimModuleSyntax: true,
      noFallthroughCasesInSwitch: true,
      types: ['brisa'],
      paths: {
        '@/*': ['*'],
      },
    },
  };

  fs.writeFileSync('tsconfig.json', JSON.stringify(tsConfigContent, null, 2));

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

  fs.writeFileSync('README.md', readmeContent);

  fs.mkdirSync('src');
  fs.cpSync(path.join(import.meta.dirname, 'basic-template'), 'src', {
    recursive: true,
  });

  fs.writeFileSync('bunfig.toml', '[test]\npreload = "brisa/test"');

  fs.writeFileSync('.gitignore', 'build\nnode_modules\nout\n.vercel\n');

  execSync('bun install');

  process.chdir('..');

  console.log('\n✨ Project created successfully\n');
  console.log(
    `📀 Run: cd ${PROJECT_NAME}${isPowerShell ? ';' : ' &&'} bun dev`,
  );
}
