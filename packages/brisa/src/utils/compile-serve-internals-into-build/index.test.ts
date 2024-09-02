import { expect, it, describe, beforeEach, afterEach, spyOn } from 'bun:test';
import path from 'node:path';
import fs from 'node:fs';
import compileBrisaInternalsToDoBuildPortable from '.';

const BUILD_DIR = path.join(import.meta.dirname, 'out');
const BRISA_ROOT = path.join(import.meta.dir, '..', '..', '..');
const mockConstants = {
  BUILD_DIR,
  VERSION: 'x.y.z',
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

  it('should compile the server with defined IS_PRODUCTION, IS_SERVE_PROCESS and IS_STANDALONE_SERVER', async () => {
    await compileBrisaInternalsToDoBuildPortable(BRISA_ROOT);
    const server = fs.readFileSync(path.join(BUILD_DIR, 'server.js'), 'utf-8');

    // doesn't exist in the code anymore, now is defined in the build process
    expect(server).not.toContain('process.env.IS_STANDALONE_SERVER');
    expect(server).not.toContain('process.env.IS_SERVE_PROCESS');
    expect(server).not.toContain('process.env.IS_PROD');
    expect(mockLog.mock.calls.flat().join()).toContain(
      'Node.js Server compiled into build folder',
    );
  });

  it('should work with Bun.js runtime', async () => {
    mockConstants.CONFIG.output = 'bun';
    await compileBrisaInternalsToDoBuildPortable(BRISA_ROOT);
    const server = fs.readFileSync(path.join(BUILD_DIR, 'server.js'), 'utf-8');

    // doesn't exist in the code anymore, now is defined in the build process
    expect(server).not.toContain('process.env.IS_STANDALONE_SERVER');
    expect(server).not.toContain('process.env.IS_SERVE_PROCESS');
    expect(server).not.toContain('process.env.IS_PROD');
    expect(mockLog.mock.calls.flat().join()).toContain(
      'Bun.js Server compiled into build folder',
    );
  });

  it('should build brisa.config.js', async () => {
    fs.writeFileSync(path.join(import.meta.dirname, 'brisa.config.js'), '');
    await compileBrisaInternalsToDoBuildPortable(BRISA_ROOT);

    fs.rmSync(path.join(import.meta.dirname, 'brisa.config.js'));
    expect(fs.existsSync(path.join(BUILD_DIR, 'brisa.config.js'))).toBeTrue();
    expect(fs.existsSync(path.join(BUILD_DIR, 'server.js'))).toBeTrue();
  });

  it('should create a package.json in Bun.js', async () => {
    await compileBrisaInternalsToDoBuildPortable(BRISA_ROOT);
    expect(
      JSON.parse(
        fs.readFileSync(path.join(BUILD_DIR, 'package.json'), 'utf-8'),
      ),
    ).toEqual({
      name: 'brisa-app',
      version: '0.0.1',
      type: 'module',
      main: 'server.js',
      private: true,
      scripts: {
        start: `bun run server.js`,
      },
      dependencies: {
        brisa: 'x.y.z',
      },
    });
  });

  it('should create a package.json in Node.js', async () => {
    mockConstants.CONFIG.output = 'node';
    await compileBrisaInternalsToDoBuildPortable(BRISA_ROOT);
    expect(
      JSON.parse(
        fs.readFileSync(path.join(BUILD_DIR, 'package.json'), 'utf-8'),
      ),
    ).toEqual({
      name: 'brisa-app',
      version: '0.0.1',
      type: 'module',
      main: 'server.js',
      private: true,
      scripts: {
        start: `node server.js`,
      },
      dependencies: {
        brisa: 'x.y.z',
      },
    });
  });

  it('should create the brisa module with all the files', async () => {
    await compileBrisaInternalsToDoBuildPortable(BRISA_ROOT);

    const brisaModulePath = path.join(BUILD_DIR, 'node_modules', 'brisa');
    expect(fs.existsSync(brisaModulePath)).toBeTrue();

    const files = fs.readdirSync(brisaModulePath).toSorted();

    expect(files).toEqual([
      'index.js',
      'jsx-dev-runtime.js',
      'jsx-runtime.js',
      'package.json',
      'server-node.js',
      'server.js',
    ]);

    expect(
      JSON.parse(
        fs.readFileSync(path.join(brisaModulePath, 'package.json'), 'utf-8'),
      ),
    ).toEqual({
      name: 'brisa',
      version: 'x.y.z',
      type: 'module',
      main: 'index.js',
      private: true,
      exports: {
        '.': {
          bun: './index.js',
          import: './index.js',
          node: './index.js',
          require: './index.js',
        },
        './jsx-dev-runtime': {
          bun: './jsx-dev-runtime.js',
          import: './jsx-dev-runtime.js',
          node: './jsx-dev-runtime.js',
          require: './jsx-dev-runtime.js',
        },
        './jsx-runtime': {
          bun: './jsx-runtime.js',
          import: './jsx-runtime.js',
          node: './jsx-runtime.js',
          require: './jsx-runtime.js',
        },
        './server': {
          bun: './server.js',
          import: './server.js',
          node: './server.js',
          require: './server.js',
        },
        './server/node': {
          bun: './server-node.js',
          import: './server-node.js',
          node: './server-node.js',
          require: './server-node.js',
        },
      },
    });
  });

  it('should define process.env.CSS_TRANSFORMER_WASM to "false"', async () => {
    const servePath = path.join(import.meta.dirname, 'out', 'cli', 'serve');
    fs.mkdirSync(servePath, { recursive: true });
    fs.writeFileSync(
      path.join(servePath, 'index.js'),
      'console.log(process.env.CSS_TRANSFORMER_WASM)',
    );
    await compileBrisaInternalsToDoBuildPortable(import.meta.dirname);
    const server = fs.readFileSync(path.join(BUILD_DIR, 'server.js'), 'utf-8');
    expect(server).toContain('console.log(false);');
  });
});
