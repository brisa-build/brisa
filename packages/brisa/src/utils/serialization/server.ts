import { serialize } from '.';

// In the server is not handled by setAttribute, so we need to escape single
// quotes, to allow attribute='value' to be serialized correctly without
// breaking the attribute quotes.
//
// We put it in a separate function to avoid unnecessary bytes in the client.
export function serializeServer(value: unknown) {
  return serialize(value).replace(/'/g, '\\u0027');
}
