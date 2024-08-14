import { agnosticReadableStreamToText } from '@/utils/readable-stream-to-text';
import { it, expect, describe } from 'bun:test';

describe('utils', () => {
  describe('readable-stream-to-text', () => {
    it('should convert a readable stream to text', async () => {
      const text = 'Hello, world!';
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(text));
          controller.close();
        },
      });

      const result = await agnosticReadableStreamToText(stream);

      expect(result).toBe(text);
    });

    it('should convert a readable stream to text with multiple chunks', async () => {
      const text = 'Hello, world!';
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(new TextEncoder().encode(text.slice(0, 6)));
          controller.enqueue(new TextEncoder().encode(text.slice(6)));
          controller.close();
        },
      });

      const result = await agnosticReadableStreamToText(stream);

      expect(result).toBe(text);
    });

    it('should convert empty readable stream to empty text', async () => {
      const stream = new ReadableStream({
        start(controller) {
          controller.close();
        },
      });

      const result = await agnosticReadableStreamToText(stream);

      expect(result).toBe('');
    });

    it('should correctly handle binary data in the readable stream', async () => {
      // "Hello" in ASCII
      const binaryData = new Uint8Array([72, 101, 108, 108, 111]);
      const stream = new ReadableStream({
        start(controller) {
          controller.enqueue(binaryData);
          controller.close();
        },
      });

      const result = await agnosticReadableStreamToText(stream);

      expect(result).toBe('Hello');
    });
  });
});
