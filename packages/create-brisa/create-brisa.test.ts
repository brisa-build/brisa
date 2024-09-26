import { describe, it, expect, afterEach } from 'bun:test';
import { $ } from 'bun';
import { join } from 'node:path';
import fs from 'node:fs';

const CREATE_BRISA_PATH = join(import.meta.dir, 'create-brisa.cjs');
const EXPECTED_INNER_FILES = [
  'bun.lockb',
  'bunfig.toml',
  'node_modules',
  'package.json',
  'README.md',
  'src',
  'tsconfig.json',
];

describe('create-brisa', () => {
  afterEach(async () => {
    const files = fs.readdirSync('.');
    if (files.includes('out')) await $`rm -rf out`;
    if (files.some((f) => f.startsWith('with-'))) await $`rm -rf with-*`;
  });

  it("should create brisa correctly with the name of the project as 'out'", async () => {
    const projectName = 'out';
    await $`echo "${projectName}" | bun run ${CREATE_BRISA_PATH}`;
    const files = await getFiles(projectName);
    expect(files).toEqual(EXPECTED_INNER_FILES);
  });

  it('should create brisa correctly with the name of the project as argv', async () => {
    const projectName = 'out';
    await $`bun run ${CREATE_BRISA_PATH} ${projectName}`;
    const files = await getFiles(projectName);
    expect(files).toEqual(EXPECTED_INNER_FILES);
  });

  it('should exit and display an error if the folder exists', async () => {
    fs.mkdirSync('out');
    const projectName = 'out/foo';
    const res = await $`echo "${projectName}" | bun run ${CREATE_BRISA_PATH}`;

    expect(res.stderr.toString()).toBe('Error: out folder already exists\n');
  });

  it("should create brisa correctly with multi-folder with the name 'out/@foo/bar/baz'", async () => {
    const projectName = join('out', '@foo', 'bar', 'baz');
    await $`echo "${projectName}" | bun run ${CREATE_BRISA_PATH}`;
    const files = await getFiles(projectName);
    expect(files).toEqual(EXPECTED_INNER_FILES);
  });

  it('should "bun create brisa --example" list the examples', async () => {
    const res = await $`echo 0 | bun run ${CREATE_BRISA_PATH} --example`;
    const out = res.stdout.toString();
    expect(res.exitCode).toBe(0);
    expect(out).toContain(
      'Choose an example:\n\t0. Exit\n\t1. with-api-routes\n\t2. with-external-web-component\n\t3. with-i18n\n\t4. with-middleware\n\t5. with-sqlite\n\t6. with-tailwind\nEnter the number of the example: ',
    );
    expect(out).toContain('Bye!');
  });

  it('should "bun create brisa --example" list the examples', async () => {
    await $`echo 1 | bun run ${CREATE_BRISA_PATH} --example`;
    expect(fs.existsSync(join('with-api-routes', 'src', 'api'))).toBeTrue();
  });

  it('should "bun create brisa --example with-api-routes" copy the example correctly', async () => {
    await $`bun run ${CREATE_BRISA_PATH} --example with-api-routes`;
    expect(fs.existsSync(join('with-api-routes', 'src', 'api'))).toBeTrue();
  });
});

async function getFiles(projectName: string): Promise<string[]> {
  return (await $`ls ${projectName}`.text())
    .split('\n')
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b));
}
