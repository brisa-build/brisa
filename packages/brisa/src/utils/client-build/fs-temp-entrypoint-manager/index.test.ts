import { describe, expect, it, beforeEach, afterEach } from 'bun:test';
import path from 'node:path';
import { rm, readFile, exists, mkdir } from 'node:fs/promises';
import { normalizeHTML } from '@/helpers';
import {
  removeTempEntrypoint,
  removeTempEntrypoints,
  writeTempEntrypoint,
} from '.';

const TEMP_DIR = path.join(import.meta.dirname, '.temp-test-files');

describe('client build -> fs-temp-entrypoint-manager', () => {
  beforeEach(async () => {
    globalThis.mockConstants = {
      PAGES_DIR: TEMP_DIR,
      BUILD_DIR: TEMP_DIR,
    };
    await mkdir(path.join(TEMP_DIR, '_brisa'), { recursive: true });
  });

  afterEach(async () => {
    delete globalThis.mockConstants;
    await rm(TEMP_DIR, { recursive: true });
  });

  it('should write and remove temp entrypoint', async () => {
    const { entrypoint } = await writeTempEntrypoint({
      webComponentsList: {
        'test-component': 'test-component.ts',
      },
      useContextProvider: false,
      pagePath: '/test-page.ts',
    });
    expect(await exists(entrypoint)).toBeTrue();
    expect(normalizeHTML(await readFile(entrypoint, 'utf-8'))).toBe(
      normalizeHTML(`
      import testComponent from "test-component.ts";
      
      const defineElement = (name, component) => name && !customElements.get(name) && customElements.define(name, component);
      
      defineElement("test-component", testComponent);
    `),
    );
    await removeTempEntrypoint(entrypoint);
    expect(await exists(entrypoint)).toBeFalse();
  });

  it('should write and remove temp entrypoints', async () => {
    const { entrypoint: entrypoint1 } = await writeTempEntrypoint({
      webComponentsList: {
        'test-component-1': 'test-component-1.ts',
      },
      useContextProvider: false,
      pagePath: '/test-page-1.ts',
    });
    const { entrypoint: entrypoint2 } = await writeTempEntrypoint({
      webComponentsList: {
        'test-component-2': 'test-component-2.ts',
      },
      useContextProvider: false,
      pagePath: '/test-page-2.ts',
    });
    expect(await exists(entrypoint1)).toBeTrue();
    expect(await exists(entrypoint2)).toBeTrue();
    await removeTempEntrypoints([entrypoint1, entrypoint2]);
    expect(await exists(entrypoint1)).toBeFalse();
    expect(await exists(entrypoint2)).toBeFalse();
  });
});
