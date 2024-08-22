import { getConstants } from '@/constants';
import { describe, it, expect, spyOn, beforeEach, afterEach } from 'bun:test';
import path from 'node:path';
import fs from 'node:fs';
import buildStandalone from '.';

const FIXTURES = path.resolve(import.meta.dirname, '..', '..', '__fixtures__');
const WEB_COMPONENTS_PATH = path.resolve(FIXTURES, 'web-components');
const BUILD_DIR = path.resolve(import.meta.dirname, 'out');
const constants = getConstants();
let mockLog: ReturnType<typeof spyOn>;
let mockProcessExit: ReturnType<typeof spyOn>;

describe('cli/buildStandalone', () => {
  beforeEach(() => {
    mockLog = spyOn(console, 'log').mockImplementation(() => {});
    mockProcessExit = spyOn(process, 'exit').mockImplementation(
      () => null as never,
    );
    globalThis.mockConstants = {
      ...constants,
      BUILD_DIR,
      SRC_DIR: FIXTURES,
    };
  });

  afterEach(() => {
    mockLog.mockRestore();
    mockProcessExit.mockRestore();
    fs.rmSync(BUILD_DIR, { recursive: true });
  });

  it('should log "No standalone components provided" when no components are provided', async () => {
    await buildStandalone([], []);

    const logs = mockLog.mock.calls.flat().join('');
    expect(logs).toContain('No standalone components provided');
    expect(process.exit).toHaveBeenCalled();
  });

  it('should build standalone web components', async () => {
    const standaloneWC = [
      path.resolve(WEB_COMPONENTS_PATH, 'custom-counter.tsx'),
    ];
    const standaloneSC: string[] = [];

    await buildStandalone(standaloneWC, standaloneSC);

    expect(mockLog.mock.calls[0][0]).toBe(constants.LOG_PREFIX.WAIT);
    expect(mockLog.mock.calls[0][1]).toBe(
      `🚀 building your standalone components...`,
    );

    expect(mockLog.mock.calls[1][0]).toBe(constants.LOG_PREFIX.INFO);

    expect(mockLog.mock.calls[2][0]).toBe(constants.LOG_PREFIX.INFO);
    expect(mockLog.mock.calls[2][1]).toBe(`Standalone components:`);

    expect(mockLog.mock.calls[3][0]).toBe(constants.LOG_PREFIX.INFO);
    expect(mockLog.mock.calls[3][1]).toContain(
      path.join('web-components', 'custom-counter.client.js'),
    );

    expect(mockLog.mock.calls[4][0]).toBe(constants.LOG_PREFIX.INFO);
    expect(mockLog.mock.calls[4][1]).toContain(
      path.join('web-components', 'custom-counter.server.js'),
    );

    expect(mockLog.mock.calls[5][0]).toBe(constants.LOG_PREFIX.INFO);

    expect(mockLog.mock.calls[6][0]).toBe(constants.LOG_PREFIX.INFO);
    expect(mockLog.mock.calls[6][1]).toContain('✨  Done in');
  });
});