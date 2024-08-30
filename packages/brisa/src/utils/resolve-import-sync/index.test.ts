import resolveImportSync from '@/utils/resolve-import-sync';
import { describe, expect, it, spyOn } from 'bun:test';
import path from 'node:path';

describe('utils/resolve-import-sync', () => {
  it('should throw an error if the file does not exist', () => {
    expect(() => resolveImportSync('non-existent-file')).toThrow();
  });

  it('should resolve a library', () => {
    expect(resolveImportSync('brisa')).toBe(
      path.resolve(
        import.meta.dir,
        '..',
        '..',
        '..',
        'node_modules',
        'brisa',
        'out',
        'core',
        'index.js',
      ),
    );
  });

  it('should resolve a file using TypeScript alias from process.cwd', () => {
    const mock = spyOn(process, 'cwd').mockReturnValue(import.meta.dir);
    const output = resolveImportSync('@/utils/resolve-import-sync');
    const expected = path.resolve(import.meta.dir, 'index.ts');

    mock.mockRestore();
    expect(output).toBe(expected);
  });

  it('should resolve a file using TypeScript alias with a parent', () => {
    expect(
      resolveImportSync('@/utils/resolve-import-sync', import.meta.url),
    ).toBe(path.resolve(import.meta.dir, 'index.ts'));
  });

  it('should resolve a relative file', () => {
    expect(resolveImportSync('./index', import.meta.url)).toBe(
      path.resolve(import.meta.dir, 'index.ts'),
    );
  });
});
