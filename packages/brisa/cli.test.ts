import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  spyOn,
  mock,
  type Mock,
} from 'bun:test';
import { main } from './cli.cjs';
import cp from 'child_process';
import path from 'node:path';
import crypto from 'node:crypto';

const FIXTURES = path.join(import.meta.dir, 'src', '__fixtures__');
const MDX_PATH = path.join(
  import.meta.dir,
  'out',
  'cli',
  'integrations',
  'mdx.js',
);
const BUILD_PATH = path.join(import.meta.dir, 'out', 'cli', 'build.js');
const SERVE_PATH = path.join(
  import.meta.dir,
  'out',
  'cli',
  'serve',
  'index.js',
);

let originalArgv: string[];
let mockSpawnSync: Mock<typeof cp.spawnSync>;
let mockExit: Mock<typeof process.exit>;
let mockLog: Mock<typeof console.log>;
let mockCwd: Mock<typeof process.cwd>;
let mockRandomBytes: Mock<typeof crypto.randomBytes>;

const BRISA_BUILD_FOLDER = path.join(FIXTURES, 'build');

let prodOptions: any;
let devOptions: any;

describe('Brisa CLI', () => {
  beforeEach(() => {
    mockCwd = spyOn(process, 'cwd').mockImplementation(() => FIXTURES);
    mockLog = spyOn(console, 'log').mockImplementation(() => null as any);
    mockExit = spyOn(process, 'exit').mockImplementation(() => null as never);
    mockRandomBytes = spyOn(crypto, 'randomBytes').mockImplementation(
      (bytes) => {
        if (bytes === 32)
          return Buffer.from(
            '5bebff7019fdfa19101753db711317c351eb0a3cc30a1a2665da921d6b8e978c',
            'hex',
          );
        return Buffer.from('cb05305ec1f382be', 'hex');
      },
    );
    mockSpawnSync = spyOn(cp, 'spawnSync').mockImplementation(
      () => ({ status: 0 }) as any,
    );
    originalArgv = process.argv.slice();
    mock.module(path.join(FIXTURES, 'brisa.config.ts'), () => ({
      default: {
        output: 'server',
      },
    }));

    const __CRYPTO_KEY__ = crypto.randomBytes(32).toString('hex');
    const __CRYPTO_IV__ = crypto.randomBytes(8).toString('hex');

    prodOptions = {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        BRISA_BUILD_FOLDER,
        __CRYPTO_KEY__,
        __CRYPTO_IV__,
      },
    } as any;
    devOptions = {
      stdio: 'inherit',
      env: {
        ...process.env,
        NODE_ENV: 'development',
        BRISA_BUILD_FOLDER,
        __CRYPTO_KEY__,
        __CRYPTO_IV__,
      },
    } as any;
  });
  afterEach(() => {
    mockLog.mockRestore();
    mockExit.mockRestore();
    mockSpawnSync.mockRestore();
    mockCwd.mockRestore();
    mockRandomBytes.mockRestore();
    process.argv = originalArgv.slice();
  });

  it('should display the --help options', async () => {
    process.argv = ['bun', 'brisa', '--help'];

    await main();

    expect(mockSpawnSync).toHaveBeenCalledTimes(1); // bun --version
    expect(mockLog.mock.calls).toEqual([
      ['Command not found'],
      ['Usage: brisa <command> [options]'],
      ['Commands:'],
      [' dev           Start development server'],
      [' build         Build for production'],
      [' start         Start production server'],
      ['Options:'],
      [' --help        Show help'],
      [' --port        Specify port (applicable for dev and start commands)'],
    ]);
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should display --help when the command is not found', async () => {
    process.argv = ['bun', 'brisa', 'not-found'];

    await main();

    expect(mockSpawnSync).toHaveBeenCalledTimes(1); // bun --version
    expect(mockLog.mock.calls).toEqual([
      ['Command not found'],
      ['Usage: brisa <command> [options]'],
      ['Commands:'],
      [' dev           Start development server'],
      [' build         Build for production'],
      [' start         Start production server'],
      ['Options:'],
      [' --help        Show help'],
      [' --port        Specify port (applicable for dev and start commands)'],
    ]);
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should execute "brisa dev" command with default options', async () => {
    process.argv = ['bun', 'brisa', 'dev'];

    await main();

    expect(mockSpawnSync.mock.calls[0]).toEqual([
      'bun',
      ['--version'],
      { stdio: 'ignore' },
    ]);
    expect(mockSpawnSync.mock.calls[1]).toEqual([
      'bun',
      [BUILD_PATH, 'DEV'],
      devOptions,
    ]);
    expect(mockSpawnSync.mock.calls[2]).toEqual([
      'bun',
      [SERVE_PATH, '3000', 'DEV'],
      devOptions,
    ]);
  });

  it('should execute "brisa dev" command with custom port', async () => {
    process.argv = ['bun', 'brisa', 'dev', '--port', '5000'];

    await main();

    expect(mockSpawnSync.mock.calls[0]).toEqual([
      'bun',
      ['--version'],
      { stdio: 'ignore' },
    ]);
    expect(mockSpawnSync.mock.calls[1]).toEqual([
      'bun',
      [BUILD_PATH, 'DEV'],
      devOptions,
    ]);
    expect(mockSpawnSync.mock.calls[2]).toEqual([
      'bun',
      [SERVE_PATH, '5000', 'DEV'],
      devOptions,
    ]);
  });

  it('should return the help of "brisa dev" command', async () => {
    process.argv = ['bun', 'brisa', 'dev', '--help'];

    await main();

    expect(mockSpawnSync).toHaveBeenCalledTimes(1); // bun --version
    expect(mockLog.mock.calls).toEqual([
      ['Usage: brisa dev [options]'],
      ['Options:'],
      [' -p, --port         Specify port'],
      [' -d, --debug        Enable debug mode'],
      [
        " -s, --skip-tauri Skip open desktop app when 'output': 'desktop' in brisa.config.ts",
      ],
      [' --help             Show help'],
    ]);
    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should debug "brisa dev" command', async () => {
    process.argv = ['bun', 'brisa', 'dev', '--debug'];

    await main();

    expect(mockSpawnSync.mock.calls[0]).toEqual([
      'bun',
      ['--version'],
      { stdio: 'ignore' },
    ]);
    expect(mockSpawnSync.mock.calls[1]).toEqual([
      'bun',
      [BUILD_PATH, 'DEV'],
      devOptions,
    ]);
    expect(mockSpawnSync.mock.calls[2]).toEqual([
      'bun',
      ['--inspect', SERVE_PATH, '3000', 'DEV'],
      devOptions,
    ]);
  });

  it('should build a web app in development with the flag --dev', async () => {
    process.argv = ['bun', 'brisa', 'build', '--dev'];

    await main();

    expect(mockSpawnSync).toHaveBeenCalledTimes(2); // bun --version
    expect(mockSpawnSync.mock.calls[0]).toEqual([
      'bun',
      ['--version'],
      { stdio: 'ignore' },
    ]);

    expect(mockSpawnSync.mock.calls[1]).toEqual([
      'bun',
      [BUILD_PATH, 'DEV'],
      devOptions,
    ]);
  });

  it('should build a desktop app with "brisa dev" command and output=desktop', async () => {
    process.argv = ['bun', 'brisa', 'dev'];

    mock.module(path.join(FIXTURES, 'brisa.config.ts'), () => ({
      default: {
        output: 'desktop',
      },
    }));

    await main();

    expect(mockSpawnSync.mock.calls[0]).toEqual([
      'bun',
      ['--version'],
      { stdio: 'ignore' },
    ]);
    expect(mockSpawnSync.mock.calls[1]).toEqual([
      'bun',
      ['i', '@tauri-apps/cli@2.0.0-beta.21'],
      devOptions,
    ]);
    expect(mockSpawnSync.mock.calls[2]).toEqual([
      'bunx',
      [
        'tauri',
        'init',
        '-A',
        'test',
        '-W',
        'test',
        '-D',
        '../out',
        '--dev-url',
        'http://localhost:3000',
        '--before-dev-command',
        "echo 'Starting desktop app...'",
        '--before-build-command',
        "echo 'Building desktop app...'",
      ],
      devOptions,
    ]);

    expect(mockSpawnSync.mock.calls[3]).toEqual([
      'bun',
      [BUILD_PATH, 'DEV'],
      devOptions,
    ]);

    expect(mockSpawnSync.mock.calls[4]).toEqual([
      'bunx',
      ['tauri', 'dev', '--port', '3000'],
      devOptions,
    ]);
  });

  it('should build a desktop app with "brisa dev" command and output=desktop in another port', async () => {
    process.argv = ['bun', 'brisa', 'dev', '--port', '5000'];

    mock.module(path.join(FIXTURES, 'brisa.config.ts'), () => ({
      default: {
        output: 'desktop',
      },
    }));

    await main();

    expect(mockSpawnSync.mock.calls[0]).toEqual([
      'bun',
      ['--version'],
      { stdio: 'ignore' },
    ]);
    expect(mockSpawnSync.mock.calls[1]).toEqual([
      'bun',
      ['i', '@tauri-apps/cli@2.0.0-beta.21'],
      devOptions,
    ]);
    expect(mockSpawnSync.mock.calls[2]).toEqual([
      'bunx',
      [
        'tauri',
        'init',
        '-A',
        'test',
        '-W',
        'test',
        '-D',
        '../out',
        '--dev-url',
        'http://localhost:5000',
        '--before-dev-command',
        "echo 'Starting desktop app...'",
        '--before-build-command',
        "echo 'Building desktop app...'",
      ],
      devOptions,
    ]);

    expect(mockSpawnSync.mock.calls[3]).toEqual([
      'bun',
      [BUILD_PATH, 'DEV'],
      devOptions,
    ]);

    expect(mockSpawnSync.mock.calls[4]).toEqual([
      'bunx',
      ['tauri', 'dev', '--port', '5000'],
      devOptions,
    ]);
  });

  it('should skip desktop "brisa dev" command', async () => {
    process.argv = ['bun', 'brisa', 'dev', '--skip-tauri'];

    mock.module(path.join(FIXTURES, 'brisa.config.ts'), () => ({
      default: {
        output: 'desktop',
      },
    }));

    await main();

    expect(mockSpawnSync.mock.calls[0]).toEqual([
      'bun',
      ['--version'],
      { stdio: 'ignore' },
    ]);
    expect(mockSpawnSync.mock.calls[1]).toEqual([
      'bun',
      [BUILD_PATH, 'DEV'],
      devOptions,
    ]);
    expect(mockSpawnSync.mock.calls[2]).toEqual([
      'bun',
      [SERVE_PATH, '3000', 'DEV'],
      devOptions,
    ]);
  });

  it('should execute "brisa build" command with default options', async () => {
    process.argv = ['bun', 'brisa', 'build'];

    await main();

    expect(mockSpawnSync.mock.calls[0]).toEqual([
      'bun',
      ['--version'],
      { stdio: 'ignore' },
    ]);
    expect(mockSpawnSync.mock.calls[1]).toEqual([
      'bun',
      [path.join(import.meta.dir, 'out', 'cli', 'build.js'), 'PROD'],
      prodOptions,
    ]);
  });

  it('should execute "brisa build --help" command', async () => {
    process.argv = ['bun', 'brisa', 'build', '--help'];

    await main();

    expect(mockSpawnSync).toHaveBeenCalledTimes(1); // bun --version
    expect(mockLog.mock.calls).toEqual([
      ['Usage: brisa build [options]'],
      ['Options:'],
      [
        " -s, --skip-tauri Skip open tauri app when 'output': 'desktop' | 'android' | 'ios' in brisa.config.ts",
        ' -d, --dev        Build for development (useful for custom server)',
      ],
      [' --help             Show help'],
    ]);
  });

  it('should build a desktop app with "brisa build" command and output=desktop', async () => {
    process.argv = ['bun', 'brisa', 'build'];

    mock.module(path.join(FIXTURES, 'brisa.config.ts'), () => ({
      default: {
        output: 'desktop',
      },
    }));

    await main();

    expect(mockSpawnSync.mock.calls[0]).toEqual([
      'bun',
      ['--version'],
      { stdio: 'ignore' },
    ]);
    expect(mockSpawnSync.mock.calls[1]).toEqual([
      'bun',
      ['i', '@tauri-apps/cli@2.0.0-beta.21'],
      prodOptions,
    ]);
    expect(mockSpawnSync.mock.calls[2]).toEqual([
      'bunx',
      [
        'tauri',
        'init',
        '-A',
        'test',
        '-W',
        'test',
        '-D',
        '../out',
        '--dev-url',
        'http://localhost:3000',
        '--before-dev-command',
        "echo 'Starting desktop app...'",
        '--before-build-command',
        "echo 'Building desktop app...'",
      ],
      prodOptions,
    ]);

    expect(mockSpawnSync.mock.calls[3]).toEqual([
      'bun',
      [BUILD_PATH, 'PROD'],
      prodOptions,
    ]);

    expect(mockSpawnSync.mock.calls[4]).toEqual([
      'bunx',
      ['tauri', 'build'],
      prodOptions,
    ]);
  });

  it('should skip desktop "brisa build" command', async () => {
    process.argv = ['bun', 'brisa', 'build', '--skip-tauri'];

    mock.module(path.join(FIXTURES, 'brisa.config.ts'), () => ({
      default: {
        output: 'desktop',
      },
    }));

    await main();

    expect(mockSpawnSync.mock.calls[0]).toEqual([
      'bun',
      ['--version'],
      { stdio: 'ignore' },
    ]);
    expect(mockSpawnSync.mock.calls[1]).toEqual([
      'bun',
      [path.join(import.meta.dir, 'out', 'cli', 'build.js'), 'PROD'],
      prodOptions,
    ]);
  });

  it('should build a android app with "brisa build" command and output=android', async () => {
    process.argv = ['bun', 'brisa', 'build'];

    mock.module(path.join(FIXTURES, 'brisa.config.ts'), () => ({
      default: {
        output: 'android',
      },
    }));

    await main();

    expect(mockSpawnSync.mock.calls[0]).toEqual([
      'bun',
      ['--version'],
      { stdio: 'ignore' },
    ]);
    expect(mockSpawnSync.mock.calls[1]).toEqual([
      'bun',
      ['i', '@tauri-apps/cli@2.0.0-beta.21'],
      prodOptions,
    ]);
    expect(mockSpawnSync.mock.calls[2]).toEqual([
      'bunx',
      [
        'tauri',
        'init',
        '-A',
        'test',
        '-W',
        'test',
        '-D',
        '../out',
        '--dev-url',
        'http://localhost:3000',
        '--before-dev-command',
        "echo 'Starting android app...'",
        '--before-build-command',
        "echo 'Building android app...'",
      ],
      prodOptions,
    ]);

    expect(mockSpawnSync.mock.calls[3]).toEqual([
      'bun',
      [BUILD_PATH, 'PROD'],
      prodOptions,
    ]);

    expect(mockSpawnSync.mock.calls[4]).toEqual([
      'bunx',
      ['tauri', 'android', 'build'],
      prodOptions,
    ]);
  });

  it('should skip android "brisa build" command', async () => {
    process.argv = ['bun', 'brisa', 'build', '--skip-tauri'];

    mock.module(path.join(FIXTURES, 'brisa.config.ts'), () => ({
      default: {
        output: 'android',
      },
    }));

    await main();

    expect(mockSpawnSync.mock.calls[0]).toEqual([
      'bun',
      ['--version'],
      { stdio: 'ignore' },
    ]);
    expect(mockSpawnSync.mock.calls[1]).toEqual([
      'bun',
      [path.join(import.meta.dir, 'out', 'cli', 'build.js'), 'PROD'],
      prodOptions,
    ]);
  });

  it('should build a ios app with "brisa build" command and output=ios', async () => {
    process.argv = ['bun', 'brisa', 'build'];

    mock.module(path.join(FIXTURES, 'brisa.config.ts'), () => ({
      default: {
        output: 'ios',
      },
    }));

    await main();

    expect(mockSpawnSync.mock.calls[0]).toEqual([
      'bun',
      ['--version'],
      { stdio: 'ignore' },
    ]);
    expect(mockSpawnSync.mock.calls[1]).toEqual([
      'bun',
      ['i', '@tauri-apps/cli@2.0.0-beta.21'],
      prodOptions,
    ]);
    expect(mockSpawnSync.mock.calls[2]).toEqual([
      'bunx',
      [
        'tauri',
        'init',
        '-A',
        'test',
        '-W',
        'test',
        '-D',
        '../out',
        '--dev-url',
        'http://localhost:3000',
        '--before-dev-command',
        "echo 'Starting ios app...'",
        '--before-build-command',
        "echo 'Building ios app...'",
      ],
      prodOptions,
    ]);

    expect(mockSpawnSync.mock.calls[3]).toEqual([
      'bun',
      [BUILD_PATH, 'PROD'],
      prodOptions,
    ]);

    expect(mockSpawnSync.mock.calls[4]).toEqual([
      'bunx',
      ['tauri', 'ios', 'build'],
      prodOptions,
    ]);
  });

  it('should skip ios "brisa build" command', async () => {
    process.argv = ['bun', 'brisa', 'build', '--skip-tauri'];

    mock.module(path.join(FIXTURES, 'brisa.config.ts'), () => ({
      default: {
        output: 'ios',
      },
    }));

    await main();

    expect(mockSpawnSync.mock.calls[0]).toEqual([
      'bun',
      ['--version'],
      { stdio: 'ignore' },
    ]);
    expect(mockSpawnSync.mock.calls[1]).toEqual([
      'bun',
      [path.join(import.meta.dir, 'out', 'cli', 'build.js'), 'PROD'],
      prodOptions,
    ]);
  });

  it('should execute "brisa start" command with default options', async () => {
    process.argv = ['bun', 'brisa', 'start'];

    await main();

    expect(mockSpawnSync).toHaveBeenCalledTimes(2); // bun --version
    expect(mockSpawnSync.mock.calls[0]).toEqual([
      'bun',
      ['--version'],
      { stdio: 'ignore' },
    ]);
    expect(mockSpawnSync.mock.calls[1]).toEqual([
      'bun',
      [SERVE_PATH, '3000', 'PROD'],
      prodOptions,
    ]);
  });

  it('should execute "brisa start --help" command', async () => {
    process.argv = ['bun', 'brisa', 'start', '--help'];

    await main();

    expect(mockSpawnSync).toHaveBeenCalledTimes(1); // bun --version
    expect(mockLog.mock.calls).toEqual([
      ['Usage: brisa start [options]'],
      ['Options:'],
      [' -p, --port    Specify port'],
      [' --help        Show help'],
    ]);

    expect(mockExit).toHaveBeenCalledWith(0);
  });

  it('should execute "brisa start" command with custom port', async () => {
    process.argv = ['bun', 'brisa', 'start', '--port', '5000'];

    await main();

    expect(mockSpawnSync).toHaveBeenCalledTimes(2); // bun --version
    expect(mockSpawnSync.mock.calls[0]).toEqual([
      'bun',
      ['--version'],
      { stdio: 'ignore' },
    ]);
    expect(mockSpawnSync.mock.calls[1]).toEqual([
      'bun',
      [SERVE_PATH, '5000', 'PROD'],
      prodOptions,
    ]);
  });

  it('should execute .bun/bin/bun when the bun command is not found', async () => {
    mockSpawnSync = spyOn(cp, 'spawnSync').mockImplementation(
      () => ({ status: 1 }) as any,
    );

    process.argv = ['bun', 'brisa', 'start'];

    await main();

    expect(mockSpawnSync).toHaveBeenCalledTimes(2); // bun --version

    expect(mockSpawnSync.mock.calls[0]).toEqual([
      'bun',
      ['--version'],
      { stdio: 'ignore' },
    ]);

    expect(mockSpawnSync.mock.calls[1][0]).toBe(
      path.join(process.env.HOME!, '.bun', 'bin', 'bun'),
    );
    expect(mockSpawnSync.mock.calls[1]).toEqual([
      path.join(process.env.HOME!, '.bun', 'bin', 'bun'),
      [SERVE_PATH, '3000', 'PROD'],
      prodOptions,
    ]);
  });

  it('should "brisa add mdx" command integrate MDX', async () => {
    process.argv = ['bun', 'brisa', 'add', 'mdx'];

    await main();

    expect(mockSpawnSync).toHaveBeenCalledTimes(3);
    expect(mockSpawnSync.mock.calls[0]).toEqual([
      'bun',
      ['--version'],
      { stdio: 'ignore' },
    ]);
    expect(mockSpawnSync.mock.calls[1]).toEqual([
      'bun',
      ['i', '@mdx-js/esbuild@3.0.1'],
      devOptions,
    ]);
    expect(mockSpawnSync.mock.calls[2]).toEqual([
      'bun',
      [MDX_PATH],
      devOptions,
    ]);
  });

  it('should "brisa add --help" command provide help', async () => {
    process.argv = ['bun', 'brisa', 'add', '--help'];

    await main();

    expect(mockSpawnSync).toHaveBeenCalledTimes(1);
    expect(mockLog.mock.calls).toEqual([
      ['Integration not found'],
      ['Usage: brisa add <integration>'],
      ['Integrations:'],
      [' mdx          Add mdx integration'],
      [' tailwindcss  Add tailwindcss integration'],
      ['Options:'],
      [' --help       Show help'],
    ]);
  });
});
