import { describe, it, expect, beforeEach, afterEach } from 'bun:test';
import fs from 'node:fs';
import path from 'node:path';
import { createDenoJSON } from '.';

describe('createDenoJSON', () => {
  beforeEach(() => {
    globalThis.mockConstants = {
      BUILD_DIR: import.meta.dirname,
      ROOT_DIR: import.meta.dirname,
      SRC_DIR: import.meta.dirname,
    };
  });

  afterEach(() => {
    delete globalThis.mockConstants;
    fs.rmSync(path.join(import.meta.dirname, 'deno.json'));
  });

  it('should create the default deno.json file when no existing one', () => {
    createDenoJSON();
    expect(
      JSON.parse(
        fs.readFileSync(path.join(import.meta.dirname, 'deno.json'), 'utf-8'),
      ),
    ).toEqual({
      imports: {
        'fs/promises': 'node:fs/promises',
        path: 'node:path',
        child_process: 'node:child_process',
      },
      permissions: {
        read: true,
        write: true,
        run: 'inherit',
      },
    });
  });

  it('should merge with the existing deno.json file in the root directory', () => {
    // Ensure is not taking src dir
    globalThis.mockConstants!.SRC_DIR = path.join(import.meta.dirname, 'src');
    fs.writeFileSync(
      path.join(import.meta.dirname, 'deno.json'),
      JSON.stringify({
        permissions: {
          read: false,
        },
      }),
    );
    createDenoJSON();
    expect(
      JSON.parse(
        fs.readFileSync(path.join(import.meta.dirname, 'deno.json'), 'utf-8'),
      ),
    ).toEqual({
      imports: {
        'fs/promises': 'node:fs/promises',
        path: 'node:path',
        child_process: 'node:child_process',
      },
      permissions: {
        read: false,
        write: true,
        run: 'inherit',
      },
    });
  });

  it('should merge with the existing deno.json file in the src directory', () => {
    // Ensure is taking src dir
    globalThis.mockConstants!.ROOT_DIR = path.join(
      import.meta.dirname,
      'not-exist',
    );

    fs.writeFileSync(
      path.join(import.meta.dirname, 'deno.json'),
      JSON.stringify({
        imports: {
          cluster: 'node:cluster',
        },
        foo: 'bar',
      }),
    );
    createDenoJSON();
    expect(
      JSON.parse(
        fs.readFileSync(path.join(import.meta.dirname, 'deno.json'), 'utf-8'),
      ),
    ).toEqual({
      foo: 'bar',
      imports: {
        'fs/promises': 'node:fs/promises',
        path: 'node:path',
        child_process: 'node:child_process',
        cluster: 'node:cluster',
      },
      permissions: {
        read: true,
        write: true,
        run: 'inherit',
      },
    });
  });
});
