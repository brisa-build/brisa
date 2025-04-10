import {
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
  mock,
  jest,
} from 'bun:test';
import path from 'node:path';
import fs from 'node:fs';
import getClientFilesFromRequest from '.';
import { getConstants } from '@/constants';

const FIXTURES = path.join(import.meta.dir, '..', '..', '__fixtures__');

describe('getClientFilesFromRequest', () => {
  const noExistingRoute = path.join(FIXTURES, 'no-existing', 'route.tsx');
  const baseRoutePath = path.join(
    FIXTURES,
    'pages',
    'page-with-web-component.js',
  );
  const baseClientFile = path.join(
    FIXTURES,
    'pages',
    'page-with-web-component-hash.js',
  );
  const baseClientFileI18n = path.join(
    FIXTURES,
    'pages',
    'page-with-web-component-hash-es.js',
  );
  const baseClientFileTxt = path.join(
    FIXTURES,
    'pages-client',
    'page-with-web-component.txt',
  );

  beforeEach(() => {
    globalThis.mockConstants = {
      BUILD_DIR: '/build',
    };
  });

  afterEach(() => {
    globalThis.mockConstants = undefined;
  });

  it('returns all nulls if clientFile does not exist', () => {
    const result = getClientFilesFromRequest({
      i18n: { locale: 'en' },
      route: { filePath: noExistingRoute, src: noExistingRoute },
    } as any);

    expect(result).toEqual({
      clientFile: noExistingRoute,
      pathPageI18n: null,
      filenameI18n: null,
      filename: null,
    });
  });

  it('returns expected values with valid client file and locale', () => {
    const result = getClientFilesFromRequest({
      i18n: { locale: 'es' },
      route: { filePath: baseRoutePath, src: baseRoutePath },
    } as any);

    expect(result.clientFile).toBe(baseClientFileTxt);
    expect(result.filename).toBe(baseClientFile);
    expect(result.filenameI18n).toBe(baseClientFileI18n);
    expect(result.pathPageI18n).toBe(
      path.join('/build', 'pages-client', baseClientFileI18n),
    );
  });

  it('returns expected values without locale', () => {
    const result = getClientFilesFromRequest({
      i18n: {},
      route: { filePath: baseRoutePath, src: baseRoutePath },
    } as any);

    expect(result.clientFile).toBe(baseClientFileTxt);
    expect(result.filename).toBe(baseClientFile);
    expect(result.filenameI18n).toBe(null);
    expect(result.pathPageI18n).toBe(null);
  });

  it('returns all nulls if no route.filePath', () => {
    const result = getClientFilesFromRequest({
      i18n: { locale: 'fr' },
      route: {},
    } as any);

    expect(result).toEqual({
      clientFile: null,
      pathPageI18n: null,
      filenameI18n: null,
      filename: null,
    });
  });
});
