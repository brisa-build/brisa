import fs from 'node:fs';
import { pipeline } from 'node:stream';

export default function getReadableStreamFromPath(
  filePath: string,
  isBunRuntime = typeof Bun !== 'undefined',
) {
  if (!fs.existsSync(filePath)) return null;

  // Bun runtime
  if (isBunRuntime) {
    return Bun.file(filePath).stream();
  }

  // Node.js runtime
  const readStream = fs.createReadStream(filePath);

  return new ReadableStream({
    start(controller) {
      pipeline(
        readStream,
        async function* (source) {
          for await (const chunk of source) {
            controller.enqueue(chunk);
          }
          controller.close();
        },
        (err) => {
          if (err) {
            controller.error(err);
          }
        },
      );
    },
  });
}
