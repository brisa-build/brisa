import { readdirSync } from 'node:fs';
import path from 'node:path';
import { $, spawn } from 'bun';

const examples = readdirSync(
  path.join(import.meta.dir, '..', 'examples'),
).filter((d) => d.startsWith('with-'));

globalThis.examples = {};

for (const example of examples) {
  const { setup, teardown, origin } = prepareProject(example);
  globalThis.examples[example] = { origin, teardown };
  console.log(`\t→ Setting up ${example} example...`);
  await setup();
}

await Bun.sleep(2000);

function prepareProject(exampleName: string) {
  let serverProcess;

  globalThis.currentPort = globalThis.currentPort
    ? globalThis.currentPort + 1
    : 3000;

  async function setup() {
    const exampleDir = path.join(
      import.meta.dir,
      '..',
      'examples',
      exampleName,
    );

    console.log(`\t→ Setting up ${exampleName} example...`);
    await $`cd ${exampleDir} && bun i && bun run build`;

    serverProcess = spawn({
      cmd: ['bun', 'start', '-p', globalThis.currentPort.toString()],
      cwd: exampleDir,
      stdout: 'inherit',
      stderr: 'inherit',
    });
  }

  async function teardown() {
    console.log(`\t→ Tearing down ${exampleName} example...`);
    await serverProcess.kill('SIGINT');
  }

  return {
    setup,
    teardown,
    origin: `http://localhost:${globalThis.currentPort}`,
  };
}

process.on('exit', async () => {
  console.log('Tearing down all examples...');
  for (const example of examples) {
    await globalThis.examples[example].teardown();
  }
});
