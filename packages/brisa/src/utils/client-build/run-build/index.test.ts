import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import path from 'node:path';
import { mkdir, rm } from 'node:fs/promises';

import { getConstants } from '@/constants';
import { writeTempEntrypoint } from '../fs-temp-entrypoint-manager';
import { runBuild } from '.';

const SRC = path.join(import.meta.dir, '..', '..', '..', '__fixtures__');
const build = path.join(import.meta.dir, '.temp-test-files');

describe('client build -> runBuild', () => {
  beforeEach(async () => {
    await mkdir(path.join(build, '_brisa'), { recursive: true });
    globalThis.mockConstants = {
      ...getConstants(),
      SRC_DIR: SRC,
      BUILD_DIR: build,
    };
  });

  afterEach(async () => {
    await rm(build, { recursive: true, force: true });
    globalThis.mockConstants = undefined;
  });

  it('should run the build with a single entrypoint', async () => {
    const { entrypoint } = await writeTempEntrypoint({
      webComponentsList: {
        'custom-counter': path.join(
          SRC,
          'web-components',
          'custom-counter.tsx',
        ),
      },
      useContextProvider: false,
      pagePath: 'foo',
    });
    const { success, logs, outputs, analysis } = await runBuild(
      [entrypoint],
      {},
    );

    expect(success).toBe(true);
    expect(logs).toHaveLength(0);
    expect(outputs).toHaveLength(1);
    expect(outputs[0].size).toBeGreaterThan(0);
    expect(outputs[0].text()).resolves.toContain(
      ' defineElement("custom-counter"',
    );
    expect(analysis).toEqual({
      [entrypoint]: {
        useI18n: false,
        i18nKeys: new Set(),
      },
    });
  });

  it('should run the build with multiple entrypoints', async () => {
    const { entrypoint: entrypoint1 } = await writeTempEntrypoint({
      webComponentsList: {
        'custom-counter': path.join(
          SRC,
          'web-components',
          'custom-counter.tsx',
        ),
      },
      useContextProvider: false,
      pagePath: 'foo',
    });
    const { entrypoint: entrypoint2 } = await writeTempEntrypoint({
      webComponentsList: {
        'web-component': path.join(SRC, 'web-components', 'web-component.tsx'),
      },
      useContextProvider: false,
      pagePath: 'bar',
    });

    const { success, logs, outputs, analysis } = await runBuild(
      [entrypoint1, entrypoint2],
      {},
    );

    expect(success).toBe(true);
    expect(logs).toHaveLength(0);
    expect(outputs).toHaveLength(2);
    expect(outputs[0].size).toBeGreaterThan(0);
    expect(outputs[1].size).toBeGreaterThan(0);
    expect(outputs[0].text()).resolves.toContain(
      ' defineElement("custom-counter"',
    );
    expect(outputs[1].text()).resolves.toContain(
      ' defineElement("web-component"',
    );
    expect(analysis).toEqual({
      [entrypoint1]: {
        useI18n: false,
        i18nKeys: new Set(),
      },
      [entrypoint2]: {
        useI18n: true,
        i18nKeys: new Set(['hello']),
      },
    });
  });
});
