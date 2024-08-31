import { expect, it, describe, beforeEach, afterEach, spyOn } from 'bun:test';
import path from 'node:path';
import fs from 'node:fs';
import compileBrisaInternalsToDoBuildPortable from '.';

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
  IS_PRODUCTION: true,
} as any;
let mockLog: ReturnType<typeof spyOn>;

// Note: these tests require Brisa build process first
describe('utils/compileServeInternalsIntoBuild', () => {
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

  it('should compile the server with hardcoded ROOT_DIR, WORKSPACE and BUILD_DIR', async () => {
    await compileBrisaInternalsToDoBuildPortable(SERVE_FILE);
    const server = fs.readFileSync(path.join(BUILD_DIR, 'server.js'), 'utf-8');
    expect(server).toContain(mockConstants.ROOT_DIR);
    expect(server).toContain(mockConstants.BUILD_DIR);
    expect(server).toContain(mockConstants.WORKSPACE);
    expect(mockLog.mock.calls.flat().join()).toContain(
      'Node.js Server compiled into build folder',
    );
  });

  it('should work with Bun.js runtime', async () => {
    mockConstants.CONFIG.output = 'bun';
    await compileBrisaInternalsToDoBuildPortable(SERVE_FILE);
    const server = fs.readFileSync(path.join(BUILD_DIR, 'server.js'), 'utf-8');
    expect(server).toContain(mockConstants.ROOT_DIR);
    expect(server).toContain(mockConstants.BUILD_DIR);
    expect(server).toContain(mockConstants.WORKSPACE);
    expect(mockLog.mock.calls.flat().join()).toContain(
      'Bun.js Server compiled into build folder',
    );
  });

  it('should build brisa.config.js', async () => {
    fs.writeFileSync(path.join(import.meta.dirname, 'brisa.config.js'), '');
    await compileBrisaInternalsToDoBuildPortable(SERVE_FILE);

    fs.rmSync(path.join(import.meta.dirname, 'brisa.config.js'));
    expect(fs.existsSync(path.join(BUILD_DIR, 'brisa.config.js'))).toBeTrue();
    expect(fs.existsSync(path.join(BUILD_DIR, 'server.js'))).toBeTrue();
  });
});
