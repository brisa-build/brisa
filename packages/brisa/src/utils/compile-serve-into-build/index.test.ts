import { expect, it, describe, beforeEach, afterEach, spyOn } from 'bun:test';
import path from 'node:path';
import fs from 'node:fs';
import compileServeIntoBuild from '.';

const BUILD_DIR = path.join(import.meta.dirname, 'out');
const SERVE_FILE = path.join(
  import.meta.dir,
  '..',
  '..',
  '..',
  'out',
  'cli',
  'serve',
  'index.js',
);
const mockConstants = {
  BUILD_DIR,
  WORKSPACE: BUILD_DIR,
  LOG_PREFIX: { INFO: 'INFO' } as any,
  CONFIG: { output: 'node' },
  ROOT_DIR: import.meta.dirname,
} as any;
let mockLog: ReturnType<typeof spyOn>;

describe('utils/compileServeIntoBuild', () => {
  beforeEach(() => {
    mockLog = spyOn(console, 'log');
    globalThis.mockConstants = mockConstants;
    fs.mkdirSync(BUILD_DIR);
  });

  afterEach(() => {
    mockLog.mockRestore();
    delete globalThis.mockConstants;
    fs.rmSync(BUILD_DIR, { recursive: true, force: true });
  });

  // Note: this test require Brisa build process first
  it('should compile the server with hardcoded ROOT_DIR, WORKSPACE and BUILD_DIR', async () => {
    await compileServeIntoBuild(SERVE_FILE);
    const server = fs.readFileSync(path.join(BUILD_DIR, 'server.js'), 'utf-8');
    expect(server).toContain(mockConstants.ROOT_DIR);
    expect(server).toContain(mockConstants.BUILD_DIR);
    expect(server).toContain(mockConstants.WORKSPACE);
  });
});
