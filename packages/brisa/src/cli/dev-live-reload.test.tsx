import {
  describe,
  it,
  expect,
  mock,
  afterEach,
  beforeEach,
  spyOn,
} from 'bun:test';
import { LiveReloadScript, activateHotReload } from './dev-live-reload';
import fs from 'node:fs';
import cp from 'node:child_process';

describe('dev-live-reload', () => {
  it('should return live reload script for port 3000', () => {
    const output = LiveReloadScript({ port: 3000, children: null }) as any;

    expect(output[2][0][2][1].html).toContain(
      'ws://localhost:3000/__brisa_live_reload__',
    );
  });

  it('should return live reload script for port 4000', () => {
    const output = LiveReloadScript({ port: 4000, children: null }) as any;

    expect(output[2][0][2][1].html).toContain(
      'ws://localhost:4000/__brisa_live_reload__',
    );
  });

  it('should use native navigation when the websocket message is "hot-reload"', () => {
    const output = LiveReloadScript({ port: 4000, children: null }) as any;

    expect(output[2][0][2][1].html).toContain('window._xm = "native";');
  });
});

describe('activateHotReload', () => {
  let mockWatch: ReturnType<typeof spyOn>;
  let mockKillProcess: ReturnType<typeof mock>;
  let mockSpawn: ReturnType<typeof spyOn>;
  let mockExistsSync: ReturnType<typeof mock>;
  let mockStatSync: ReturnType<typeof mock>;

  beforeEach(() => {
    mockKillProcess = mock();
    mockWatch = spyOn(fs, 'watch').mockImplementation(
      () =>
        ({
          close: mock(),
        }) as any,
    );
    mockExistsSync = spyOn(fs, 'existsSync').mockReturnValue(true);
    mockStatSync = spyOn(fs, 'statSync').mockReturnValue({ size: 1 } as any);
    mockSpawn = spyOn(cp, 'spawn');
    mockSpawn.mockImplementation(() => ({
      kill: mockKillProcess,
      on: mock(),
    }));
  });

  afterEach(() => {
    mockWatch.mockRestore();
    mockKillProcess.mockRestore();
    mockSpawn.mockRestore();
    mockExistsSync.mockRestore();
    mockStatSync.mockRestore();
  });

  it('should initialize the watcher', async () => {
    await activateHotReload();
    expect(mockWatch).toHaveBeenCalledWith(
      expect.any(String),
      { recursive: true },
      expect.any(Function),
    );
  });

  it('should NOT kill the current process on the first process', async () => {
    const recompile = await activateHotReload();
    await recompile('test-file.js');

    expect(mockKillProcess).not.toHaveBeenCalled();
    expect(mockSpawn).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.any(Object),
    );
  });

  it('should kill the current process and spawn a new one on file change', async () => {
    const recompile = await activateHotReload();
    await recompile('test-file.js');
    await recompile('test-file.js');

    expect(mockKillProcess).toHaveBeenCalled();
    expect(mockSpawn).toHaveBeenCalledWith(
      expect.any(String),
      expect.any(Array),
      expect.any(Object),
    );
  });
});
