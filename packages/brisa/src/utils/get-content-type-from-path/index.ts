// I hope to remove this dependency in the future, but for now, it's necessary
// because is not supported in Node.js FileSystem api.
import mime from 'mime-types';

/**
 * Get the content type from a file path
 *
 * @todo TODO: Remove this in the future when we have a better solution in Node.js
 *
 *       Node issue: https://github.com/nodejs/node/issues/54595
 *
 *       In Bun is possible via Bun(file).type, but there are some differences, like:
 *       - test.js is text/javascript;charset=utf-8 instead of application/javascript;charset=utf-8
 */
export default function getContentTypeFromPath(path: string) {
  const mimeType = mime.lookup(path) || 'application/octet-stream';
  const charset = mime.charset(mimeType);
  const charsetSuffix = charset ? `;charset=${charset.toLowerCase()}` : '';

  return mimeType + charsetSuffix;
}
