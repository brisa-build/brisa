import { describe, it, expect } from 'bun:test';
import path from 'node:path';
import getReadableStreamFromPath from '.';

const FIXTURES_PATH = path.join(import.meta.dir, '..', '..', '__fixtures__');

describe('utils/get-readable-stream-from-path', () => {
  describe('Node.js runtime', () => {
    it('should return a ReadableStream from a file path', () => {
      const filePath = path.join(FIXTURES_PATH, 'public', 'favicon.ico');
      const stream = getReadableStreamFromPath(filePath, false);

      expect(stream).toBeInstanceOf(ReadableStream);
    });

    it('should return null if the file does not exist', () => {
      const filePath = 'file-not-exist.txt';
      const stream = getReadableStreamFromPath(filePath, false);

      expect(stream).toBeNull();
    });

    it('should resolve "Some text :D" from the stream', async () => {
      const filePath = path.join(
        FIXTURES_PATH,
        'public',
        'some-dir',
        'some-text.txt',
      );
      const stream = getReadableStreamFromPath(filePath, false);
      const reader = stream!.getReader();
      let result = '';
      let done = false;

      while (!done) {
        const { value, done: isDone } = await reader.read();
        done = isDone;

        if (value) {
          result += new TextDecoder().decode(value);
        }
      }

      expect(result).toBe('Some text :D');
    });
  });

  describe('Bun runtime', () => {
    it('should return a ReadableStream from a file path', () => {
      const filePath = path.join(FIXTURES_PATH, 'public', 'favicon.ico');
      const stream = getReadableStreamFromPath(filePath, true);

      expect(stream).toBeInstanceOf(ReadableStream);
    });

    it('should return null if the file does not exist', () => {
      const filePath = 'file-not-exist.txt';
      const stream = getReadableStreamFromPath(filePath, true);

      expect(stream).toBeNull();
    });

    it('should resolve "Some text :D" from the stream', async () => {
      const filePath = path.join(
        FIXTURES_PATH,
        'public',
        'some-dir',
        'some-text.txt',
      );
      const stream = getReadableStreamFromPath(filePath, true);
      const reader = stream!.getReader();
      let result = '';
      let done = false;

      while (!done) {
        const { value, done: isDone } = await reader.read();
        done = isDone;

        if (value) {
          result += new TextDecoder().decode(value);
        }
      }

      expect(result).toBe('Some text :D');
    });
  });
});
