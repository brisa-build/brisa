import {
  expect,
  it,
  describe,
  spyOn,
  beforeEach,
  afterEach,
  type Mock,
} from 'bun:test';
import { getBrisaPandaCSSDependencies } from './dependencies' with {
  type: 'macro',
};
import path from 'node:path';
import cp from 'node:child_process';
import fs from 'node:fs';
import integratePandaCSS from '.';
import { boldLog } from '@/utils/log/log-color';

const ROOT_DIR = path.join(import.meta.dirname, 'out');
const LOG_PREFIX = {
  WAIT: 'WAIT',
  INFO: 'INFO',
  TICK: 'TICK',
  WARN: 'WARN',
} as any;
const DEPS = Object.entries(getBrisaPandaCSSDependencies());

let mockSpawnSync: Mock<typeof cp.spawnSync>;
let mockWriteFileSync: Mock<typeof fs.writeFileSync>;
let mockLog: Mock<typeof console.log>;

describe('integratePandaCSS', () => {
  beforeEach(() => {
    fs.mkdirSync(ROOT_DIR);
    globalThis.mockConstants = { ROOT_DIR, LOG_PREFIX };
    mockSpawnSync = spyOn(cp, 'spawnSync').mockReturnValue(null as any);
    mockWriteFileSync = spyOn(fs, 'writeFileSync');
    mockLog = spyOn(console, 'log');
  });

  afterEach(() => {
    globalThis.mockConstants = undefined;
    fs.rmdirSync(ROOT_DIR, { recursive: true });
    mockSpawnSync.mockRestore();
    mockWriteFileSync.mockRestore();
    mockLog.mockRestore();
  });

  it('should create a default brisa.config.ts', () => {
    const expectedDependencies = DEPS.map(
      ([name, version]) => `${name}@${version}`,
    );
    integratePandaCSS();

    expect(mockSpawnSync).toHaveBeenCalledWith(
      'bun',
      ['add', ...expectedDependencies],
      { stdio: 'inherit' },
    );

    expect(mockSpawnSync).toHaveBeenCalledWith('bun', ['panda', 'init', '-p']);

    expect(mockWriteFileSync.mock.calls[0][0]).toContain('brisa.config.ts');
    expect(mockWriteFileSync.mock.calls[0][1]).toContain(
      'import type { Configuration } from "brisa";\nimport PandaCSS from \'brisa-pandacss\';\n\nexport default {\n  integrations: [PandaCSS()],\n} as Configuration;\n\n',
    );
    expect(mockLog).toHaveBeenCalledWith(
      LOG_PREFIX.INFO,
      LOG_PREFIX.TICK,
      'PandaCSS configuration added!',
    );
  });

  it('should not create a default brisa.config.ts if it already exists', () => {
    const expectedDependencies = DEPS.map(
      ([name, version]) => `${name}@${version}`,
    );

    fs.writeFileSync(
      path.join(ROOT_DIR, 'brisa.config.ts'),
      'export default {} as Configuration;',
    );
    mockWriteFileSync.mockRestore();
    integratePandaCSS();

    expect(mockSpawnSync).toHaveBeenCalledWith(
      'bun',
      ['add', ...expectedDependencies],
      { stdio: 'inherit' },
    );

    expect(mockSpawnSync).toHaveBeenCalledWith('bun', ['panda', 'init', '-p']);

    expect(mockWriteFileSync).not.toHaveBeenCalled();
    expect(mockLog).toHaveBeenCalledWith(
      LOG_PREFIX.WARN,
      `Almost there! We detected an existing ${boldLog('brisa.config.ts')} file.`,
    );
  });
});
