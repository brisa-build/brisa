import { describe, expect, it, beforeEach, afterEach, spyOn } from 'bun:test';
import fs from 'node:fs';
import isInPathList from '.';

const listPath = 'foo.txt';
let mockExistsSync: ReturnType<typeof spyOn>;
let mockReadFileSync: ReturnType<typeof spyOn>;

describe('utils / isInPathList', () => {
  beforeEach(() => {
    mockExistsSync = spyOn(fs, 'existsSync').mockReturnValue(true);
  });

  afterEach(() => {
    mockExistsSync.mockRestore();
  });

  it('should return false when the list is empty', async () => {
    mockReadFileSync = spyOn(fs, 'readFileSync').mockReturnValue('');
    const result = await isInPathList(listPath, {
      route: { filePath: '/foo' },
    } as any);
    expect(result).toBeFalse();
  });

  it('should return true when the path is in the list', async () => {
    mockReadFileSync = spyOn(fs, 'readFileSync').mockReturnValue('/foo\n/bar');
    const result = await isInPathList(listPath, {
      route: { filePath: '/foo' },
    } as any);
    expect(result).toBeTrue();
  });

  it('should return false when the path is not in the list', async () => {
    mockReadFileSync = spyOn(fs, 'readFileSync').mockReturnValue('/foo\n/bar');
    const result = await isInPathList(listPath, {
      route: { filePath: '/baz' },
    } as any);
    expect(result).toBeFalse();
  });

  it('should return true when the path is in the list with different separators', async () => {
    mockReadFileSync = spyOn(fs, 'readFileSync').mockReturnValue(
      '\\foo\n\\bar',
    );
    const result = await isInPathList(listPath, {
      route: { filePath: '/foo' },
    } as any);
    expect(result).toBeTrue();
  });

  it('should return true when the path is in the list with multi different separators', async () => {
    mockReadFileSync = spyOn(fs, 'readFileSync').mockReturnValue(
      '\\foo\\bar\n\\baz',
    );
    const result = await isInPathList(listPath, {
      route: { filePath: '/foo/bar' },
    } as any);
    expect(result).toBeTrue();
  });

  it('should return true when the path is in the list with multi duplicated different separators', async () => {
    mockReadFileSync = spyOn(fs, 'readFileSync').mockReturnValue(
      '\\\\foo\\\\bar\n\\\\baz',
    );
    const result = await isInPathList(listPath, {
      route: { filePath: '/foo/bar' },
    } as any);
    expect(result).toBeTrue();
  });

  it('should return true when the path is in the list with different separators in other way', async () => {
    mockReadFileSync = spyOn(fs, 'readFileSync').mockReturnValue('/foo\n/bar');
    const result = await isInPathList(listPath, {
      route: { filePath: '\\foo' },
    } as any);
    expect(result).toBeTrue();
  });

  it('should return true when the path is in the list with different separators in other way', async () => {
    mockReadFileSync = spyOn(fs, 'readFileSync').mockReturnValue(
      '/foo/bar\n/bar',
    );
    const result = await isInPathList(listPath, {
      route: { filePath: '\\foo\\bar' },
    } as any);
    expect(result).toBeTrue();
  });

  it('should return false when the list is empty', async () => {
    mockReadFileSync = spyOn(fs, 'readFileSync').mockReturnValue('');
    const result = await isInPathList(listPath, {
      route: { filePath: '/baz' },
    } as any);
    expect(result).toBeFalse();
  });
});
